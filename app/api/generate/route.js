import { buildFaceBasePrompt, buildFinalPrompt, buildSecondPassPrompt } from '../../lib/prompts';
import { errorResponse, getClient, httpError, imageModel, readImages } from '../../lib/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

function toDataUrl(file) {
  return file.arrayBuffer().then((ab) => {
    const mime = file.type || 'image/jpeg';
    const b64 = Buffer.from(ab).toString('base64');
    return `data:${mime};base64,${b64}`;
  });
}

async function runImageTool(client, { responseModel, imageModelName, prompt, inputImages = [], previousResponseId = null }) {
  const content = [
    {
      type: 'input_text',
      text: prompt
    }
  ];

  for (const img of inputImages) {
    content.push({
      type: 'input_image',
      image_url: img,
      detail: 'auto'
    });
  }

  const payload = {
    model: responseModel,
    input: [
      {
        role: 'user',
        content
      }
    ],
    tools: [
      {
        type: 'image_generation',
        model: imageModelName,
        size: '1152x1536',
        quality: 'max',
        output_format: 'jpeg',
        output_compression: 95
      }
    ],
    tool_choice: { type: 'image_generation' }
  };

  if (previousResponseId) {
    payload.previous_response_id = previousResponseId;
  }

  const response = await client.responses.create(payload);

  const imageCall = response.output?.find((item) => item.type === 'image_generation_call');
  const b64 = imageCall?.result;
  if (!b64) throw httpError(502, 'Responses API에서 이미지 결과를 받지 못했습니다.');

  return {
    responseId: response.id,
    b64,
    model: response.model || responseModel
  };
}

async function generateTwoPass(client, uploadables, formValues, imageModelName) {
  const responseModel = process.env.OPENAI_RESPONSE_MODEL || 'gpt-6-astra';
  const inputImages = await Promise.all(uploadables.map((file) => toDataUrl(file)));

  // 1차: 얼굴 기준 이미지
  const basePrompt = buildFaceBasePrompt(formValues);
  const pass1 = await runImageTool(client, {
    responseModel,
    imageModelName,
    prompt: basePrompt,
    inputImages
  });

  // 2차: 최종 하이엔드 리터칭
  const secondPrompt = buildSecondPassPrompt(formValues);
  const pass2 = await runImageTool(client, {
    responseModel,
    imageModelName,
    prompt: secondPrompt,
    previousResponseId: pass1.responseId
  });

  return {
    b64: pass2.b64,
    responseModel: pass2.model,
    pipeline: 'responses-two-pass'
  };
}

async function generateFallback(client, uploadables, formValues, imageModelName) {
  const prompt = buildFinalPrompt(formValues);

  const result = await client.images.edit({
    model: imageModelName,
    image: uploadables,
    prompt,
    size: '1152x1536',
    quality: 'max',
    output_format: 'jpeg',
    output_compression: 95,
    n: 1
  });

  const b64 = result?.data?.[0]?.b64_json;
  if (!b64) throw httpError(502, 'Images API에서 이미지 결과를 받지 못했습니다.');

  return {
    b64,
    responseModel: null,
    pipeline: 'images-edit-fallback'
  };
}

export async function POST(request) {
  try {
    const client = getClient();
    const form = await request.formData();
    const uploadables = await readImages(form);

    const formValues = {
      gender: String(form.get('gender') || ''),
      outfitKind: String(form.get('outfitKind') || ''),
      suitColor: String(form.get('suitColor') || ''),
      casualItem: String(form.get('casualItem') || ''),
      colorKey: String(form.get('colorKey') || ''),
      expression: String(form.get('expression') || ''),
      background: String(form.get('background') || '')
    };

    const model = imageModel();

    let generated;
    try {
      generated = await generateTwoPass(client, uploadables, formValues, model);
    } catch (responsesError) {
      console.error('Two-pass Responses generation failed; falling back to Images API.', responsesError);
      generated = await generateFallback(client, uploadables, formValues, model);
    }

    return Response.json({
      image: `data:image/jpeg;base64,${generated.b64}`,
      model,
      responseModel: generated.responseModel,
      pipeline: generated.pipeline
    });
  } catch (error) {
    return errorResponse(error);
  }
}

import { buildFaceBasePrompt, buildFinalPrompt, buildSecondPassPrompt, buildThirdPassPrompt } from '../../lib/prompts';
import { errorResponse, getClient, httpError, imageModel, readImages, responseModel, toDataUrl, withFidelity } from '../../lib/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

async function runImageTool(client, { responseModelName, imageModelName, prompt, inputImages = [], previousResponseId = null }) {
  const content = [{ type: 'input_text', text: prompt }];
  for (const img of inputImages) {
    content.push({ type: 'input_image', image_url: img, detail: 'high' });
  }

  const response = await withFidelity((fidelity) => {
    const payload = {
      model: responseModelName,
      input: [{ role: 'user', content }],
      tools: [
        {
          type: 'image_generation',
          model: imageModelName,
          size: '1152x1536',
          quality: 'max',
          output_format: 'jpeg',
          output_compression: 95,
          ...(fidelity ? { input_fidelity: 'high' } : {})
        }
      ],
      tool_choice: { type: 'image_generation' }
    };
    if (previousResponseId) payload.previous_response_id = previousResponseId;
    return client.responses.create(payload);
  });

  const imageCall = response.output?.find((item) => item.type === 'image_generation_call');
  const b64 = imageCall?.result;
  if (!b64) throw httpError(502, 'Responses API에서 이미지 결과를 받지 못했습니다.');

  return { responseId: response.id, b64, model: response.model || responseModelName };
}

async function generateThreePass(client, uploadables, formValues, imageModelName) {
  const responseModelName = responseModel();
  const inputImages = await Promise.all(uploadables.map((file) => toDataUrl(file)));

  // 1차: 얼굴 기준 이미지
  const pass1 = await runImageTool(client, {
    responseModelName, imageModelName, prompt: buildFaceBasePrompt(formValues), inputImages
  });

  // 2차: 얼굴 전용 사진관 고보정(하이키 뷰티)
  const pass2 = await runImageTool(client, {
    responseModelName, imageModelName, prompt: buildSecondPassPrompt(formValues), previousResponseId: pass1.responseId
  });

  // 3차: 의상, 배경, 최종 구도 및 마감
  const pass3 = await runImageTool(client, {
    responseModelName, imageModelName, prompt: buildThirdPassPrompt(formValues), previousResponseId: pass2.responseId
  });

  return { b64: pass3.b64, responseModel: pass3.model, pipeline: 'responses-three-pass-premium' };
}

async function generateFallback(client, uploadables, formValues, imageModelName) {
  const prompt = buildFinalPrompt(formValues);

  const result = await withFidelity((fidelity) => client.images.edit({
    model: imageModelName,
    image: uploadables,
    prompt,
    size: '1152x1536',
    quality: 'max',
    output_format: 'jpeg',
    output_compression: 95,
    ...(fidelity ? { input_fidelity: 'high' } : {}),
    n: 1
  }));

  const b64 = result?.data?.[0]?.b64_json;
  if (!b64) throw httpError(502, 'Images API에서 이미지 결과를 받지 못했습니다.');

  return { b64, responseModel: null, pipeline: 'images-edit-fallback' };
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

    // 선택값 오류는 생성 전에 바로 알린다(대체 경로로 넘어가지 않도록)
    buildThirdPassPrompt(formValues);
    buildFaceBasePrompt(formValues);

    const model = imageModel();

    let generated;
    try {
      generated = await generateThreePass(client, uploadables, formValues, model);
    } catch (responsesError) {
      console.error('Premium three-pass Responses generation failed; falling back to Images API.', responsesError);
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

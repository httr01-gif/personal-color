import { buildFinalPrompt } from '../../lib/prompts';
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

async function generateWithResponses(client, uploadables, prompt, imageModelName) {
  const imageInputs = await Promise.all(
    uploadables.map(async (file) => ({
      type: 'input_image',
      image_url: await toDataUrl(file),
      detail: 'auto'
    }))
  );

  const response = await client.responses.create({
    model: process.env.OPENAI_RESPONSE_MODEL || 'gpt-6-astra',
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: prompt
          },
          ...imageInputs
        ]
      }
    ],
    tools: [
      {
        type: 'image_generation',
        model: imageModelName,
        action: 'edit',
        size: '1152x1536',
        quality: 'max',
        output_format: 'jpeg',
        output_compression: 95
      }
    ],
    tool_choice: { type: 'image_generation' }
  });

  const imageCall = response.output?.find((item) => item.type === 'image_generation_call');
  const b64 = imageCall?.result;
  if (!b64) throw httpError(502, 'Responses API에서 이미지 결과를 받지 못했습니다.');

  return {
    b64,
    responseModel: response.model || process.env.OPENAI_RESPONSE_MODEL || 'gpt-6-astra'
  };
}

async function generateWithImagesApi(client, uploadables, prompt, imageModelName) {
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

  return { b64, responseModel: null };
}

export async function POST(request) {
  try {
    const client = getClient();
    const form = await request.formData();
    const uploadables = await readImages(form);

    const prompt = buildFinalPrompt({
      gender: String(form.get('gender') || ''),
      outfitKind: String(form.get('outfitKind') || ''),
      suitColor: String(form.get('suitColor') || ''),
      casualItem: String(form.get('casualItem') || ''),
      colorKey: String(form.get('colorKey') || ''),
      expression: String(form.get('expression') || ''),
      background: String(form.get('background') || '')
    });

    const model = imageModel();

    let generated;
    try {
      // Responses API의 이미지 생성 도구는 입력 프롬프트를 자동 최적화하고
      // 여러 참고 이미지를 함께 문맥으로 사용할 수 있어 최종 증명사진에 우선 사용한다.
      generated = await generateWithResponses(client, uploadables, prompt, model);
    } catch (responsesError) {
      console.error('Responses API image generation failed; falling back to Images API.', responsesError);

      // 계정의 메인 모델 접근 권한이나 Responses 이미지 도구에 문제가 생기더라도
      // 기존 Images API 편집 방식으로 계속 생성할 수 있도록 안전하게 폴백한다.
      generated = await generateWithImagesApi(client, uploadables, prompt, model);
    }

    return Response.json({
      image: `data:image/jpeg;base64,${generated.b64}`,
      model,
      responseModel: generated.responseModel,
      pipeline: generated.responseModel ? 'responses-image-generation' : 'images-edit-fallback'
    });
  } catch (error) {
    return errorResponse(error);
  }
}

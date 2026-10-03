import { buildFinalPrompt } from '../../lib/prompts';
import { errorResponse, getClient, httpError, imageModel, readImages, responseModel, toDataUrl, withFidelity } from '../../lib/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

// 1회 통합 생성: 헤어 정돈, 밝은 얼굴, 의상, 배경을 한 번에 완성
async function generateSinglePass(client, uploadables, formValues, imageModelName) {
  const responseModelName = responseModel();
  const prompt = buildFinalPrompt(formValues);
  const inputImages = await Promise.all(uploadables.map((file) => toDataUrl(file)));
  const content = [{ type: 'input_text', text: prompt }];
  for (const img of inputImages) content.push({ type: 'input_image', image_url: img, detail: 'high' });

  const response = await withFidelity((fidelity) => client.responses.create({
    model: responseModelName,
    input: [{ role: 'user', content }],
    tools: [{
      type: 'image_generation',
      model: imageModelName,
      size: '1152x1536',
      quality: 'max',
      output_format: 'jpeg',
      output_compression: 95,
      ...(fidelity ? { input_fidelity: 'high' } : {})
    }],
    tool_choice: { type: 'image_generation' }
  }));

  const imageCall = response.output?.find((item) => item.type === 'image_generation_call');
  const b64 = imageCall?.result;
  if (!b64) throw httpError(502, 'Responses API에서 이미지 결과를 받지 못했습니다.');

  return { b64, responseModel: response.model || responseModelName, pipeline: 'responses-single-pass-studio' };
}

// 대체 방식: Responses 경로가 실패했을 때 같은 프롬프트로 이미지 편집 API 사용
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

  return { b64, responseModel: null, pipeline: 'images-edit-fallback-single-pass' };
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

    // 선택값 오류는 생성 전에 바로 알린다
    buildFinalPrompt(formValues);

    const model = imageModel();

    let generated;
    try {
      generated = await generateSinglePass(client, uploadables, formValues, model);
    } catch (responsesError) {
      console.error('Single-pass Responses generation failed; falling back to Images API.', responsesError);
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

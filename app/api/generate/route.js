import { buildFinalPrompt } from '../../lib/prompts';
import { errorResponse, getClient, httpError, imageModel, readImages, responseModel, toDataUrl, withFidelity } from '../../lib/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

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

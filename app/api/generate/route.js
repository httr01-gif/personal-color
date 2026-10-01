import { buildFinalPrompt } from '../../lib/prompts';
import { errorResponse, getClient, httpError, imageModel, readImages } from '../../lib/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

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
    const result = await client.images.edit({
      model,
      image: uploadables,
      prompt,
      size: '1152x1536',
      quality: 'max',
      output_format: 'jpeg',
      output_compression: 95,
      n: 1
    });

    const b64 = result?.data?.[0]?.b64_json;
    if (!b64) throw httpError(502, '이미지 결과를 받지 못했습니다.');
    return Response.json({ image: `data:image/jpeg;base64,${b64}`, model });
  } catch (error) {
    return errorResponse(error);
  }
}

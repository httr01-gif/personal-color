import { buildComparePrompt } from '../../lib/prompts';
import { errorResponse, getClient, httpError, imageModel, readImages, withFidelity } from '../../lib/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

// 퍼스널 컬러 비교 사진 1장 생성 (화면에서 색별로 동시에 요청)
export async function POST(request) {
  try {
    const client = getClient();
    const form = await request.formData();
    const uploadables = await readImages(form);
    const prompt = buildComparePrompt(String(form.get('colorKey') || ''));

    const result = await withFidelity((fidelity) => client.images.edit({
      model: imageModel(),
      image: uploadables,
      prompt,
      size: '1152x1536',
      quality: 'medium',
      output_format: 'jpeg',
      output_compression: 80,
      ...(fidelity ? { input_fidelity: 'high' } : {}),
      n: 1
    }));

    const b64 = result?.data?.[0]?.b64_json;
    if (!b64) throw httpError(502, '비교 사진을 받지 못했습니다.');
    return Response.json({ image: `data:image/jpeg;base64,${b64}` });
  } catch (error) {
    return errorResponse(error);
  }
}

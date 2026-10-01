import OpenAI, { toFile } from 'openai';

export function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

export function getClient() {
  if (!process.env.OPENAI_API_KEY) throw httpError(500, 'OPENAI_API_KEY가 설정되지 않았습니다.');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export function imageModel() {
  return process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-sunburst';
}

export async function readImages(form) {
  const files = form.getAll('images').filter((v) => v && typeof v.arrayBuffer === 'function');

  if (files.length < 2) throw httpError(400, '사진은 2장 이상 올려 주세요.');
  if (files.length > 3) throw httpError(400, '사진은 최대 3장까지 사용할 수 있습니다.');

  const out = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const buf = Buffer.from(await f.arrayBuffer());
    out.push(await toFile(buf, f.name || `reference-${i + 1}.jpg`, { type: f.type || 'image/jpeg' }));
  }
  return out;
}

export function errorResponse(error) {
  console.error(error);
  const status = Number(error?.status) || 500;
  return Response.json({ error: error?.message || '이미지 생성 중 오류가 발생했습니다.' }, { status });
}

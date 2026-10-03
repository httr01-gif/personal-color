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

export function responseModel() {
  return process.env.OPENAI_RESPONSE_MODEL || 'gpt-6-astra';
}

// 진단(사진 분석)용 모델: 따로 지정하지 않으면 응답 모델을 그대로 사용
export function visionModel() {
  return process.env.OPENAI_VISION_MODEL || responseModel();
}

// 얼굴 유지 옵션(input_fidelity)을 먼저 넣어 요청하고,
// 모델이 이 옵션을 지원하지 않아 거절하면 옵션을 빼고 한 번 더 요청한다.
export async function withFidelity(run) {
  try {
    return await run(true);
  } catch (error) {
    const msg = String(error?.message || '').toLowerCase();
    const rejected = Number(error?.status) === 400 && (msg.includes('input_fidelity') || msg.includes('unknown parameter') || msg.includes('unsupported'));
    if (!rejected) throw error;
    console.warn('input_fidelity 미지원 모델로 판단되어 옵션 없이 다시 요청합니다.');
    return run(false);
  }
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

export async function toDataUrl(file) {
  const ab = await file.arrayBuffer();
  const mime = file.type || 'image/jpeg';
  return `data:${mime};base64,${Buffer.from(ab).toString('base64')}`;
}

export function errorResponse(error) {
  console.error(error);
  const status = Number(error?.status) || 500;
  return Response.json({ error: error?.message || '이미지 생성 중 오류가 발생했습니다.' }, { status });
}

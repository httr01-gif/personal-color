import { buildDiagnosePrompt } from '../../lib/prompts';
import { FAVORITES, SEASON_ORDER } from '../../lib/colors';
import { errorResponse, getClient, httpError, toDataUrl, visionModel } from '../../lib/server';

export const runtime = 'nodejs';
export const maxDuration = 120;

// 좋아하는 색(학습지)이 속한 계절에 더해 주는 점수
const FAVORITE_BONUS = 15;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    undertone: { type: 'string', enum: ['warm', 'cool'] },
    scores: {
      type: 'object',
      additionalProperties: false,
      properties: {
        spring: { type: 'number' },
        summer: { type: 'number' },
        autumn: { type: 'number' },
        winter: { type: 'number' }
      },
      required: ['spring', 'summer', 'autumn', 'winter']
    },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    reason: { type: 'string' },
    teacher_note: { type: 'string' }
  },
  required: ['undertone', 'scores', 'confidence', 'reason', 'teacher_note']
};

function topSeason(scores) {
  return SEASON_ORDER.reduce((best, s) => (scores[s] > scores[best] ? s : best), SEASON_ORDER[0]);
}

function parseJson(text) {
  const clean = String(text || '').replace(/```json|```/g, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  return JSON.parse(clean.slice(start, end + 1));
}

// 퍼스널 컬러 진단: 사진 분석 점수 + 좋아하는 색 가산점
export async function POST(request) {
  try {
    const client = getClient();
    const form = await request.formData();
    const files = form.getAll('images').filter((v) => v && typeof v.arrayBuffer === 'function');
    if (files.length < 1) throw httpError(400, '사진이 필요합니다.');
    const favoriteKey = String(form.get('favorite') || '');

    const content = [{ type: 'input_text', text: buildDiagnosePrompt() }];
    for (const f of files.slice(0, 3)) {
      content.push({ type: 'input_image', image_url: await toDataUrl(f), detail: 'high' });
    }

    const response = await client.responses.create({
      model: visionModel(),
      input: [{ role: 'user', content }],
      text: { format: { type: 'json_schema', name: 'personal_color', strict: true, schema: SCHEMA } }
    });

    const data = parseJson(response.output_text);
    const photoScores = {};
    let sum = 0;
    for (const s of SEASON_ORDER) {
      photoScores[s] = Math.max(0, Number(data?.scores?.[s]) || 0);
      sum += photoScores[s];
    }
    if (!sum) throw httpError(502, '진단 결과를 받지 못했습니다.');
    for (const s of SEASON_ORDER) photoScores[s] = Math.round((photoScores[s] / sum) * 100);

    const favoriteSeason = FAVORITES.find((f) => f.key === favoriteKey)?.season || null;
    const finalScores = { ...photoScores };
    if (favoriteSeason) finalScores[favoriteSeason] += FAVORITE_BONUS;

    return Response.json({
      photoSeason: topSeason(photoScores),
      favoriteSeason,
      season: topSeason(finalScores),
      photoScores,
      finalScores,
      undertone: data.undertone,
      confidence: data.confidence,
      reason: data.reason,
      teacherNote: data.teacher_note
    });
  } catch (error) {
    return errorResponse(error);
  }
}

import { COLORS, LIGHT_COLORS, SUIT_COLORS } from './colors';
import { httpError } from './server';

const COMMON_RULES = `
- 모든 입력 이미지는 동일 인물 참고용이다. 2~3장의 사진을 함께 참고해 같은 사람의 얼굴 특징을 안정적으로 파악한다.
- 최종 결과는 반드시 동일 인물로 명확하게 알아볼 수 있어야 한다.
- 눈, 코, 입, 얼굴형, 전체 인상, 연령감, 피부톤, 헤어라인 같은 핵심 정체성은 유지한다.
- 촬영 당시의 어색한 고개 각도, 시선 불일치, 조명 문제, 흐트러진 머리, 일시적인 표정 긴장은 자연스럽게 개선할 수 있다.
- 목표는 과한 미용 보정이 아니라, 실제 전문 스튜디오에서 다시 촬영한 듯한 자연스럽고 완성도 높은 프로필 사진이다.
- 피부는 깨끗하게 정돈하되, 인위적으로 다른 얼굴처럼 만들지 않는다.
- 장애 유무를 추정하거나 외형으로 표현하지 않는다. 촬영 순간의 제약을 보완해 본인의 단정하고 자신감 있는 모습을 구현한다.
- 안경을 쓴 경우 안경의 전체적인 디자인은 유지하고, 렌즈 반사와 왜곡은 줄인다.`;

const BACKGROUNDS = {
  white: '깨끗한 흰색 스튜디오 배경',
  blue: '채도가 낮은 아주 옅은 블루그레이 스튜디오 배경',
  gray: '중성적인 아주 연한 쿨그레이 스튜디오 배경',
  // 퍼스널 컬러 연계 파스텔 그라데이션 (한국 사진관 취업사진 스타일)
  peach: '부드러운 파스텔 피치 그라데이션 스튜디오 배경 (soft pastel peach gradient)',
  pink: '부드러운 파스텔 로즈핑크 그라데이션 스튜디오 배경 (soft pastel rose-pink gradient)',
  lavender: '부드러운 파스텔 라벤더 그라데이션 스튜디오 배경 (soft pastel lavender gradient)',
  beige: '부드러운 웜 베이지 그라데이션 스튜디오 배경 (soft warm beige gradient)'
};

const EXPRESSIONS = {
  bigsmile: '활짝 웃는 얼굴: 윗니가 가지런히 보이는 밝고 환한 미소, 입꼬리가 좌우 대칭으로 올라감, 깨끗하고 자연스러운 치아',
  smile: '웃는 얼굴: 입을 다문 자연스럽고 자신감 있는 미소',
  calm: '차분한 얼굴: 편안하고 자신감 있는 중립 표정'
};

function colorText(key) {
  const c = COLORS[key];
  if (!c) throw httpError(400, '색 선택값이 올바르지 않습니다.');
  return `${c.label}(${c.hex})`;
}

function innerColor(key) {
  return LIGHT_COLORS.includes(key) ? '연한 하늘색' : '깨끗한 흰색';
}

// 학생 선택값을 의상 설명으로 조합 (허용된 값만 사용)
export function buildClothing({ gender, outfitKind, suitColor, casualItem, colorKey }) {
  const color = colorText(colorKey);
  const suit = SUIT_COLORS[suitColor]?.label;

  if (gender === 'male') {
    if (outfitKind === 'suit') {
      if (!suit) throw httpError(400, '정장 색을 선택해 주세요.');
      return `${suit} 남성 정장 재킷, 순백색 드레스 셔츠, 단색 딥 네이비 실크 넥타이. 넥타이는 무늬나 스트라이프 없이 단색으로 한다. 셔츠 깃과 넥타이 매듭은 정중앙에 반듯하게 정렬한다.`;
    }
    if (outfitKind === 'casual') {
      if (casualItem === 'shirt') return `${color} 단색 옥스퍼드 남방(깃 있는 셔츠), 넥타이 없음.`;
      if (casualItem === 'knit') return `${color} 라운드넥 니트, 안쪽에 ${innerColor(colorKey)} 셔츠 깃이 보이도록 레이어드, 넥타이 없음.`;
      throw httpError(400, '남방 또는 니트를 선택해 주세요.');
    }
  }

  if (gender === 'female') {
    if (outfitKind === 'suit') {
      if (!suit) throw httpError(400, '정장 색을 선택해 주세요.');
      return `${suit} 여성용 테일러드 재킷, 안쪽에는 깨끗한 흰색 블라우스. 넥타이 없음. 재킷과 블라우스는 주름 없이 단정하고 고급스럽게 표현한다.`;
    }
    if (outfitKind === 'blouse') return `${color} 단정한 블라우스, 넥타이 없음.`;
    if (outfitKind === 'cardigan') return `${color} 단정한 가디건, 안쪽에 ${innerColor(colorKey)} 이너, 넥타이 없음.`;
  }

  throw httpError(400, '옷 선택값이 올바르지 않습니다.');
}



// 1차: 여러 참고사진에서 가장 안정적인 정면 얼굴 기준 이미지를 만든다.
export function buildFaceBasePrompt(sel) {
  const expression = EXPRESSIONS[sel.expression];
  if (!expression) throw httpError(400, '표정을 선택해 주세요.');
  const genderText = sel.gender === 'female' ? '여학생' : '남학생';

  return `
Use all 2–3 uploaded reference photos as references of the SAME PERSON.

Create one premium BASE PORTRAIT of this ${genderText}. This is pass 1 of a premium three-pass workflow.

TOP PRIORITY:
Build the most stable, flattering, camera-ready front-facing version of the same person's face as the foundation for a premium studio profile.

IDENTITY:
- Keep the person clearly recognizable.
- Preserve distinctive eyes, nose, mouth, ears, overall proportions and identity.
- Do not copy temporary camera distortion, awkward head angle, uneven gaze, tense mouth posture, poor lighting or messy hair.
- Identity preservation does not mean minimal correction.

FACE AND GAZE:
- Correct the head to a natural front-facing position.
- Make both eyes naturally look into the camera.
- Balance temporary asymmetry caused by expression or camera angle.
- Create this expression: ${expression}
- Keep the result realistic and clearly the same person.

HAIR:
- Preserve natural hairline and hair color.
- Tidy fringe, side silhouette and crown volume.
- Remove flyaways.
- Make the hair look prepared for a professional studio session.

SKIN:
- Apply a clearly polished premium-studio cleanup already in pass 1.
- Reduce redness, blemishes, uneven tone, under-eye darkness, and dullness.
- Keep realistic fine skin texture.
- Establish a clean, flattering, camera-ready face before the stronger beauty retouch in pass 2.
- Do not spend this pass on final clothing color.

BACKGROUND AND COMPOSITION:
- neutral pale gray studio background
- vertical 3:4
- centered front-facing upper body portrait
- eyes level with camera
- shoulders visible
- balanced headroom

The output of pass 1 should already look like a polished premium studio FACE BASE for the same person.
`;
}

// 2차: 얼굴 전용 하이엔드 리터칭. 이 단계에서는 의상과 배경보다 얼굴 완성도를 최우선으로 한다.
export function buildSecondPassPrompt(sel) {
  const expression = EXPRESSIONS[sel.expression];
  if (!expression) throw httpError(400, '표정을 선택해 주세요.');

  return `
Edit the previously generated premium base portrait. This is PASS 2: FACE-ONLY MAXIMUM HIGH-END RETOUCH.

ABSOLUTE PRIORITY:
Spend nearly all visual attention on the FACE, EYES, SKIN, HAIR, EXPRESSION, and FACIAL LIGHTING.
Do NOT focus on final clothing color or final background styling yet.
Do NOT settle for ordinary ID-photo cleanup. Aim for the heavily retouched look of a premium Korean photo studio (사진관) job-application photo: bright, clean, luminous, flawless.

IDENTITY:
- Keep the same person clearly recognizable.
- Preserve distinctive eye shape, nose, mouth, ears, facial proportions, and identity.
- Do not revert to the original awkward camera moment.
- Identity preservation must NOT be interpreted as conservative retouching.

EXPRESSION AND GAZE:
- Keep both eyes naturally directed at the camera.
- Refine temporary asymmetry caused by angle, tension, or blinking.
- Expression: ${expression}
- Make the face look calm, alert, confident, and professionally photographed.

SKIN — VERY STRONG KOREAN STUDIO BEAUTY RETOUCH:
- target look: bright, clear, porcelain-like skin with a soft, healthy, luminous glow
- remove virtually all blemishes, spots, redness, and visible pores
- even out skin tone completely across the whole face and neck
- reduce under-eye darkness and eye-bag shadows by about 80–90%
- reduce nasolabial and mouth-area shadows by about 70–80%
- reduce beard shadow and gray/blue tone around the mouth and chin by about 75–85%
- strongly reduce redness, blemishes, uneven tone, rough texture, and visible pores
- smooth tonal transitions across forehead, cheeks, nose, and chin
- brighten the central face visibly
- keep only a very fine realistic micro-texture so the skin does not look plastic or waxy
- remove the tired, dull, or heavy look from the face
- add a natural healthy flush to cheeks and lips

SOFT HIGHLIGHTS (KEEP CONTRAST LOW):
- brighten forehead center, nose bridge, upper cheekbones, and the under-eye triangle
- keep facial shadows very light and soft; do NOT add dark contour shadows
- keep the jawline clean and neat with only a very faint, soft definition
- do NOT darken the outer facial perimeter
- the face should look bright, fresh, and evenly lit, not dramatic

EYES — STRONG:
- preserve natural eye shape
- make iris and pupil detail noticeably sharper
- add small symmetrical natural studio catchlights
- reduce redness and dullness in the sclera
- clean eyelid and under-eye area
- make the gaze look brighter, clearer, and more engaged
- do not create unnaturally enlarged eyes

HAIR — STRONG PROFESSIONAL RESTYLING:
- preserve natural hairline and hair color
- refine fringe direction more decisively
- increase crown volume
- clean bulky or uneven side silhouette
- remove flyaways and stray hairs
- add realistic strand separation
- add subtle healthy shine
- make the hair look professionally styled immediately before a premium studio session

FACE-ONLY LIGHTING:
- high-key Korean photo-studio beauty lighting
- large soft frontal key light slightly above camera level, wrapping the whole face
- strong soft fill so there are almost no shadows on the face
- gentle separation light on hair
- bright, clean, low-contrast result like a premium 사진관 ID photo
- avoid dramatic, moody, or cinematic side lighting

COMPOSITION:
- keep the face large enough in frame for detailed retouching
- front-facing
- eyes level with camera
- shoulders may remain visible, but FACE QUALITY is the priority

FINAL PRIORITY FOR PASS 2:
Do not stop at natural cleanup.
Perform a clearly visible high-end beauty retouch.
The visual difference between pass 1 and pass 2 must be obvious.
The face should look like the same person after professional grooming, high-key beauty lighting, and extensive manual Photoshop retouching at a premium Korean photo studio.
`;
}

// 3차: 얼굴은 유지하고 의상, 배경, 최종 색감과 전체 증명사진 구도를 완성한다.
export function buildThirdPassPrompt(sel) {
  const clothing = buildClothing(sel);
  const background = BACKGROUNDS[sel.background];
  if (!background) throw httpError(400, '배경색을 선택해 주세요.');

  return `
Edit the previously retouched portrait. This is PASS 3: FINAL STUDIO FINISH.

MOST IMPORTANT:
Preserve the improved face, eyes, skin, expression, facial lighting, and professionally styled hair from PASS 2.
Do NOT weaken, undo, or average out the facial retouching from PASS 2.
Do NOT return to a more ordinary or less-polished face.

CLOTHING:
- ${clothing}
- perfect clean fit
- symmetrical collar and lapels
- remove wrinkles
- realistic fabric texture
- realistic neck-to-collar shadows
- no visible compositing artifacts

BACKGROUND:
- ${background}
- smooth seamless soft studio gradient background, slightly brighter behind the head
- clean pastel tone, never vivid or saturated
- no objects, no text, no patterns, no scenery

STUDIO LIGHTING:
- preserve the high-key facial beauty lighting from PASS 2
- add subtle rim light for hair/background separation
- keep the face bright, luminous, clean, and polished with very soft shadows
- do not add dramatic contrast or dark contouring

COMPOSITION:
- vertical 3:4 professional ID portrait
- perfectly front-facing
- face centered
- eyes level with camera
- shoulders visible
- balanced headroom
- stable near-symmetrical composition

FINAL QUALITY:
- premium Korean photo studio (사진관) heavily retouched job-application photo finish
- bright porcelain skin with a soft glow, clean pastel background, crisp outfit
- polished enough to feel clearly beyond a standard ID photo
- face remains strongly retouched and polished
- sharp eyes, eyebrows, and hair
- smooth refined skin with fine realistic texture
- no AI artifacts
- no waxy skin
- no over-HDR
- no distorted ears, eyes, teeth, collar, or lapels

FINAL PRIORITY:
This pass is for clothing, background, composition, and finishing ONLY.
The facial polish achieved in PASS 2 must be retained or improved, never reduced.
`;
}

// 최종 스튜디오 프로필 프롬프트
export function buildFinalPrompt(sel) {
  const clothing = buildClothing(sel);
  const color = colorText(sel.colorKey);
  const expression = EXPRESSIONS[sel.expression];
  const background = BACKGROUNDS[sel.background];
  if (!expression) throw httpError(400, '표정을 선택해 주세요.');
  if (!background) throw httpError(400, '배경색을 선택해 주세요.');
  const genderText = sel.gender === 'female' ? '여학생' : '남학생';

  return `
당신은 자연스럽고 완성도 높은 한국 스튜디오 프로필 사진을 만드는 전문가다.
입력된 2~3장의 사진은 모두 같은 사람이다. 모든 사진을 함께 참고하여, 같은 학생이 전문 사진관에서 새로 촬영한 것처럼 보이는 스튜디오 프로필 사진 1장을 생성한다.

[최우선 목표]
${COMMON_RULES}
- 대상: ${genderText}
- 원본 사진을 단순 보정한 느낌보다, 같은 학생이 스튜디오에서 다시 촬영한 듯한 결과를 만든다.
- 그러나 얼굴을 과하게 미화하거나 전혀 다른 사람처럼 바꾸지 않는다.
- 과한 뷰티 필터, 도자기처럼 뭉개진 피부, 과도한 리프팅, 과장된 눈 확대는 금지한다.

[표정과 시선]
- 표정: ${expression}
- 카메라를 자연스럽게 정면 응시한다.
- 굳은 표정, 어색한 시선, 순간적인 비대칭은 부드럽게 정돈한다.
- 전체 인상은 편안하고 자신감 있게 만든다.

[헤어]
- 기존 머리색과 자연스러운 헤어라인은 유지한다.
- 잔머리, 삐친 머리, 흐트러진 앞머리를 정돈한다.
- 과장된 스타일링보다, 사진관 촬영 직전 가볍게 손질한 듯 깔끔하고 자연스럽게 표현한다.

[의상]
- ${clothing}
- 캐주얼 의상, 블라우스, 니트, 가디건에서는 선택한 퍼스널 컬러 ${color}를 주된 의상색으로 사용한다.
- 정장 모드에서는 선택한 정장 색과 함께 셔츠 또는 블라우스를 단정하게 정리한다.
- 좌우 대칭이 안정적이고 핏이 깔끔해야 하며, 주름이나 합성 흔적이 없어야 한다.

[피부와 얼굴 보정]
- 피부는 밝고 깨끗하게 정돈하되 실제 피부 질감은 남긴다.
- 일시적인 잡티, 붉은기, 그림자, 다크서클, 입가와 턱 주변의 거친 톤은 자연스럽게 줄인다.
- 피부를 지나치게 매끈하게 뭉개지 말고, 건강하고 자연스러운 느낌을 유지한다.
- 눈, 눈썹, 입술, 치아는 선명하고 깨끗하게 보이게 정리하되 과장하지 않는다.
- 얼굴의 좌우 균형과 카메라 각도에서 생긴 일시적 왜곡은 완화할 수 있다.

[조명과 배경]
- 전문 스튜디오의 밝고 부드러운 조명을 적용한다.
- 얼굴에 심한 그림자가 생기지 않도록 하며, 전체 톤은 깨끗하고 맑게 유지한다.
- 배경: ${background}
- 부드럽고 깔끔한 스튜디오 배경만 사용한다. 사물, 글자, 로고, 패턴, 풍경은 넣지 않는다.

[구도]
- 세로 3:4 비율.
- 정면 상반신 프로필 사진.
- 얼굴은 중앙에 배치하고, 양쪽 어깨가 자연스럽게 보이게 한다.
- 눈높이는 카메라와 비슷하게 맞춘다.
- 학생 프로필 사진다운 안정적이고 단정한 구도를 사용한다.

[최종 품질]
- 결과물은 "학생 본인과 충분히 닮은" 스튜디오 프로필 사진이어야 한다.
- 자연스럽고 깨끗하며 선명한 결과를 만든다.
- 플라스틱 피부, 왜곡된 손·어깨·옷깃, 비정상적인 치아, 이상한 배경 경계, AI 아티팩트는 금지한다.
- 텍스트, 워터마크, 프레임, 꾸밈 스티커는 넣지 않는다.
`;
}

// 퍼스널 컬러 비교 사진 프롬프트 (옷 색만 변경, 약한 보정)
export function buildComparePrompt(colorKey) {
  const color = colorText(colorKey);
  return `
입력된 2~3장의 동일 인물 사진을 참고해 퍼스널 컬러 비교용 사진 1장을 생성한다.
이 사진은 같은 사람이 여러 색 옷을 입은 사진을 나란히 비교하기 위한 것이므로, 옷 색 외의 조건은 항상 똑같아야 한다.

[핵심 원칙]
${COMMON_RULES}

[의상]
- ${color} 단색 라운드넥 상의. 무늬, 로고, 글자 없음.
- 옷 색이 얼굴 바로 아래 목 부분까지 넓게 보이도록 한다.

[고정 조건]
- 표정: 편안한 중립 표정, 카메라 정면 응시.
- 조명: 정면에서 고르게 비추는 중립 흰색 조명(따뜻하거나 차가운 색 조명 금지).
- 배경: 아주 연한 회색 단색.
- 구도: 세로 3:4, 어깨까지 보이는 정면 상반신, 얼굴 중앙.

[보정]
- 피부 보정은 약하게 한다. 피부 톤, 피부색, 입술색, 머리색은 원본 그대로 유지한다.
- 색이 얼굴에 어떻게 어울리는지 비교하는 것이 목적이므로 얼굴 색을 옷 색에 맞춰 바꾸지 않는다.
`;
}

// 퍼스널 컬러 진단 프롬프트 (사진 분석 전용, 좋아하는 색은 서버 코드에서 별도 반영)
export function buildDiagnosePrompt() {
  return `
당신은 퍼스널 컬러 컨설턴트다. 입력된 2~3장의 사진은 모두 같은 학생이다.
사진 속 얼굴의 피부색, 눈동자 색, 머리카락 색, 피부와 머리카락 사이의 대비를 보고 4계절 퍼스널 컬러 유형을 판단한다.

[판단 규칙]
- 옷 색, 배경 색, 조명 색이 피부에 비친 것은 판단에서 제외한다. 교실 형광등이나 카메라 화이트밸런스로 피부가 노랗거나 푸르게 보일 수 있음을 감안한다.
- 여러 장의 사진을 종합해 가장 일관된 특징으로 판단한다.
- 봄(spring): 따뜻하고 밝고 화사함 / 여름(summer): 차갑고 밝고 부드러움 / 가을(autumn): 따뜻하고 깊고 차분함 / 겨울(winter): 차갑고 선명하고 대비가 큼
- 네 계절 점수의 합은 100으로 한다. 애매하면 점수를 비슷하게 나눈다.
- 외모를 평가하거나 장애 유무를 추정하지 않는다. 오직 색의 특징만 말한다.

[문장 작성]
- reason: 학생에게 직접 말하듯 아주 쉬운 한국어 1~2문장, 존댓말, 긍정적으로. 예: "피부가 맑고 밝아서 시원하고 부드러운 색이 얼굴을 환하게 해 줘요."
- teacher_note: 교사 확인용 관찰 내용 1문장(피부 바탕색, 눈동자, 머리색, 대비). 사진 조명이 판단을 어렵게 하면 그 사실도 적는다.

반드시 지정된 JSON 형식으로만 답한다.
`;
}

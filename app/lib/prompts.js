import { COLORS, LIGHT_COLORS, SUIT_COLORS } from './colors';
import { httpError } from './server';

const COMMON_RULES = `
- 모든 입력 이미지는 동일 인물 참고용이다. 2~3장의 사진을 종합해 그 사람의 고유한 얼굴 특징과 정체성을 안정적으로 파악한다.
- 최종 결과는 반드시 동일 인물로 명확하게 알아볼 수 있어야 한다.
- 눈, 코, 입의 기본적인 특징과 얼굴의 전체적인 인상은 유지한다.
- 그러나 촬영 당시의 어색한 시선, 표정, 얼굴 비대칭, 흐릿한 턱선, 좋지 않은 조명, 자세 왜곡, 흐트러진 헤어는 적극적으로 개선할 수 있다.
- 동일인 유지라는 조건을 최소한의 보정으로 해석하지 않는다.
- 일반 증명사진 수준은 목표가 아니다. 프리미엄 사진관 및 배우 프로필 수준의 강한 미용 보정을 기본값으로 적용한다.
- 눈을 비정상적으로 크게 만들거나 전혀 다른 사람의 얼굴로 변경하지 않는다.
- 장애 유무를 추정하거나 외형으로 표현하지 않는다. 촬영 순간의 제약을 보완해 본인의 단정하고 자신감 있는 모습을 구현한다.
- 안경을 쓴 경우 안경의 전체적인 디자인은 유지하고 렌즈 반사와 왜곡을 적극적으로 제거한다.`;

const BACKGROUNDS = {
  white: '깨끗한 흰색 스튜디오 배경',
  blue: '채도가 낮은 아주 옅은 블루그레이 스튜디오 배경',
  gray: '중성적인 아주 연한 쿨그레이 스튜디오 배경'
};

const EXPRESSIONS = {
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
Do NOT settle for ordinary ID-photo cleanup. Aim for premium Korean beauty-profile studio quality.

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

SKIN — VERY STRONG BEAUTY RETOUCH:
- reduce under-eye darkness and eye-bag shadows by about 80–90%
- reduce nasolabial and mouth-area shadows by about 70–80%
- reduce beard shadow and gray/blue tone around the mouth and chin by about 75–85%
- strongly reduce redness, blemishes, uneven tone, rough texture, and visible pores
- smooth tonal transitions across forehead, cheeks, nose, and chin
- brighten the central face visibly
- keep a fine realistic skin texture so the skin does not look plastic or waxy
- remove the tired, dull, or heavy look from the face

DODGE & BURN — STRONG:
- brighten forehead center
- create a clean narrow highlight along the nose bridge
- brighten upper cheekbones
- brighten the under-eye triangle clearly
- add soft controlled shadow beneath cheekbones
- define the jawline with a clean but realistic shadow below the jaw
- slightly darken the outer facial perimeter compared with the center
- improve facial dimensionality through light and shadow without making the person unrecognizable

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
- premium Korean beauty-studio lighting
- large soft key light slightly above camera level
- soft frontal fill
- subtle sculpting light around cheekbones and jaw
- gentle separation light on hair
- avoid flat passport lighting

COMPOSITION:
- keep the face large enough in frame for detailed retouching
- front-facing
- eyes level with camera
- shoulders may remain visible, but FACE QUALITY is the priority

FINAL PRIORITY FOR PASS 2:
Do not stop at natural cleanup.
Perform a clearly visible high-end beauty retouch.
The visual difference between pass 1 and pass 2 must be obvious.
The face should look like the same person after professional grooming, beauty lighting, and extensive manual Photoshop retouching.
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
- smooth seamless low-saturation studio background
- subtle radial brightness behind the head
- no objects, no text, no patterns, no scenery
- do not use vivid sky blue

STUDIO LIGHTING:
- preserve the premium facial beauty lighting from PASS 2
- add subtle rim light for hair/background separation
- keep the face bright, dimensional, and polished
- avoid flattening the face during the clothing/background edit

COMPOSITION:
- vertical 3:4 professional ID portrait
- perfectly front-facing
- face centered
- eyes level with camera
- shoulders visible
- balanced headroom
- stable near-symmetrical composition

FINAL QUALITY:
- premium Korean beauty-profile studio
- actor-agency profile / executive portrait / high-end employment photo finish
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

// 최종 증명사진 프롬프트
export function buildFinalPrompt(sel) {
  const clothing = buildClothing(sel);
  const color = colorText(sel.colorKey);
  const expression = EXPRESSIONS[sel.expression];
  const background = BACKGROUNDS[sel.background];
  if (!expression) throw httpError(400, '표정을 선택해 주세요.');
  if (!background) throw httpError(400, '배경색을 선택해 주세요.');
  const genderText = sel.gender === 'female' ? '여학생' : '남학생';

  return `
당신은 한국 프리미엄 프로필 사진관의 하이엔드 인물 리터칭 및 의상 합성 전문가다.
입력된 2~3장의 동일 인물 사진을 모두 참고해, 학생의 고유한 정체성은 유지하면서 촬영 순간의 제약을 적극적으로 보완한 프리미엄 프로필 사진 1장을 생성한다.

[핵심 원칙]
${COMMON_RULES}
- 대상: ${genderText}.
- 성별 고정관념을 과장하지 않는다.
- 결과물은 원본을 단순히 조금 보정한 사진이 아니라, 전문 사진관에서 헤어, 의상, 조명, 포토샵 리터칭을 모두 받은 결과처럼 보여야 한다.
- 보정 전후 차이는 육안으로 분명하게 느껴져야 한다.

[표정과 시선]
- 카메라를 자연스럽게 정면 응시하도록 보정한다.
- 표정: ${expression}
- 촬영 당시의 굳거나 어색한 입 모양, 눈 주변 긴장, 시선 불일치를 그대로 유지하지 않는다.
- 양쪽 눈이 카메라를 자연스럽게 바라보도록 정돈한다.
- 편안하고 자신감 있는 인상을 만든다.

[헤어]
- 기존 머리색과 자연스러운 헤어라인은 유지한다.
- 기존의 흐트러진 헤어스타일을 그대로 복제하지 않는다.
- 전문 헤어 스타일링을 받은 것처럼 앞머리 방향, 정수리 볼륨, 옆머리 실루엣을 적극적으로 정돈한다.
- 잔머리와 삐친 머리를 제거한다.
- 머릿결은 한 올씩 선명하고 건강하게 보이도록 정리하고 은은한 윤기를 추가한다.
- 사진관 촬영 직전 전문 스타일링을 받은 듯 단정하고 세련되게 만든다.

[의상]
- ${clothing}
- 캐주얼 의상, 블라우스, 니트, 가디건에서는 선택한 퍼스널 컬러 ${color}를 주된 의상색으로 활용한다.
- 정장 모드에서는 고급 증명사진의 완성도를 우선하여 흰 셔츠 또는 흰 블라우스를 사용한다.
- 주름, 합성 흔적 없이 좌우 대칭의 깔끔한 핏으로 표현한다.
- 목과 옷깃의 경계와 그림자는 실제 촬영처럼 자연스럽게 연결한다.

[조명과 배경]
- 한국 프리미엄 사진관의 대형 소프트박스 뷰티 조명을 적용한다.
- 정면 위쪽의 부드러운 메인 라이트와 약한 정면 필라이트를 사용한다.
- 머리카락과 배경이 분리되도록 아주 약한 림라이트를 적용한다.
- 얼굴 중앙은 밝고 깨끗하게, 얼굴 외곽은 아주 미세하게 어둡게 하여 입체감을 만든다.
- 평평한 여권사진 조명처럼 보이지 않게 한다.
- 배경: ${background}
- 인물 뒤 중앙이 아주 은은하게 밝아지는 저채도 스튜디오 그라데이션을 사용한다.
- 사물, 글자, 패턴, 풍경은 넣지 않는다.
- 밝은 하늘색 배경처럼 강한 파란색은 사용하지 않는다.

[구도]
- 세로 3:4 프리미엄 프로필 사진.
- 완전한 정면 상반신.
- 눈높이는 카메라와 동일.
- 얼굴은 중앙에 배치한다.
- 양쪽 어깨가 자연스럽게 보이도록 한다.
- 머리 위에는 적당한 여백을 둔다.
- 전체 구도는 안정적이고 좌우 균형이 잘 맞아야 한다.

[강한 리터칭: 최우선 적용]
- 한국 프리미엄 사진관, 배우 프로필, 취업용 고급 프로필 수준의 강한 상업용 리터칭을 기본값으로 적용한다.
- 보정 전후 차이가 육안으로 확실하게 느껴져야 한다.
- 동일인으로 알아볼 수 있는 핵심 특징은 유지하되, 더 단정하고 균형 잡히고 사진발이 좋은 모습으로 적극적으로 정돈한다.

[피부]
- Frequency Separation 방식으로 작업한 듯 피부톤과 피부결을 분리하여 정교하게 정돈한다.
- 잡티, 붉은기, 얼룩, 피부톤 불균일을 적극적으로 제거한다.
- 모공은 크게 감소시키되 미세한 실제 피부 질감은 남긴다.
- 다크서클과 눈 밑 음영은 약 60~75% 완화한다.
- 눈물고랑, 눈 밑 잔주름, 팔자와 입가의 어두운 음영을 부드럽게 완화한다.
- 수염 자국과 입 주변의 칙칙하고 푸른 색조를 크게 줄인다.
- 얼굴 중앙은 원본보다 밝고 깨끗하게 표현한다.
- 피부는 화사하고 균일하게 정리하되 플라스틱처럼 보이지 않게 한다.

[Dodge & Burn]
- 이마 중앙에 부드러운 하이라이트를 준다.
- 콧대 중앙에 깨끗하고 좁은 하이라이트를 준다.
- 광대 상단을 은은하게 밝힌다.
- 눈 아래 삼각존을 밝게 정돈한다.
- 광대 아래에는 매우 부드러운 음영을 준다.
- 턱선 바로 아래에는 얇고 자연스러운 그림자를 만들어 턱선을 또렷하게 한다.
- 얼굴 외곽은 중앙보다 아주 미세하게 어둡게 하여 얼굴에 입체감을 만든다.
- 뼈대를 과도하게 바꾸는 대신 빛과 명암으로 훨씬 정돈되고 사진발 좋은 얼굴을 만든다.

[눈]
- 양쪽 눈이 카메라를 자연스럽게 정면 응시하도록 보정한다.
- 눈동자와 홍채를 선명하게 한다.
- 작고 자연스러운 스튜디오 캐치라이트를 추가한다.
- 흰자위의 붉은기와 탁함을 줄인다.
- 눈꺼풀과 눈가 피부를 깔끔하게 정돈한다.
- 눈 크기는 과도하게 확대하지 않는다.

[눈썹과 얼굴 디테일]
- 눈썹의 삐친 털을 정리하고 자연스러운 선명도를 높인다.
- 코 옆, 입 주변, 턱 주변의 거친 질감을 정돈한다.
- 입술은 건강하고 자연스러운 혈색으로 미세하게 보정한다.

[최종 마감]
- 눈, 눈썹, 머리카락은 매우 선명하게 표현한다.
- 피부는 부드럽고 깨끗하게 표현한다.
- 정장, 셔츠, 넥타이, 블라우스의 원단 질감은 선명하게 유지한다.
- AI 이미지 특유의 플라스틱 피부, 과도한 HDR, 과도한 샤픈 느낌은 제거한다.
- 최종 결과는 같은 사람이 전문 사진관에서 전문 헤어 스타일링, 의상 준비, 스튜디오 조명, 고급 포토샵 리터칭을 모두 받은 결과처럼 보여야 한다.

[최종 우선순위]
- 동일인으로 알아볼 수 있어야 하지만, 동일인 유지 조건 때문에 보정을 약하게 적용하지 않는다.
- 헤어, 피부, 시선, 표정, 자세, 조명, 얼굴의 시각적 균형을 적극적으로 개선한다.
- 결과물은 원본보다 명백하게 세련되고 완성도 높아야 한다.
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

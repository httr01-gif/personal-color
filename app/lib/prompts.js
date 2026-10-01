import { COLORS, LIGHT_COLORS, SUIT_COLORS } from './colors';
import { httpError } from './server';

const BACKGROUNDS = {
  white: '깨끗한 흰색 스튜디오 배경',
  blue: '채도가 매우 낮은 옅은 블루그레이 스튜디오 배경',
  gray: '중성의 밝은 쿨그레이 스튜디오 배경'
};

const EXPRESSIONS = {
  smile: '입을 다문 자연스럽고 자신감 있는 은은한 미소',
  calm: '편안하고 차분한 표정에 아주 미세한 미소'
};

function colorText(key) {
  const c = COLORS[key];
  if (!c) throw httpError(400, '색 선택값이 올바르지 않습니다.');
  return `${c.label}(${c.hex})`;
}

function innerColor(key) {
  return LIGHT_COLORS.includes(key) ? '깨끗한 흰색' : '아주 밝은 중성색';
}

export function buildClothing({ gender, outfitKind, suitColor, casualItem, colorKey }) {
  const color = colorText(colorKey);
  const suit = SUIT_COLORS[suitColor]?.label;

  if (gender === 'male') {
    if (outfitKind === 'suit') {
      if (!suit) throw httpError(400, '정장 색을 선택해 주세요.');
      return `${suit} 남성용 맞춤 정장 재킷, 순백색 드레스 셔츠, ${color} 계열의 무늬 없는 단색 넥타이. 넥타이 매듭은 정중앙에 반듯하게 하고 스트라이프, 체크, 로고, 패턴은 사용하지 않는다.`;
    }
    if (outfitKind === 'casual') {
      if (casualItem === 'shirt') return `${color} 단색 프리미엄 옥스퍼드 셔츠, 넥타이 없음, 깔끔한 칼라와 정돈된 핏.`;
      if (casualItem === 'knit') return `${color} 단색 프리미엄 라운드넥 니트, 안쪽에 ${innerColor(colorKey)} 셔츠 깃이 자연스럽게 보이는 레이어드 스타일, 넥타이 없음.`;
      throw httpError(400, '남방 또는 니트를 선택해 주세요.');
    }
  }

  if (gender === 'female') {
    if (outfitKind === 'suit') {
      if (!suit) throw httpError(400, '정장 색을 선택해 주세요.');
      return `${suit} 여성용 테일러드 재킷, 안쪽에 ${color} 계열의 단정한 블라우스. 장식과 패턴은 최소화하고 사진관 프로필에 어울리는 고급스러운 핏으로 정돈한다.`;
    }
    if (outfitKind === 'blouse') return `${color} 단색의 단정하고 고급스러운 블라우스, 과도한 장식과 패턴 없음.`;
    if (outfitKind === 'cardigan') return `${color} 단색의 단정한 가디건, 안쪽에 ${innerColor(colorKey)} 이너, 깔끔한 학생 프로필 스타일.`;
  }

  throw httpError(400, '옷 선택값이 올바르지 않습니다.');
}

export function buildFaceBasePrompt(sel) {
  const expression = EXPRESSIONS[sel.expression];
  if (!expression) throw httpError(400, '표정을 선택해 주세요.');
  const genderText = sel.gender === 'female' ? '여학생' : '남학생';

  return `
Use all uploaded reference photos as references of the SAME PERSON.

Create one stable, front-facing base portrait of this ${genderText}.

This first pass is only for building the BEST FACE BASE.
Do not focus yet on dramatic clothing design or strong final beauty styling.
The top priority is to create the most stable, attractive, recognizable, front-facing portrait of the same person.

Requirements:
- preserve the person's identity clearly
- use all reference photos to infer the person's most stable facial characteristics
- correct awkward gaze and make both eyes look naturally toward the camera
- correct awkward mouth posture and create ${expression}
- align head, face, neck, and shoulders into a stable portrait pose
- preserve the person's core eye, nose, mouth, and facial identity
- do not rigidly copy temporary asymmetry, awkward expression, poor angle, or messy hair from the source photos
- keep the result clearly recognizable as the same person

Hair:
- preserve natural hairline and hair color
- clean stray hairs
- lightly organize fringe and overall silhouette
- create a neat student-portrait hairstyle

Retouching:
- light to medium portrait retouching only
- clean skin slightly
- reduce obvious blemishes and redness
- do not apply the final dramatic actor-profile retouch yet

Background:
- clean neutral light gray studio background
- no objects, no text, no pattern

Composition:
- vertical 3:4
- front-facing upper body portrait
- centered face
- shoulders visible
- balanced headroom

This first-pass output should look like the best possible clean base portrait of the same person.
`;
}

export function buildSecondPassPrompt(sel) {
  const clothing = buildClothing(sel);
  const background = BACKGROUNDS[sel.background];
  if (!background) throw httpError(400, '배경색을 선택해 주세요.');
  const genderText = sel.gender === 'female' ? '여학생' : '남학생';

  return `
Edit the previously generated portrait and transform it into the FINAL premium Korean studio ID photo of this ${genderText}.

The face and identity from the previous portrait must remain recognizable.
However, now apply a clearly stronger, high-end final retouching pass.

Main goal:
Create a final result that looks like the same person visited a premium Korean portrait studio and received professional grooming, studio lighting, wardrobe styling, and strong Photoshop retouching.

Strong final retouching:
- premium actor-profile / employment-photo level finish
- strong skin cleanup
- reduce redness, blemishes, uneven skin tone
- soften dark circles and under-eye shadows by about 60–75%
- soften mouth-area shadows
- reduce beard shadow and dull gray tone around mouth and chin
- brighten the central face
- keep realistic fine texture, avoid waxy skin

Dodge and burn:
- soft highlight on forehead center
- narrow highlight on nose bridge
- subtle highlight on upper cheekbones
- brighten under-eye triangle
- subtle shadow beneath cheekbones
- controlled shadow beneath jawline
- slightly darker outer facial perimeter
- make the face look more sculpted and photogenic through lighting and retouching

Eyes:
- keep natural eye shape
- sharpen iris and pupil detail
- add small natural studio catchlights
- reduce redness in the whites of the eyes

Hair:
- professionally restyle the hair
- remove flyaways
- improve fringe direction
- improve crown volume
- refine side silhouette
- add subtle healthy shine
- make it look intentionally styled before a studio shoot

Clothing:
- ${clothing}
- perfectly clean fit
- symmetrical collar and lapels
- no wrinkles
- no visible compositing artifacts

Lighting:
- premium Korean portrait studio lighting
- large soft key light slightly above camera level
- soft frontal fill
- subtle rim light
- clean bright face with dimensional shadows

Background:
- ${background}
- smooth seamless studio background
- subtle radial brightness behind the head
- no objects, no text, no scenery, no pattern

Composition:
- vertical 3:4 professional ID portrait
- perfectly front-facing
- centered face
- shoulders visible
- balanced headroom

Final quality:
- significantly more polished than the source
- clearly stronger than ordinary ID-photo retouching
- high-end commercial portrait finish
- still recognizable as the same person
`;
}

// 기존 fallback용 단일 프롬프트
export function buildFinalPrompt(sel) {
  const clothing = buildClothing(sel);
  const expression = EXPRESSIONS[sel.expression];
  const background = BACKGROUNDS[sel.background];
  if (!expression) throw httpError(400, '표정을 선택해 주세요.');
  if (!background) throw httpError(400, '배경색을 선택해 주세요.');
  const genderText = sel.gender === 'female' ? '여학생' : '남학생';

  return `
Use all uploaded reference photos as references of the SAME PERSON.

Create one premium Korean portrait-studio ID photograph of this ${genderText}.

- keep the identity recognizable
- make both eyes naturally look toward the camera
- create ${expression}
- apply strong premium portrait retouching
- professionally restyle the hair
- apply ${clothing}
- use ${background}
- vertical 3:4 front-facing upper-body portrait
- premium studio lighting
- strong but natural high-end retouching
`;
}

export function buildComparePrompt(colorKey) {
  const color = colorText(colorKey);
  return `
입력된 2~3장의 동일 인물 사진을 참고해 퍼스널 컬러 비교용 사진 1장을 생성한다.
이 사진은 같은 사람이 여러 색 옷을 입은 사진을 나란히 비교하기 위한 것이므로, 옷 색 외의 조건은 항상 똑같아야 한다.

[의상]
- ${color} 단색 라운드넥 상의. 무늬, 로고, 글자 없음.
- 옷 색이 얼굴 바로 아래 목 부분까지 넓게 보이도록 한다.

[고정 조건]
- 표정: 편안한 중립 표정, 카메라 정면 응시.
- 조명: 정면에서 고르게 비추는 중립 흰색 조명. 따뜻하거나 차가운 색 조명 금지.
- 배경: 아주 연한 중성 회색 단색.
- 구도: 세로 3:4, 어깨까지 보이는 정면 상반신, 얼굴 중앙.

[보정]
- 피부 보정은 약하게 한다.
- 피부 톤, 피부색, 입술색, 머리색은 원본 그대로 유지한다.
- 색이 얼굴에 어떻게 어울리는지 비교하는 것이 목적이므로 얼굴 색을 옷 색에 맞춰 바꾸지 않는다.
`;
}

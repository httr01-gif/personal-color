import { COLORS, LIGHT_COLORS, SUIT_COLORS } from './colors';
import { httpError } from './server';

const COMMON_RULES = `
- 모든 입력 이미지는 동일 인물 참고용이다. 여러 장을 함께 참고해 같은 사람의 고유한 얼굴 특징을 안정적으로 파악한다.
- 결과는 반드시 같은 사람으로 알아볼 수 있어야 한다.
- 눈, 코, 입, 귀, 전체적인 얼굴 비율 등 고유 특징은 유지한다.
- 촬영 순간의 어색한 시선, 표정, 자세, 조명 왜곡, 흐트러진 헤어는 적극적으로 정돈한다.
- 동일인 유지를 최소 보정으로 해석하지 않는다. 사진관에서 다시 촬영한 것처럼 완성도를 크게 높인다.
- 장애 유무를 추정하거나 외형으로 표현하지 않는다.
- 안경을 쓴 경우 안경테의 핵심 형태는 유지하고 렌즈 반사와 번짐을 제거한다.`;

const BACKGROUNDS = {
  white: '깨끗한 흰색',
  blue: '채도가 매우 낮은 옅은 블루그레이',
  gray: '아주 연한 회색'
};

const EXPRESSIONS = {
  smile: '웃는 얼굴: 입을 다문 밝은 미소',
  calm: '차분한 얼굴: 편안한 중립 표정'
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
      return `${suit} 남성용 맞춤 정장 재킷, 순백색 드레스 셔츠, ${color} 계열의 무늬 없는 단색 넥타이. 넥타이 매듭은 정중앙에 반듯하게 하고 스트라이프, 체크, 로고, 패턴은 사용하지 않는다.`;
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
      return `${suit} 여성용 테일러드 재킷, 안쪽에 ${color} 블라우스, 넥타이 없음.`;
    }
    if (outfitKind === 'blouse') return `${color} 단정한 블라우스, 넥타이 없음.`;
    if (outfitKind === 'cardigan') return `${color} 단정한 가디건, 안쪽에 ${innerColor(colorKey)} 이너, 넥타이 없음.`;
  }

  throw httpError(400, '옷 선택값이 올바르지 않습니다.');
}

// 최종 증명사진 프롬프트 (확정안)
export function buildFinalPrompt(sel) {
  const clothing = buildClothing(sel);
  const color = colorText(sel.colorKey);
  const expression = EXPRESSIONS[sel.expression];
  const background = BACKGROUNDS[sel.background];
  if (!expression) throw httpError(400, '표정을 선택해 주세요.');
  if (!background) throw httpError(400, '배경색을 선택해 주세요.');
  const genderText = sel.gender === 'female' ? '여학생' : '남학생';

  return `
당신은 한국 사진관 스타일의 고급 증명사진 리터칭 및 의상 합성 전문가다.
입력된 1~8장의 동일 인물 사진을 참고해, 촬영 순간의 제약을 보완한 한국형 프리미엄 증명사진 1장을 생성한다.

[핵심 원칙]
${COMMON_RULES}
- 대상: ${genderText}. 성별 고정관념을 과장하지 않는다.

[표정과 시선]
- 카메라 정면 응시.
- 표정: ${expression}

[헤어]
- 기존 머리색과 자연스러운 헤어라인은 유지한다.
- 흐트러진 원본 헤어를 그대로 복제하지 말고, 사진관 촬영 전 전문 드라이를 받은 것처럼 앞머리 방향, 정수리 볼륨, 옆머리 실루엣을 적극적으로 정돈한다.
- 잔머리와 삐친 머리를 정리하고 머릿결을 선명하고 깔끔하게 표현한다.

[의상]
- ${clothing}
- 셔츠, 블라우스, 니트, 가디건 색: ${color}
- 주름, 합성 흔적 없이 좌우 대칭의 깔끔한 핏. 목과 옷깃 경계가 자연스러워야 한다.

[조명과 배경]
- 한국 프리미엄 사진관 소프트박스 정면광, 얼굴에 부드러운 입체감.
- 배경: ${background}, 인물 뒤 중앙이 밝고 가장자리로 갈수록 아주 은은하게 어두워지는 스튜디오 그라데이션. 사물, 글자, 패턴 없음.

[구도]
- 세로 3:4, 정면 상반신, 얼굴 중앙, 어깨 포함, 머리 위 적당한 여백, 대칭 구도.

[강한 전문 리터칭: 반드시 적용, 가장 우선]
- 일반 증명사진보다 강한 프리미엄 사진관 수준의 리터칭을 적용한다.
- 보정 전후 차이가 육안으로 분명히 느껴져야 한다.
- 피부톤과 피부결을 정교하게 분리해 정돈한 것처럼 균일하고 깨끗하게 만든다.
- 붉은기, 잡티, 피부톤 불균일, 다크서클, 눈 밑 그늘, 입가의 불필요한 음영을 적극적으로 완화한다.
- 수염 자국과 입 주변의 칙칙한 색을 원본보다 확실히 옅게 정리한다.
- 얼굴 중앙은 밝고 깨끗하게, 외곽과 턱 아래에는 매우 부드러운 음영을 유지해 입체감을 만든다.
- 이마 중앙, 콧대, 광대 상단에는 은은한 하이라이트를 주어 스튜디오 조명으로 다시 촬영한 듯 표현한다.
- 눈동자와 홍채는 또렷하고 선명하게, 작고 자연스러운 캐치라이트를 추가하고 흰자위의 붉은기와 탁함을 줄인다.
- 머리카락, 눈썹, 눈은 고선명으로 표현하고 피부는 부드럽고 깨끗하게 정리한다.
- 결과는 원본을 조금 정리한 사진이 아니라, 전문 헤어·의상·조명·리터칭을 모두 거친 프리미엄 사진관 결과처럼 보여야 한다.
`;
}

// 퍼스널 컬러 비교 사진 프롬프트 (옷 색만 변경, 약한 보정)
export function buildComparePrompt(colorKey) {
  const color = colorText(colorKey);
  return `
입력된 1~8장의 동일 인물 사진을 참고해 퍼스널 컬러 비교용 사진 1장을 생성한다.
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

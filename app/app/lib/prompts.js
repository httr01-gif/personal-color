import { COLORS, LIGHT_COLORS, SUIT_COLORS } from './colors';
import { httpError } from './server';

const COMMON_RULES = `
- 모든 입력 이미지는 동일 인물 참고용이다. 여러 장을 함께 참고해 고유한 얼굴 특징을 안정적으로 파악한다.
- 얼굴형, 눈, 코, 입, 귀, 턱선의 고유 형태는 유지한다. 눈 확대, 윤곽 축소 등 성형 느낌 변경은 하지 않는다.
- 장애 유무를 추정하거나 외형으로 표현하지 않는다. 촬영 환경 때문에 드러나지 않은 단정하고 자신감 있는 모습을 구현한다.
- 안경을 쓴 경우 안경테의 모양, 색, 두께를 원본 그대로 유지하고 렌즈 반사만 줄인다.`;

const BACKGROUNDS = {
  white: '깨끗한 흰색',
  blue: '아주 연한 하늘색',
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
      return `${suit} 남성 정장 재킷, 안쪽에 ${color} 드레스 셔츠. 넥타이는 정장 색과 셔츠 색에 어울리는 단정한 색으로 자동 선택한다.`;
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
- 기존 머리색과 헤어스타일은 유지한다.
- 한국 사진관 드라이를 받은 듯 앞머리와 정수리에 볼륨을 주고, 잔머리와 삐친 머리를 모두 정리한다.

[의상]
- ${clothing}
- 셔츠, 블라우스, 니트, 가디건 색: ${color}
- 주름, 합성 흔적 없이 좌우 대칭의 깔끔한 핏. 목과 옷깃 경계가 자연스러워야 한다.

[조명과 배경]
- 한국 프리미엄 사진관 소프트박스 정면광, 얼굴에 부드러운 입체감.
- 배경: ${background}, 인물 뒤 중앙이 밝고 가장자리로 갈수록 아주 은은하게 어두워지는 스튜디오 그라데이션. 사물, 글자, 패턴 없음.

[구도]
- 세로 3:4, 정면 상반신, 얼굴 중앙, 어깨 포함, 머리 위 적당한 여백, 대칭 구도.

[강한 리터칭: 반드시 적용, 가장 우선]
- 피부: 모공을 최소화하고 결이 매끈하며 톤이 균일한 피부로 보정한다.
- 붉은기, 잡티, 다크서클, 눈 밑 그늘, 입가 그림자를 제거한다.
- 수염 자국은 원본보다 확실히 옅게 정리한다(완전 제거는 하지 않음).
- 얼굴 밝기를 원본보다 한 단계 높여 화사하고 깨끗한 톤으로 만든다.
- 눈동자는 또렷하고 선명하게, 작은 캐치라이트 추가, 흰자위 맑게.
- 머리카락과 눈은 고선명, 피부는 매끈하게 처리한 한국 고급 사진관 마감.
- 보정 전후 차이가 분명히 보이는 강한 전문 리터칭을 적용한다. 단, 얼굴 형태는 바꾸지 않는다.
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

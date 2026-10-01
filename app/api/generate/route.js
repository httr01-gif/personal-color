import OpenAI, { toFile } from 'openai';

export const runtime = 'nodejs';
export const maxDuration = 300;

const OUTFIT_LABELS = {
  black_suit: '블랙 정장 재킷, 흰색 드레스 셔츠, 단정한 짙은색 넥타이',
  navy_suit: '네이비 정장 재킷, 흰색 드레스 셔츠, 단정한 네이비 넥타이',
  gray_suit: '차콜/그레이 정장 재킷, 흰색 드레스 셔츠, 단정한 짙은색 넥타이',
  white_shirt: '깔끔한 화이트 셔츠, 넥타이 없음',
  blue_shirt: '깔끔한 라이트 블루 셔츠, 넥타이 없음',
  navy_shirt: '단정한 네이비 셔츠, 넥타이 없음',
  black_shirt: '단정한 블랙 셔츠, 넥타이 없음',
  oxford: '단정한 옥스퍼드 남방, 자연스럽고 깔끔한 캐주얼 핏',
  knit_navy: '네이비 라운드넥 니트, 안쪽에 깨끗한 화이트 셔츠를 레이어드',
  knit_gray: '차콜 그레이 라운드넥 니트, 안쪽에 깨끗한 화이트 셔츠를 레이어드',
  blouse_white: '단정한 화이트 블라우스, 과하지 않은 전문적인 스타일',
  blouse_blue: '단정한 라이트 블루 블라우스, 과하지 않은 전문적인 스타일',
  cardigan: '깔끔한 가디건과 화이트 이너, 단정하고 편안한 학생 프로필 스타일',
  female_navy_suit: '네이비 여성용 테일러드 재킷과 화이트 블라우스, 단정한 프로필 스타일',
  female_gray_suit: '그레이 여성용 테일러드 재킷과 화이트 블라우스, 단정한 프로필 스타일',
  female_black_suit: '블랙 여성용 테일러드 재킷과 화이트 블라우스, 단정한 프로필 스타일'
};

function buildPrompt({ outfit, background, subjectStyle }) {
  const clothing = OUTFIT_LABELS[outfit] || OUTFIT_LABELS.navy_suit;
  const bg = background === 'white'
    ? '깨끗한 순백색 스튜디오 배경'
    : background === 'blue'
      ? '아주 연한 하늘색 단색 스튜디오 배경'
      : '아주 연한 회색 단색 스튜디오 배경';

  const styleHint = subjectStyle === 'female'
    ? '성별 고정관념을 과장하지 말고, 대상자의 실제 얼굴 특징과 헤어라인을 존중하면서 단정하고 자연스러운 인상으로 정리한다.'
    : subjectStyle === 'male'
      ? '성별 고정관념을 과장하지 말고, 대상자의 실제 얼굴 특징과 헤어라인을 존중하면서 단정하고 자연스러운 인상으로 정리한다.'
      : '대상자의 실제 얼굴 특징과 헤어라인을 존중하면서 단정하고 자연스러운 인상으로 정리한다.';

  return `
업로드된 여러 장의 사진은 모두 동일 인물의 참고 사진이다. 사진들 전체를 함께 참고하여 동일 인물의 얼굴 특징을 최대한 정확히 파악한 뒤, 한국 사진관의 프리미엄 증명사진/프로필 사진 한 장으로 완성한다.

핵심 목표:
- 촬영 순간의 시선 불일치, 굳은 표정, 자세 흔들림, 머리 흐트러짐 같은 촬영상의 제약을 보완한다.
- 인물을 전혀 다른 사람으로 바꾸지 말고, 여러 참고 사진에서 확인되는 공통적인 얼굴 특징과 개성을 유지한다.
- 카메라를 편안하게 정면 응시하는 모습으로 보정한다.
- 입은 다문 상태의 아주 자연스럽고 은은한 미소 또는 편안한 중립 표정으로 정돈한다.
- 얼굴 비대칭은 억지로 완전 대칭으로 만들지 않는다.
- 장애 유무를 추정하거나 외형적으로 표현하려 하지 않는다. 단지 촬영 환경 때문에 잘 드러나지 않은 단정하고 자신감 있는 모습을 전문 사진관 수준으로 구현한다.

강한 하이엔드 리터칭(항상 적용):
- 피부톤을 균일하고 깨끗하게 정리하고 잡티, 붉은기, 거친 음영을 적극적으로 완화한다.
- 눈 밑 그늘과 입가의 불필요한 그림자를 줄이고 눈동자 캐치라이트와 선명도를 자연스럽게 높인다.
- 머리카락은 전문 헤어 스타일링을 받은 듯 잔머리와 삐친 머리를 정리하되, 얼굴형과 헤어라인은 본인 특성을 유지한다.
- 목, 어깨, 상체 자세를 정면 증명사진처럼 안정적으로 정돈한다.
- 사진관 소프트박스 조명, 선명한 눈/머리카락 디테일, 부드러운 피부 질감, 고급 색보정을 적용한다.
- 원본 촬영 배경과 기존 의상은 제거하고 자연스럽게 교체한다.

의상:
${clothing}
- 옷은 몸에 잘 맞고 좌우 균형이 잡히며 구김이 거의 없는 상태.
- 목과 옷깃 경계에 합성 흔적이 없어야 한다.

배경:
${bg}
- 얼룩, 교실 물체, 텍스트, 패턴은 모두 제거한다.
- 인물 뒤에 아주 약한 후광 형태의 스튜디오 조명을 허용한다.

인물 표현:
${styleHint}
- 얼굴의 눈, 코, 입, 귀, 턱선 등 본질적인 특징은 참고 사진들과 연결되는 동일 인물로 유지한다.
- 눈을 과도하게 키우거나 코/턱을 성형한 듯 변경하지 않는다.

구도:
- 세로 3:4 증명사진용 비율.
- 정면, 눈높이 카메라, 머리 위 적당한 여백.
- 머리와 어깨가 충분히 포함되는 바스트 샷.
- 글자, 로고, 워터마크 없음.
- 실제 사진관에서 촬영한 고해상도 사진처럼 사실적이고 자연스러워야 한다.
`;
}

export async function POST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: 'OPENAI_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
    }

    const form = await request.formData();
    const files = form.getAll('images').filter((v) => v && typeof v.arrayBuffer === 'function');
    const outfit = String(form.get('outfit') || 'navy_suit');
    const background = String(form.get('background') || 'gray');
    const subjectStyle = String(form.get('subjectStyle') || 'neutral');

    if (files.length < 1) {
      return Response.json({ error: '사진을 1장 이상 업로드해 주세요.' }, { status: 400 });
    }
    if (files.length > 8) {
      return Response.json({ error: '사진은 최대 8장까지 사용할 수 있습니다.' }, { status: 400 });
    }

    const uploadables = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const buf = Buffer.from(await f.arrayBuffer());
      uploadables.push(await toFile(buf, f.name || `reference-${i + 1}.jpg`, { type: f.type || 'image/jpeg' }));
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-sunburst';

    const result = await client.images.edit({
      model,
      image: uploadables,
      prompt: buildPrompt({ outfit, background, subjectStyle }),
      size: '1152x1536',
      quality: 'max',
      output_format: 'jpeg',
      output_compression: 95,
      n: 1
    });

    const imageBase64 = result?.data?.[0]?.b64_json;
    if (!imageBase64) {
      return Response.json({ error: '이미지 결과를 받지 못했습니다.' }, { status: 502 });
    }

    return Response.json({
      image: `data:image/jpeg;base64,${imageBase64}`,
      model
    });
  } catch (error) {
    console.error(error);
    const message = error?.message || '이미지 생성 중 오류가 발생했습니다.';
    return Response.json({ error: message }, { status: 500 });
  }
}

// 색상 데이터 (화면과 서버가 함께 사용)
export const COLORS = {
  // 계절별 추천 색
  coral: { label: '코랄', hex: '#FF7F6E' },
  peach: { label: '피치', hex: '#FFB59A' },
  ivory: { label: '아이보리', hex: '#FFF3D9' },
  lightblue: { label: '라이트 블루', hex: '#A9CCEB' },
  lavender: { label: '라벤더', hex: '#C7B8E6' },
  white: { label: '화이트', hex: '#F7F8FA' },
  beige: { label: '베이지', hex: '#D8C3A0' },
  khaki: { label: '카키', hex: '#8A8456' },
  brown: { label: '브라운', hex: '#7B5136' },
  royalblue: { label: '로열 블루', hex: '#2547A8' },
  black: { label: '블랙', hex: '#1A1A1A' },
  purewhite: { label: '퓨어 화이트', hex: '#FFFFFF' },
  // 좋아하는 색 카드
  red: { label: '빨강', hex: '#E53935' },
  orange: { label: '주황', hex: '#FB8C00' },
  yellow: { label: '노랑', hex: '#FDD835' },
  green: { label: '초록', hex: '#43A047' },
  sky: { label: '하늘', hex: '#4FC3F7' },
  blue: { label: '파랑', hex: '#1E5BD8' },
  purple: { label: '보라', hex: '#8E24AA' },
  pink: { label: '분홍', hex: '#F48FB1' },
  fwhite: { label: '흰색', hex: '#FFFFFF' },
  fblack: { label: '검정', hex: '#212121' }
};

// 좋아하는 색 10가지와 가까운 계절
export const FAVORITES = [
  { key: 'red', season: 'winter' },
  { key: 'orange', season: 'spring' },
  { key: 'yellow', season: 'spring' },
  { key: 'green', season: 'autumn' },
  { key: 'sky', season: 'summer' },
  { key: 'blue', season: 'winter' },
  { key: 'purple', season: 'summer' },
  { key: 'pink', season: 'summer' },
  { key: 'fwhite', season: 'winter' },
  { key: 'fblack', season: 'winter' }
];

// 계절 유형: 비교 사진 대표 색과 추천 색
export const SEASONS = {
  spring: { label: '봄', desc: '따뜻하고 화사한 색', compare: 'coral', palette: ['coral', 'peach', 'ivory'] },
  summer: { label: '여름', desc: '맑고 시원한 색', compare: 'lightblue', palette: ['lightblue', 'lavender', 'white'] },
  autumn: { label: '가을', desc: '차분하고 따뜻한 색', compare: 'beige', palette: ['beige', 'khaki', 'brown'] },
  winter: { label: '겨울', desc: '선명하고 또렷한 색', compare: 'royalblue', palette: ['royalblue', 'black', 'purewhite'] }
};
export const SEASON_ORDER = ['spring', 'summer', 'autumn', 'winter'];

// 비교 사진을 건너뛰었을 때 기본 색
export const BASIC_PALETTE = ['white', 'lightblue', 'ivory'];

// 밝은 색 (이너 색을 대비되게 바꿀 때 사용)
export const LIGHT_COLORS = ['white', 'purewhite', 'fwhite', 'ivory', 'yellow'];

export const SUIT_COLORS = {
  black: { label: '블랙', hex: '#1c1c1e' },
  navy: { label: '네이비', hex: '#1f2a48' },
  gray: { label: '그레이', hex: '#5a5e65' }
};

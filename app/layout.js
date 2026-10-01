import './styles.css';

export const metadata = {
  title: 'AI 증명사진 스튜디오',
  description: '여러 장의 사진을 참고해 단정한 증명사진을 생성하고 10×15cm 용지에 출력합니다.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

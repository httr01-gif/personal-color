import './styles.css';
import Intro from './Intro';

export const metadata = {
  title: '자인사진관 | AI 기반 나의 퍼스널 컬러 찾기',
  description: '나에게 어울리는 색을 찾고, 그 색으로 나의 증명사진을 만드는 프로그램'
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <Intro />
        {children}
      </body>
    </html>
  );
}

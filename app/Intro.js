"use client";

import { useState } from "react";

// 자인사진관 인트로 화면
// public/intro.png 이미지를 전체 화면으로 보여 주고
// [나의 색 찾으러 가기] 버튼을 누르면 기존 화면으로 넘어갑니다.
export default function Intro() {
  const [open, setOpen] = useState(true);
  const [closing, setClosing] = useState(false);

  if (!open) return null;

  const start = () => {
    // 음성 안내 시작 신호 (브라우저는 첫 클릭 이후에만 소리를 낼 수 있음)
    window.dispatchEvent(new Event('zain-intro-start'));
    setClosing(true);
    setTimeout(() => setOpen(false), 450);
  };

  return (
    <div className={`intro-wrap ${closing ? "is-closing" : ""}`}>
      <img
        className="intro-img"
        src="/intro.png"
        alt="자인사진관 AI 기반 나의 퍼스널 컬러 찾기"
      />

      <button className="intro-btn" onClick={start} autoFocus>
        <span className="intro-btn-icon" aria-hidden="true">🎨</span>
        나의 색 찾으러 가기
      </button>

      <style>{`
        .intro-wrap {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: #eef3fc;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: clamp(16px, 3vh, 32px);
          padding: 16px;
          box-sizing: border-box;
          transition: opacity 0.45s ease;
        }
        .intro-wrap.is-closing { opacity: 0; }

        .intro-img {
          width: 100%;
          max-width: 1100px;
          max-height: calc(100vh - 140px);
          object-fit: contain;
          border-radius: 20px;
          box-shadow: 0 12px 40px rgba(46, 84, 170, 0.18);
        }

        .intro-btn {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 18px 44px;
          font-size: clamp(20px, 2.6vw, 28px);
          font-weight: 700;
          color: #ffffff;
          background: #2f5bd3;
          border: none;
          border-radius: 999px;
          cursor: pointer;
          box-shadow: 0 6px 0 #1e3f9e;
          transition: transform 0.1s ease, box-shadow 0.1s ease;
          min-height: 64px;
        }
        .intro-btn:hover { background: #2a52c2; }
        .intro-btn:active {
          transform: translateY(4px);
          box-shadow: 0 2px 0 #1e3f9e;
        }
        .intro-btn:focus-visible {
          outline: 4px solid #9cb6f2;
          outline-offset: 4px;
        }
        .intro-btn-icon { font-size: 1.2em; }

        @media (prefers-reduced-motion: reduce) {
          .intro-wrap { transition: none; }
        }
      `}</style>
    </div>
  );
}

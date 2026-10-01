'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const OUTFITS = [
  { group: '정장', value: 'black_suit', label: '블랙 정장' },
  { group: '정장', value: 'navy_suit', label: '네이비 정장' },
  { group: '정장', value: 'gray_suit', label: '그레이 정장' },
  { group: '셔츠', value: 'white_shirt', label: '화이트 셔츠' },
  { group: '셔츠', value: 'blue_shirt', label: '블루 셔츠' },
  { group: '셔츠', value: 'navy_shirt', label: '네이비 셔츠' },
  { group: '셔츠', value: 'black_shirt', label: '블랙 셔츠' },
  { group: '캐주얼', value: 'oxford', label: '옥스퍼드 남방' },
  { group: '캐주얼', value: 'knit_navy', label: '네이비 니트' },
  { group: '캐주얼', value: 'knit_gray', label: '그레이 니트' },
  { group: '여학생', value: 'blouse_white', label: '화이트 블라우스' },
  { group: '여학생', value: 'blouse_blue', label: '블루 블라우스' },
  { group: '여학생', value: 'cardigan', label: '가디건' },
  { group: '여학생', value: 'female_black_suit', label: '블랙 여성 정장' },
  { group: '여학생', value: 'female_navy_suit', label: '네이비 여성 정장' },
  { group: '여학생', value: 'female_gray_suit', label: '그레이 여성 정장' }
];

const PRINT_COUNTS = [1, 4, 6, 8, 9];

function fileKey(file) {
  return `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`;
}

async function resizeImage(file, maxSide = 1600, quality = 0.88) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  bitmap.close?.();
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
}

export default function Home() {
  const [images, setImages] = useState([]);
  const [outfit, setOutfit] = useState('navy_suit');
  const [background, setBackground] = useState('gray');
  const [subjectStyle, setSubjectStyle] = useState('neutral');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [printCount, setPrintCount] = useState(9);
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const grouped = useMemo(() => {
    const map = {};
    for (const item of OUTFITS) (map[item.group] ||= []).push(item);
    return map;
  }, []);

  useEffect(() => () => stopCamera(), []);

  function addFiles(files) {
    const incoming = [...files].filter((f) => f.type.startsWith('image/'));
    const wrapped = incoming.map((file) => ({ id: fileKey(file), file, url: URL.createObjectURL(file) }));
    setImages((prev) => [...prev, ...wrapped].slice(0, 8));
  }

  function removeImage(id) {
    setImages((prev) => {
      const target = prev.find((x) => x.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((x) => x.id !== id);
    });
  }

  async function startCamera() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 50);
    } catch {
      setError('카메라를 사용할 수 없습니다. 브라우저 권한을 확인해 주세요.');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks()?.forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  async function captureOne() {
    if (!videoRef.current || images.length >= 8) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
    addFiles([file]);
  }

  async function burstCapture() {
    if (!videoRef.current) return;
    setError('');
    const remaining = Math.min(8 - images.length, 8);
    for (let i = 0; i < remaining; i++) {
      await captureOne();
      await new Promise((r) => setTimeout(r, 320));
    }
  }

  async function generate() {
    if (!images.length) {
      setError('사진을 먼저 촬영하거나 업로드해 주세요.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      for (const item of images) {
        const reduced = await resizeImage(item.file);
        fd.append('images', reduced);
      }
      fd.append('outfit', outfit);
      fd.append('background', background);
      fd.append('subjectStyle', subjectStyle);

      const res = await fetch('/api/generate', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '생성에 실패했습니다.');
      setResult(data.image);
    } catch (e) {
      setError(e.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function downloadResult() {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = 'AI-증명사진.jpg';
    a.click();
  }

  function printSheet() {
    if (!result) return;
    window.print();
  }

  const printItems = Array.from({ length: printCount });

  return (
    <main className="shell">
      <header className="hero no-print">
        <div>
          <div className="eyebrow">SPECIAL EDUCATION · AI PHOTO STUDIO</div>
          <h1>AI 증명사진 스튜디오</h1>
          <p>6~8컷을 참고해 시선·표정·헤어·자세를 정돈하고, 선택한 의상으로 고급 증명사진을 생성합니다.</p>
        </div>
        <div className="badge">강한 보정 고정</div>
      </header>

      <section className="workspace no-print">
        <div className="panel">
          <h2>1. 사진 촬영 / 업로드</h2>
          <p className="hint">권장: 동일 인물 6~8컷. 서로 조금 다른 표정과 시선의 사진이 좋습니다.</p>
          <div className="actions">
            <label className="button secondary">
              사진 선택
              <input type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
            </label>
            {!cameraOpen ? (
              <button className="button" onClick={startCamera}>카메라 열기</button>
            ) : (
              <button className="button secondary" onClick={stopCamera}>카메라 닫기</button>
            )}
          </div>

          {cameraOpen && (
            <div className="cameraBox">
              <video ref={videoRef} autoPlay playsInline muted />
              <div className="cameraActions">
                <button className="button" onClick={captureOne} disabled={images.length >= 8}>1컷 촬영</button>
                <button className="button accent" onClick={burstCapture} disabled={images.length >= 8}>연속 8컷 촬영</button>
              </div>
            </div>
          )}

          <div className="thumbGrid">
            {images.map((item, idx) => (
              <div className="thumb" key={item.id}>
                <img src={item.url} alt={`참고 ${idx + 1}`} />
                <span>{idx + 1}</span>
                <button onClick={() => removeImage(item.id)} aria-label="삭제">×</button>
              </div>
            ))}
            {Array.from({ length: Math.max(0, 8 - images.length) }).map((_, i) => <div className="thumb empty" key={`e${i}`}>+</div>)}
          </div>
          <div className="counter">{images.length} / 8컷</div>
        </div>

        <div className="panel">
          <h2>2. 의상 선택</h2>
          <div className="segmented three">
            <button className={subjectStyle === 'neutral' ? 'active' : ''} onClick={() => setSubjectStyle('neutral')}>공용</button>
            <button className={subjectStyle === 'male' ? 'active' : ''} onClick={() => setSubjectStyle('male')}>남학생</button>
            <button className={subjectStyle === 'female' ? 'active' : ''} onClick={() => setSubjectStyle('female')}>여학생</button>
          </div>

          {Object.entries(grouped).map(([group, list]) => (
            <div key={group} className="outfitGroup">
              <h3>{group}</h3>
              <div className="outfitGrid">
                {list.map((o) => (
                  <button key={o.value} className={`outfit ${outfit === o.value ? 'selected' : ''}`} onClick={() => setOutfit(o.value)}>
                    <span className={`swatch ${o.value}`}></span>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <h2 className="mt">3. 배경</h2>
          <div className="segmented three">
            <button className={background === 'gray' ? 'active' : ''} onClick={() => setBackground('gray')}>연회색</button>
            <button className={background === 'white' ? 'active' : ''} onClick={() => setBackground('white')}>화이트</button>
            <button className={background === 'blue' ? 'active' : ''} onClick={() => setBackground('blue')}>연하늘</button>
          </div>

          <button className="generate" onClick={generate} disabled={loading || !images.length}>
            {loading ? 'AI가 사진을 완성하는 중…' : 'AI 증명사진 만들기'}
          </button>
          {error && <div className="error">{error}</div>}
          <p className="privacy">학생 사진은 보호자 동의 등 학교의 개인정보 처리 기준을 확인한 뒤 사용하세요. API 키는 브라우저에 노출되지 않고 서버 환경변수에서만 사용됩니다.</p>
        </div>
      </section>

      {result && (
        <section className="resultPanel no-print">
          <div className="resultImage"><img src={result} alt="생성된 증명사진" /></div>
          <div className="resultTools">
            <h2>완성 사진</h2>
            <p>보정 강도는 고정된 강한 프로필 보정입니다.</p>
            <div className="actions"><button className="button" onClick={downloadResult}>단독샷 저장</button></div>
            <h3>10 × 15cm 포토용지 출력</h3>
            <div className="segmented printCounts">
              {PRINT_COUNTS.map((n) => <button key={n} className={printCount === n ? 'active' : ''} onClick={() => setPrintCount(n)}>{n}매</button>)}
            </div>
            <p className="hint">3 × 4cm 실물 크기. 9매 선택 시 3열 × 3행으로 배치됩니다.</p>
            <button className="generate compact" onClick={printSheet}>인쇄하기</button>
          </div>
        </section>
      )}

      <section className={`print-sheet count-${printCount}`}>
        {result && printItems.map((_, i) => <img key={i} src={result} alt="3x4 증명사진" />)}
      </section>
    </main>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BASIC_PALETTE, COLORS, FAVORITES, SEASONS, SEASON_ORDER, SUIT_COLORS } from './lib/colors';

const STEPS = ['name', 'photos', 'gender', 'favorite', 'compare', 'mycolor', 'outfit', 'expression', 'background', 'result'];
const STEP_TITLES = {
  name: '내 이름',
  photos: '내 사진',
  gender: '나는',
  favorite: '좋아하는 색',
  compare: '어울리는 옷 색',
  mycolor: '나의 색',
  outfit: '옷 종류',
  expression: '표정',
  background: '배경색',
  result: '나의 프리미엄 프로필'
};
const PRINT_COUNTS = [1, 4, 6, 8, 9];

const OUTFIT_KINDS = {
  male: [
    { id: 'suit', label: '정장', icon: '🤵' },
    { id: 'casual', label: '캐주얼', icon: '👕' }
  ],
  female: [
    { id: 'suit', label: '정장', icon: '💼' },
    { id: 'blouse', label: '블라우스', icon: '👚' },
    { id: 'cardigan', label: '가디건', icon: '🧥' }
  ]
};
const CASUAL_ITEMS = [
  { id: 'shirt', label: '남방', icon: '👔' },
  { id: 'knit', label: '니트', icon: '🧶' }
];
const EXPRESSIONS = [
  { id: 'bigsmile', label: '활짝 웃는 얼굴', icon: '😁' },
  { id: 'smile', label: '웃는 얼굴', icon: '😊' },
  { id: 'calm', label: '차분한 얼굴', icon: '🙂' }
];
const BACKGROUNDS = [
  { id: 'peach', label: '피치', hex: 'linear-gradient(180deg,#fde7dc,#f6cdbb)' },
  { id: 'pink', label: '분홍', hex: 'linear-gradient(180deg,#fbe8ec,#ecc6cf)' },
  { id: 'lavender', label: '라벤더', hex: 'linear-gradient(180deg,#efeaf8,#d6cbec)' },
  { id: 'beige', label: '베이지', hex: 'linear-gradient(180deg,#f6eee2,#e3d3bb)' },
  { id: 'white', label: '흰색', hex: '#ffffff' },
  { id: 'blue', label: '하늘색', hex: '#dcebf9' },
  { id: 'gray', label: '회색', hex: '#e4e6ea' }
];
// 나의 계절에 어울리는 배경
const SEASON_BACKGROUND = { spring: 'peach', summer: 'pink', autumn: 'beige', winter: 'lavender' };
const PIPELINE_LABELS = {
  'responses-single-pass-studio': '1회 통합 생성',
  'images-edit-fallback-single-pass': '1회 생성(대체 방식)'
};

function fileKey(file) {
  return `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`;
}

async function resizeImage(file, maxSide, quality) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  bitmap.close?.();
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
}

function hexToRgba(hex, alpha = 1) {
  const clean = String(hex || '').replace('#', '');
  if (clean.length !== 6) return `rgba(255,255,255,${alpha})`;
  const value = parseInt(clean, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function Choice({ selected, onClick, children, className = '' }) {
  return (
    <button type="button" className={`choice ${selected ? 'is-selected' : ''} ${className}`} aria-pressed={selected} onClick={onClick}>
      {children}
    </button>
  );
}

function Swatch({ hex }) {
  return <span className="swatch" style={{ background: hex }} aria-hidden="true" />;
}

export default function Home() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [images, setImages] = useState([]);
  const [gender, setGender] = useState(null);
  const [favorite, setFavorite] = useState(null);
  const [compareItems, setCompareItems] = useState([]);
  const [compareSig, setCompareSig] = useState('');
  const [chosenCompare, setChosenCompare] = useState(null);
  const [compareSkipped, setCompareSkipped] = useState(false);
  const [finalColor, setFinalColor] = useState(null);
  const [outfitKind, setOutfitKind] = useState(null);
  const [suitColor, setSuitColor] = useState(null);
  const [casualItem, setCasualItem] = useState(null);
  const [expression, setExpression] = useState(null);
  const [background, setBackground] = useState(null);
  const [result, setResult] = useState('');
  const [pipeline, setPipeline] = useState('');
  const [diagnosis, setDiagnosis] = useState({ status: 'idle' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [printCount, setPrintCount] = useState(9);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const imagesRef = useRef(images);
  const voiceOnRef = useRef(true);
  const activatedRef = useRef(false);
  const stepRef = useRef(step);
  const compareFilesRef = useRef([]);
  const compareRunRef = useRef('');

  imagesRef.current = images;
  stepRef.current = step;
  const stepId = STEPS[step];
  const displayName = name.trim();

  // ---------- 음성 안내 ----------
  function speak(text) {
    if (!voiceOnRef.current || !activatedRef.current || typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 0.92;
    const voice = synth.getVoices().find((v) => v.lang?.toLowerCase().startsWith('ko'));
    if (voice) u.voice = voice;
    synth.speak(u);
  }

  const compareLoading = diagnosis.status === 'loading';
  const chosenItem = compareItems.find((x) => x.id === chosenCompare);
  const chosenSeason = compareSkipped ? null : chosenItem?.season || null;
  const favoriteInfo = FAVORITES.find((f) => f.key === favorite);

  const recommended = useMemo(() => {
    if (!chosenSeason) return BASIC_PALETTE;
    const list = [...SEASONS[chosenSeason].palette];
    if (favoriteInfo && favoriteInfo.season === chosenSeason && !list.includes(favoriteInfo.key)) list.unshift(favoriteInfo.key);
    return list;
  }, [chosenSeason, favoriteInfo]);

  const outfitSub = !outfitKind
    ? 'kind'
    : outfitKind === 'suit' && !suitColor
      ? 'suitColor'
      : outfitKind === 'casual' && !casualItem
        ? 'casual'
        : 'done';

  function guideText() {
    switch (stepId) {
      case 'name': return '내 이름을 써 주세요.';
      case 'photos': return '같은 사람의 사진을 2~3장 찍어 주세요. 정면에 가깝고 얼굴이 잘 보이는 사진이 좋아요.';
      case 'gender': return '나는 남학생인가요, 여학생인가요? 골라 주세요.';
      case 'favorite': return '내가 좋아하는 색을 하나 골라 주세요.';
      case 'compare': {
        const ai = diagnosis.status === 'done' ? `AI는 ${SEASONS[diagnosis.season].label} 색을 추천했어요. ` : '';
        return compareLoading
          ? '여러 색 옷을 입은 내 사진을 만들고 있어요. 조금만 기다려 주세요.'
          : `${ai}어떤 색 옷이 제일 나다워요? 사진을 하나 골라 주세요.`;
      }
      case 'mycolor':
        return chosenSeason
          ? `${displayName} 님에게는 ${SEASONS[chosenSeason].desc}이 잘 어울려요. 마음에 드는 색을 하나 골라 주세요.`
          : '마음에 드는 옷 색을 하나 골라 주세요.';
      case 'outfit':
        if (outfitSub === 'kind') return '어떤 옷을 입을까요? 골라 주세요.';
        if (outfitSub === 'suitColor') return '정장 색을 골라 주세요.';
        if (outfitSub === 'casual') return '남방과 니트 중에서 골라 주세요.';
        return '좋아요. 다음을 눌러 주세요.';
      case 'expression': return '어떤 얼굴로 사진을 찍을까요? 활짝 웃는 얼굴, 웃는 얼굴, 차분한 얼굴 중에서 골라 주세요.';
      case 'background': return chosenSeason ? `사진 배경 색을 골라 주세요. 별표는 ${SEASONS[chosenSeason].label}에 어울리는 배경이에요.` : '사진 배경 색을 골라 주세요.';
      case 'result':
        return result ? '나의 프리미엄 프로필이 완성됐어요. 저장하거나 인쇄할 수 있어요.' : '이제 나의 프리미엄 프로필 사진을 만들어요. 사진 만들기 버튼을 눌러 주세요.';
      default: return '';
    }
  }

  useEffect(() => {
    const activate = () => {
      if (activatedRef.current) return;
      activatedRef.current = true;
      speak(guideText());
    };
    window.addEventListener('zain-intro-start', activate);
    window.addEventListener('pointerdown', activate, { once: true });
    return () => {
      window.removeEventListener('zain-intro-start', activate);
      window.removeEventListener('pointerdown', activate);
      window.speechSynthesis?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    speak(guideText());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, outfitSub]);

  function toggleVoice() {
    const next = !voiceOn;
    setVoiceOn(next);
    voiceOnRef.current = next;
    if (!next) window.speechSynthesis?.cancel();
    else {
      activatedRef.current = true;
      speak('소리 안내를 켰어요.');
    }
  }

  // ---------- 사진 ----------
  function addFiles(files) {
    const incoming = [...files].filter((f) => f.type.startsWith('image/'));
    const wrapped = incoming.map((file) => ({ id: fileKey(file), file, url: URL.createObjectURL(file) }));
    setImages((prev) => [...prev, ...wrapped].slice(0, 3));
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

  useEffect(() => () => stopCamera(), []);
  useEffect(() => { if (stepId !== 'photos') stopCamera(); }, [stepId]);

  async function captureOne() {
    if (!videoRef.current || imagesRef.current.length >= 3) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    addFiles([new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })]);
    imagesRef.current = [...imagesRef.current, null];
  }

  async function burstCapture() {
    speak('사진을 최대 세 장까지 찍어요. 카메라를 봐 주세요.');
    const remaining = 3 - imagesRef.current.length;
    for (let i = 0; i < remaining; i++) {
      await captureOne();
      await new Promise((r) => setTimeout(r, 320));
    }
  }

  // ---------- 비교 사진 ----------
  const sig = images.map((i) => i.id).join('|') + '#' + (favorite || '');

  function updateItem(id, patch) {
    setCompareItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  async function runDiagnose(runSig) {
    setDiagnosis({ status: 'loading' });
    try {
      const fd = new FormData();
      compareFilesRef.current.forEach((f) => fd.append('images', f));
      if (favorite) fd.append('favorite', favorite);
      const res = await fetch('/api/diagnose', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '진단하지 못했어요.');
      if (compareRunRef.current === runSig) setDiagnosis({ status: 'done', ...data });
    } catch (e) {
      if (compareRunRef.current === runSig) setDiagnosis({ status: 'error', error: e.message });
    }
  }

  async function runCompare() {
    compareRunRef.current = sig;
    const list = SEASON_ORDER.map((s) => ({ id: s, season: s, colorKey: SEASONS[s].compare }));
    if (favoriteInfo) list.push({ id: 'fav', season: favoriteInfo.season, colorKey: favoriteInfo.key, isFavorite: true });

    const baseImage = images[0]?.url || '';
    setCompareItems(list.map((x) => ({ ...x, status: 'done', image: baseImage, error: '' })));
    setCompareSig(sig);
    setChosenCompare(null);
    setCompareSkipped(false);
    setFinalColor(null);
    compareFilesRef.current = await Promise.all(images.map((i) => resizeImage(i.file, 1024, 0.8)));
    await runDiagnose(sig);
    if (STEPS[stepRef.current] === 'compare') speak('같은 사진으로 옷 색만 비교해 볼게요. 마음에 드는 색을 하나 골라 주세요.');
  }

  useEffect(() => {
    if (stepId === 'compare' && images.length && compareSig !== sig && compareRunRef.current !== sig) runCompare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId, sig]);

  // ---------- 선택 ----------
  function pick(setter, value, label) {
    setter(value);
    if (label) speak(label);
  }

  function chooseGender(g) {
    if (g !== gender) {
      setOutfitKind(null);
      setSuitColor(null);
      setCasualItem(null);
    }
    pick(setGender, g, g === 'male' ? '남학생' : '여학생');
  }

  function chooseCompare(item) {
    setChosenCompare(item.id);
    setCompareSkipped(false);
    setFinalColor(null);
    speak(COLORS[item.colorKey].label);
  }

  function skipCompare() {
    setCompareSkipped(true);
    setChosenCompare(null);
    setFinalColor(null);
    setStep((s) => s + 1);
  }

  function resetOutfit() {
    setOutfitKind(null);
    setSuitColor(null);
    setCasualItem(null);
  }

  function outfitLabel() {
    const kind = OUTFIT_KINDS[gender]?.find((k) => k.id === outfitKind)?.label || '';
    const color = finalColor ? COLORS[finalColor].label : '';
    if (outfitKind === 'suit') {
      const inner = gender === 'male' ? '셔츠' : '블라우스';
      return `${SUIT_COLORS[suitColor]?.label || ''} 정장 + ${color} ${inner}${gender === 'male' ? ' + 넥타이 자동' : ''}`;
    }
    if (outfitKind === 'casual') return `${color} ${CASUAL_ITEMS.find((c) => c.id === casualItem)?.label || ''}`;
    return `${color} ${kind}`;
  }

  // ---------- 다음 단계 조건 ----------
  const canNext = {
    name: !!displayName,
    photos: images.length >= 2,
    gender: !!gender,
    favorite: !!favorite,
    compare: !!chosenCompare,
    mycolor: !!finalColor,
    outfit: outfitSub === 'done',
    expression: !!expression,
    background: !!background,
    result: false
  }[stepId];

  function goNext() {
    if (canNext && step < STEPS.length - 1) setStep(step + 1);
  }
  function goPrev() {
    if (step > 0) setStep(step - 1);
  }

  // ---------- 증명사진 생성 ----------
  async function generate() {
    setError('');
    setLoading(true);
    setResult('');
    speak('프리미엄 프로필 사진을 만들고 있어요. 조금만 기다려 주세요.');
    try {
      const fd = new FormData();
      for (const item of images) fd.append('images', await resizeImage(item.file, 1280, 0.82));
      fd.append('gender', gender);
      fd.append('outfitKind', outfitKind);
      if (outfitKind === 'suit') fd.append('suitColor', suitColor);
      if (outfitKind === 'casual') fd.append('casualItem', casualItem);
      fd.append('colorKey', finalColor);
      fd.append('expression', expression);
      fd.append('background', background);
      const res = await fetch('/api/generate', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '사진을 만들지 못했어요.');
      setResult(data.image);
      setPipeline(data.pipeline || '');
      speak('나의 프리미엄 프로필이 완성됐어요. 저장하거나 인쇄할 수 있어요.');
    } catch (e) {
      setError(e.message || '오류가 발생했습니다.');
      speak('사진을 만들지 못했어요. 선생님께 알려 주세요.');
    } finally {
      setLoading(false);
    }
  }

  function downloadResult() {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = `${displayName || '나의'}_프리미엄프로필.jpg`;
    a.click();
  }

  // ---------- 화면 ----------
  function renderStep() {
    switch (stepId) {
      case 'name':
        return (
          <div className="stage-center">
            <input
              className="name-input"
              value={name}
              maxLength={10}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') goNext(); }}
              placeholder="이름 쓰기"
              aria-label="내 이름"
            />
          </div>
        );

      case 'photos':
        return (
          <div>
            <p className="hint">같은 사람 사진 2~3장이 가장 좋아요. 정면에 가깝고 얼굴이 잘 보이는 사진을 사용해 주세요.</p>
            <div className="row">
              <label className="btn btn-ghost">
                📁 사진 고르기
                <input type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
              </label>
              {!cameraOpen
                ? <button type="button" className="btn btn-ghost" onClick={startCamera}>📷 카메라 열기</button>
                : <button type="button" className="btn btn-ghost" onClick={stopCamera}>카메라 닫기</button>}
            </div>
            {cameraOpen && (
              <div className="camera">
                <video ref={videoRef} autoPlay playsInline muted />
                <div className="row">
                  <button type="button" className="btn" onClick={captureOne} disabled={images.length >= 3}>1장 찍기</button>
                  <button type="button" className="btn" onClick={burstCapture} disabled={images.length >= 3}>여러 장 찍기</button>
                </div>
              </div>
            )}
            <div className="thumbs">
              {images.map((item, idx) => (
                <div className="thumb" key={item.id}>
                  <img src={item.url} alt={`내 사진 ${idx + 1}`} />
                  <button type="button" onClick={() => removeImage(item.id)} aria-label={`${idx + 1}번 사진 지우기`}>×</button>
                </div>
              ))}
              {Array.from({ length: Math.max(0, 3 - images.length) }).map((_, i) => <div className="thumb empty" key={`e${i}`}>+</div>)}
            </div>
            <p className="counter">{images.length} / 3장</p>
          </div>
        );

      case 'gender':
        return (
          <div className="grid grid-2">
            <Choice selected={gender === 'male'} onClick={() => chooseGender('male')} className="choice-big"><span className="icon">👦</span>남학생</Choice>
            <Choice selected={gender === 'female'} onClick={() => chooseGender('female')} className="choice-big"><span className="icon">👧</span>여학생</Choice>
          </div>
        );

      case 'favorite':
        return (
          <div className="grid grid-5">
            {FAVORITES.map((f) => (
              <Choice key={f.key} selected={favorite === f.key} onClick={() => pick(setFavorite, f.key, COLORS[f.key].label)} className="choice-color">
                <Swatch hex={COLORS[f.key].hex} />
                {COLORS[f.key].label}
              </Choice>
            ))}
          </div>
        );

      case 'compare':
        return (
          <div>
            <div className={`ai-card ${diagnosis.status}`}>
              {diagnosis.status === 'loading' && <p><span className="spinner spinner-sm" aria-hidden="true" /> AI가 내 얼굴 색을 살펴보고 있어요</p>}
              {diagnosis.status === 'done' && (
                <>
                  <p className="ai-title">⭐ AI 추천: <strong>{SEASONS[diagnosis.season].label}</strong> ({SEASONS[diagnosis.season].desc})</p>
                  <p>{diagnosis.reason}</p>
                  <details className="teacher">
                    <summary>선생님 확인용</summary>
                    <p>사진 분석: {SEASONS[diagnosis.photoSeason].label} / 좋아하는 색: {diagnosis.favoriteSeason ? SEASONS[diagnosis.favoriteSeason].label : '없음'} / 신뢰도: {{ low: '낮음', medium: '보통', high: '높음' }[diagnosis.confidence] || '-'}</p>
                    <p>점수(사진+좋아하는 색): {SEASON_ORDER.map((x) => `${SEASONS[x].label} ${diagnosis.finalScores?.[x] ?? '-'}`).join(', ')}</p>
                    <p>{diagnosis.teacherNote}</p>
                  </details>
                </>
              )}
              {diagnosis.status === 'error' && <p>AI 추천을 받지 못했어요. 사진을 보고 직접 골라 주세요.</p>}
            </div>
            <div className="grid grid-compare">
              {compareItems.map((item) => (
                <div key={item.id} className="compare-cell">
                  <Choice selected={chosenCompare === item.id} onClick={() => chooseCompare(item)} className="choice-photo">
                    <div className="preview-portrait" style={{ background: `linear-gradient(180deg, #ffffff 0%, ${hexToRgba(COLORS[item.colorKey].hex, 0.12)} 100%)` }}>
                      <img src={item.image} alt={`${COLORS[item.colorKey].label} 옷 색 비교 사진`} />
                      <span className="preview-shirt" style={{ background: COLORS[item.colorKey].hex }} aria-hidden="true" />
                    </div>
                    {diagnosis.status === 'done' && !item.isFavorite && diagnosis.season === item.season && <span className="ai-badge">⭐ AI 추천</span>}
                    <span className="photo-label"><Swatch hex={COLORS[item.colorKey].hex} />{COLORS[item.colorKey].label}{item.isFavorite ? ' (좋아하는 색)' : ''}</span>
                    <small className="compare-caption">같은 얼굴로 옷 색만 비교해요</small>
                  </Choice>
                </div>
              ))}
            </div>
            <div className="row row-end">
              <button type="button" className="btn btn-ghost btn-small" onClick={runCompare} disabled={compareLoading}>AI 추천 다시 보기</button>
              <button type="button" className="btn btn-ghost btn-small" onClick={skipCompare}>건너뛰기</button>
            </div>
          </div>
        );

      case 'mycolor':
        return (
          <div>
            {chosenSeason ? (
              <div className="season-card">
                <span className="season-name">{SEASONS[chosenSeason].label}</span>
                <p>{displayName} 님에게는 <strong>{SEASONS[chosenSeason].desc}</strong>이 잘 어울려요.</p>
                {diagnosis.status === 'done' && diagnosis.season !== chosenSeason && (
                  <p className="hint">AI 추천은 {SEASONS[diagnosis.season].label}이었지만, 내가 고른 색으로 만들어요.</p>
                )}
              </div>
            ) : (
              <p className="hint">비교 사진을 건너뛰었어요. 기본 색 중에서 골라요.</p>
            )}
            <div className="grid grid-4">
              {recommended.map((key) => (
                <Choice key={key} selected={finalColor === key} onClick={() => pick(setFinalColor, key, COLORS[key].label)} className="choice-color choice-color-lg">
                  <Swatch hex={COLORS[key].hex} />
                  {COLORS[key].label}
                  {favorite === key && <small>좋아하는 색</small>}
                </Choice>
              ))}
            </div>
          </div>
        );

      case 'outfit':
        return (
          <div>
            {outfitSub === 'kind' && (
              <div className={`grid ${gender === 'female' ? 'grid-3' : 'grid-2'}`}>
                {OUTFIT_KINDS[gender].map((k) => (
                  <Choice key={k.id} selected={false} onClick={() => pick(setOutfitKind, k.id, k.label)} className="choice-big">
                    <span className="icon">{k.icon}</span>{k.label}
                  </Choice>
                ))}
              </div>
            )}
            {outfitSub === 'suitColor' && (
              <div className="grid grid-3">
                {Object.entries(SUIT_COLORS).map(([id, c]) => (
                  <Choice key={id} selected={false} onClick={() => pick(setSuitColor, id, `${c.label} 정장`)} className="choice-color choice-color-lg">
                    <Swatch hex={c.hex} />{c.label} 정장
                  </Choice>
                ))}
              </div>
            )}
            {outfitSub === 'casual' && (
              <div className="grid grid-2">
                {CASUAL_ITEMS.map((c) => (
                  <Choice key={c.id} selected={false} onClick={() => pick(setCasualItem, c.id, c.label)} className="choice-big">
                    <span className="icon">{c.icon}</span>{c.label}
                  </Choice>
                ))}
              </div>
            )}
            {outfitSub === 'done' && (
              <div className="summary-card">
                <Swatch hex={COLORS[finalColor]?.hex} />
                <p>{outfitLabel()}</p>
                <button type="button" className="btn btn-ghost btn-small" onClick={resetOutfit}>다시 고르기</button>
              </div>
            )}
          </div>
        );

      case 'expression':
        return (
          <div className="grid grid-3">
            {EXPRESSIONS.map((x) => (
              <Choice key={x.id} selected={expression === x.id} onClick={() => pick(setExpression, x.id, x.label)} className="choice-big">
                <span className="icon">{x.icon}</span>{x.label}
              </Choice>
            ))}
          </div>
        );

      case 'background':
        return (
          <div className="grid grid-4">
            {BACKGROUNDS.map((b) => (
              <Choice key={b.id} selected={background === b.id} onClick={() => pick(setBackground, b.id, b.label)} className="choice-color choice-color-lg">
                <Swatch hex={b.hex} />{b.label}
                {chosenSeason && SEASON_BACKGROUND[chosenSeason] === b.id && <small>⭐ 나의 계절</small>}
              </Choice>
            ))}
          </div>
        );

      case 'result':
        return (
          <div className="result">
            <div className="result-photo">
              {result ? <img src={result} alt={`${displayName}의 프리미엄 프로필 사진`} /> : (
                <div className="photo-wait tall">
                  {loading ? <><span className="spinner" aria-hidden="true" /><p>사진을 만들고 있어요</p></> : <p>아직 사진이 없어요</p>}
                </div>
              )}
            </div>
            <div className="result-side">
              <dl className="picks">
                <dt>이름</dt><dd>{displayName}</dd>
                <dt>나의 색</dt><dd><Swatch hex={COLORS[finalColor]?.hex} />{COLORS[finalColor]?.label}</dd>
                <dt>옷</dt><dd>{outfitLabel()}</dd>
                <dt>표정</dt><dd>{EXPRESSIONS.find((x) => x.id === expression)?.label}</dd>
                <dt>배경</dt><dd>{BACKGROUNDS.find((x) => x.id === background)?.label}</dd>
              </dl>
              <button type="button" className="btn btn-primary btn-wide" onClick={generate} disabled={loading}>
                {loading ? '만드는 중…' : result ? '🔄 다시 만들기' : '📸 사진 만들기'}
              </button>
              {result && (
                <>
                  <p className="note">원본 학생의 얼굴 특징을 최대한 유지하면서, 실제 사진관에서 다시 촬영한 듯한 자연스러운 스튜디오 프로필로 생성됩니다. 학생 본인과 충분히 닮지 않으면 다시 만들기를 눌러 주세요.</p>
                  {pipeline && <p className="note">생성 방식: {PIPELINE_LABELS[pipeline] || pipeline}</p>}
                  <button type="button" className="btn btn-wide" onClick={downloadResult}>💾 사진 저장</button>
                  <h3>10 × 15cm 포토용지 인쇄</h3>
                  <div className="row">
                    {PRINT_COUNTS.map((n) => (
                      <button key={n} type="button" className={`chip ${printCount === n ? 'is-on' : ''}`} onClick={() => setPrintCount(n)}>{n}매</button>
                    ))}
                  </div>
                  <button type="button" className="btn btn-wide" onClick={() => window.print()}>🖨 인쇄하기</button>
                </>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  const total = STEPS.length - 1;

  return (
    <main className="shell">
      <header className="topbar no-print">
        <div className="brand">자인사진관</div>
        <div className="voice">
          <button type="button" className="chip" onClick={() => { activatedRef.current = true; speak(guideText()); }} disabled={!voiceOn}>🔁 다시 듣기</button>
          <button type="button" className={`chip ${voiceOn ? 'is-on' : ''}`} onClick={toggleVoice} aria-pressed={voiceOn}>{voiceOn ? '🔊 소리 켜짐' : '🔇 소리 꺼짐'}</button>
        </div>
      </header>

      <section className="card no-print">
        <div className="progress" aria-hidden="true">
          <span style={{ width: `${(Math.min(step, total) / total) * 100}%` }} />
        </div>
        <div className="step-head">
          {stepId !== 'result' && <span className="step-no">{step + 1} / {total}</span>}
          <h1>{STEP_TITLES[stepId]}</h1>
          <p className="guide">{guideText()}</p>
        </div>

        <div className="step-body">{renderStep()}</div>

        {error && <div className="error" role="alert">{error}</div>}

        <nav className="nav">
          <button type="button" className="btn btn-ghost" onClick={goPrev} disabled={step === 0 || loading}>◀ 이전</button>
          {stepId !== 'result' && (
            <button type="button" className="btn btn-primary" onClick={goNext} disabled={!canNext}>다음 ▶</button>
          )}
        </nav>

        <p className="privacy">학생 사진은 생성 과정에서 해외 AI 업체(OpenAI) 서버로 전송됩니다. 보호자 동의 등 학교의 개인정보 처리 기준을 확인한 뒤 사용하세요.</p>
      </section>

      <section className={`print-sheet count-${printCount}`}>
        <div className="print-grid">
          {result && Array.from({ length: printCount }).map((_, i) => <img key={i} src={result} alt="3x4 증명사진" />)}
        </div>
        {result && displayName && <p className="print-name">{displayName}</p>}
      </section>
    </main>
  );
}

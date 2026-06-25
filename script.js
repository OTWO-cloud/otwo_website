const sets = [
  { name: 'Volstone Microphone', year: '2026', client: '오투스튜디오', sketch: 'assets/web/product-01-sketch.webp', real: 'assets/web/product-01-real.webp' },
  { name: 'Arli Easy Nest', year: '2026', client: '오투스튜디오', sketch: 'assets/web/products/sketch/arli-easy-nest.webp', real: 'assets/web/products/real/arli-easy-nest.webp' },
  { name: 'HL Mando Module', year: '2026', client: '오투스튜디오', sketch: 'assets/web/products/sketch/electronic-3.webp', real: 'assets/web/products/real/electronic-3.webp', model: 'assets/models/1031.glb' },
  { name: 'Home AI Hub', year: '2026', client: '오투스튜디오', sketch: 'assets/web/products/sketch/electronic-4.webp', real: 'assets/web/products/real/electronic-4.webp' },
  { name: 'Wearable Controller', year: '2026', client: '오투스튜디오', sketch: 'assets/web/products/sketch/electronic-5.webp', real: 'assets/web/products/real/electronic-5.webp' }
];

const hero = document.getElementById('hero');
const heroYears = document.getElementById('heroYears');
const stage = document.getElementById('stage');
const headline = document.querySelector('.headline');
const headlineReveal = headline.cloneNode(true);
const sideLeft = document.getElementById('sideLeft');
const sideRight = document.getElementById('sideRight');
const carouselShell = document.getElementById('carouselShell');
const productTrack = document.getElementById('productTrack');
const cursorBox = document.getElementById('cursorBox');
const cursorLabel = document.getElementById('cursorLabel');
const currentNo = document.getElementById('currentNo');
const totalNo = document.getElementById('totalNo');
const activeName = document.getElementById('activeName');
const showcaseName = document.getElementById('showcaseName');
const showcaseMeta = document.getElementById('showcaseMeta');
const prevFloatName = document.getElementById('prevFloatName');
const nextFloatName = document.getElementById('nextFloatName');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const leftSelector = document.getElementById('leftSelector');
const rightSelector = document.getElementById('rightSelector');
const scrollProgress = document.getElementById('scrollProgress');
const scrollProgressText = document.getElementById('scrollProgressText');
const clientScene = document.querySelector('.client-scene');
const clientSceneText = document.querySelector('.client-scene p');
const clientTrack = document.querySelector('.client-track');
const propertyBars = [...document.querySelectorAll('.properties label i')];
const materialChips = [...document.querySelectorAll('.material-chips span')];
const materialDots = [...document.querySelectorAll('.material-dots .swatch')];
const revealOverlay = document.createElement('div');
const revealOverlayImage = document.createElement('img');
const assetMetrics = new Map();

cursorLabel.classList.remove('is-visible');

let index = 0;
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let cursorX = mouseX;
let cursorY = mouseY;
let insideProduct = false;
let hasMouseMoved = false;
let isChanging = false;
let parallaxX = 0;
let parallaxY = 0;
let cursorTilt = 0;
let cursorSkewX = 0;
let cursorSkewY = 0;
let revealIndex = index;
let floatTime = 0;
let slideStep = 0;
let lastWheelAt = 0;
let wheelCarry = 0;
let useScrollTrigger = false;
let heroProgress = 0;
let studioProgress = 0;
let studioVelocity = 0;
let isStepAnimating = false;
let queuedStepDelta = 0;
let headlineExitTimer = null;
let cards = [];

headlineReveal.classList.add('headline-reveal');
headlineReveal.setAttribute('aria-hidden', 'true');
headline.after(headlineReveal);
splitHeadlineLetters(headline);
splitHeadlineLetters(headlineReveal);

revealOverlay.className = 'reveal-overlay';
revealOverlay.setAttribute('aria-hidden', 'true');
revealOverlay.appendChild(revealOverlayImage);
document.body.appendChild(revealOverlay);

totalNo.textContent = String(sets.length).padStart(2, '0');

function wrapIndex(value) {
  return (value + sets.length) % sets.length;
}

function signedOffset(i) {
  let offset = i - index;
  const half = Math.floor(sets.length / 2);
  if (offset > half) offset -= sets.length;
  if (offset < -half) offset += sets.length;
  return offset;
}

function splitHeadlineLetters(root) {
  root.querySelectorAll(':scope > span').forEach((word) => {
    const text = word.textContent;
    word.textContent = '';
    Array.from(text).forEach((char) => {
      const letter = document.createElement('span');
      letter.className = 'title-letter';
      letter.innerHTML = char === ' ' ? '&nbsp;' : char;
      word.appendChild(letter);
    });
  });
}

function createCards() {
  productTrack.innerHTML = '';
  cards = sets.map((item, i) => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.dataset.index = i;
    const realLayer = item.model
      ? `<model-viewer class="product real model-product" src="${item.model}" alt="${item.name} 3D model" camera-orbit="35deg 68deg 105%" field-of-view="28deg" exposure="1.08" shadow-intensity=".55" auto-rotate auto-rotate-delay="0" rotation-per-second="18deg" interaction-prompt="none"></model-viewer>`
      : `<img class="product real" src="${item.real}" alt="${item.name} render" />`;
    card.innerHTML = `
      <img class="product sketch" src="${item.sketch}" alt="${item.name} sketch" />
      ${realLayer}
    `;
    productTrack.appendChild(card);
    const probe = new Image();
    probe.onload = () => assetMetrics.set(item.sketch, { width: probe.naturalWidth, height: probe.naturalHeight });
    probe.src = item.sketch;
    return card;
  });
}

function getContainedMediaRect(element, assetPath) {
  const rect = element.getBoundingClientRect();
  const metrics = assetMetrics.get(assetPath);
  if (!metrics?.width || !metrics?.height) return rect;

  const scale = Math.min(rect.width / metrics.width, rect.height / metrics.height);
  const width = metrics.width * scale;
  const height = metrics.height * scale;

  return {
    left: rect.left + (rect.width - width) / 2,
    top: rect.top + (rect.height - height) / 2,
    width,
    height,
    right: rect.left + (rect.width + width) / 2,
    bottom: rect.top + (rect.height + height) / 2
  };
}

function paintLabels() {
  const prev = sets[wrapIndex(index - 1)];
  const current = sets[index];
  const next = sets[wrapIndex(index + 1)];
  prevFloatName.textContent = prev.name;
  activeName.textContent = current.name;
  if (showcaseName) showcaseName.textContent = current.name;
  if (showcaseMeta) showcaseMeta.textContent = `${current.year} | ${current.client}`;
  nextFloatName.textContent = next.name;
  currentNo.textContent = String(index + 1).padStart(2, '0');
}

function paintCursorLabel(item) {
  cursorLabel.innerHTML = `
    <span class="cursor-label-title">${item.name}</span>
    <span class="cursor-label-meta">${item.year} | ${item.client}</span>
  `;
}

function layoutCards() {
  const spacing = Math.min(window.innerWidth * 0.61, 1060);
  cards.forEach((card, i) => {
    const offset = signedOffset(i);
    const distance = Math.abs(offset);
    const x = offset * spacing;
    const y = distance === 0 ? 0 : 16;
    const scale = distance === 0 ? 1 : distance === 1 ? 0.9 : 0.72;
    const opacity = distance === 0 ? 1 : distance === 1 ? 0.56 : 0;
    const blur = distance === 0 ? 0 : distance === 1 ? 0.6 : 7;

    card.classList.toggle('is-active', offset === 0);
    card.classList.toggle('is-side', distance === 1);
    card.classList.toggle('is-far', distance > 1);
    card.dataset.baseX = x;
    card.dataset.baseY = y;
    card.dataset.baseZ = -distance * 90;
    card.dataset.baseScale = scale;
    card.dataset.baseOpacity = opacity;
    card.style.opacity = opacity;
    card.style.filter = `blur(${blur}px)`;
    card.style.pointerEvents = offset === 0 ? 'auto' : 'none';
  });
}

function updateFloatingCards() {
  floatTime += 0.009;
  const studioTarget = slideStep >= 6 ? 1 : 0;
  studioVelocity += (studioTarget - studioProgress) * 0.2;
  studioVelocity *= 0.66;
  studioProgress += studioVelocity;
  if (Math.abs(studioTarget - studioProgress) < 0.001 && Math.abs(studioVelocity) < 0.001) {
    studioProgress = studioTarget;
    studioVelocity = 0;
  }
  studioProgress = Math.max(0, Math.min(1.08, studioProgress));
  const clampedStudio = Math.min(1, Math.max(0, studioProgress));
  const studioEase = 1 - Math.pow(1 - clampedStudio, 3);
  const suction = Math.sin(clampedStudio * Math.PI);
  document.documentElement.style.setProperty('--studio-progress', clampedStudio.toFixed(3));

  cards.forEach((card, i) => {
    const baseX = parseFloat(card.dataset.baseX) || 0;
    const baseY = parseFloat(card.dataset.baseY) || 0;
    const baseZ = parseFloat(card.dataset.baseZ) || 0;
    const scale = parseFloat(card.dataset.baseScale) || 1;
    const baseOpacity = parseFloat(card.dataset.baseOpacity) || 0;
    const transitionX = parseFloat(getComputedStyle(card).getPropertyValue('--transition-x')) || 0;
    const distance = Math.abs(signedOffset(i));
   const floatStrength = (distance === 0 ? 1.35 : distance === 1 ? 0.85 : 0) * (1 - studioEase);
const phase = floatTime + i * 1.37;
const floatX = Math.sin(phase * 0.72) * 6.5 * floatStrength;
const floatY = Math.cos(phase) * 13 * floatStrength;
const floatRot = Math.sin(phase * 0.8) * 0.75 * floatStrength;
    const activeStudio = distance === 0 ? studioEase : 0;
    const focusScene = Math.min(1, Math.max(0, (heroProgress - 0.08) / 0.18));
    const framePhase = Math.min(1, Math.max(0, (heroProgress - 0.34) / 0.28));
    const frameTurn = distance === 0 && slideStep >= 3 && slideStep < 6 ? Math.sin(framePhase * Math.PI * 1.5) * 5 : 0;
    const framePitch = distance === 0 && slideStep >= 3 && slideStep < 6 ? -Math.sin(framePhase * Math.PI) * 2.2 : 0;
    const sideFade = distance === 0 ? 1 : 1 - Math.max(focusScene, studioEase);
    const focusZoom = distance === 0 ? 1 + focusScene * (1 - activeStudio) * 0.38 : 1;
    const studioScale = distance === 0 ? 1 - activeStudio * 0.38 - suction * 0.05 : 1;
    const studioX = distance === 0 ? activeStudio * 0 : 0;
    const studioY = distance === 0 ? activeStudio * -34 : 0;
    const studioZ = distance === 0 ? activeStudio * 180 : 0;


    card.style.transform = `
      translate(-50%, -50%)
      translate3d(${baseX * (1 - activeStudio) + floatX + studioX + transitionX}px, ${baseY + floatY + studioY}px, ${baseZ + studioZ}px)
      rotateY(${frameTurn * (1 - activeStudio)}deg)
      rotateX(${framePitch * (1 - activeStudio)}deg)
      rotate(${floatRot * (1 - activeStudio)}deg)
      scale(${scale * focusZoom * studioScale})
    `;
    card.style.opacity = Math.max(0, baseOpacity * sideFade);
    card.style.filter = distance === 0
      ? `blur(${Math.max(0, 7 * suction - 7 * activeStudio)}px)`
      : `blur(${0.6 + studioEase * 10}px)`;
  });
}

function getActiveCard() {
  return cards[index];
}

function resetRevealExcept(targetIndex) {
  cards.forEach((card) => {
    const real = card.querySelector('.real');
    const sketch = card.querySelector('.sketch');
    if (real) real.style.clipPath = 'polygon(0 0, 0 0, 0 0, 0 0)';
    if (Number(card.dataset.index) !== targetIndex && sketch) clearSketchMask(sketch);
  });
}

function getRevealCandidate() {
  const visibleCards = cards
    .map((card, i) => ({ card, i, distance: Math.abs(signedOffset(i)) }))
    .filter(item => item.distance <= 1);

  const containingCards = visibleCards.filter(({ card }) => {
    const target = card.querySelector('.sketch') || card.querySelector('.real') || card;
    const rect = target.getBoundingClientRect();
    return cursorX >= rect.left && cursorX <= rect.right && cursorY >= rect.top && cursorY <= rect.bottom;
  });

  return containingCards.sort((a, b) => a.distance - b.distance)[0] || { card: getActiveCard(), i: index };
}

function getCursorCorners() {
  const cursorStyle = window.getComputedStyle(cursorBox);
  const width = parseFloat(cursorStyle.width) || 0;
  const height = parseFloat(cursorStyle.height) || 0;
  const borderX = (parseFloat(cursorStyle.borderLeftWidth) || 0) + (parseFloat(cursorStyle.borderRightWidth) || 0);
  const borderY = (parseFloat(cursorStyle.borderTopWidth) || 0) + (parseFloat(cursorStyle.borderBottomWidth) || 0);
  const innerW = Math.max(0, width - borderX);
  const innerH = Math.max(0, height - borderY);
  const halfW = innerW / 2;
  const halfH = innerH / 2;
  const angle = cursorTilt * Math.PI / 180;
  const skewX = Math.tan(cursorSkewX * Math.PI / 180);
  const skewY = Math.tan(cursorSkewY * Math.PI / 180);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return [
    { x: -halfW, y: -halfH },
    { x: halfW, y: -halfH },
    { x: halfW, y: halfH },
    { x: -halfW, y: halfH }
  ].map(point => {
    const skewedX = point.x + point.y * skewX;
    const skewedY = point.y + point.x * skewY;
    return {
      x: cursorX + skewedX * cos - skewedY * sin,
      y: cursorY + skewedX * sin + skewedY * cos
    };
  });
}

function clipElementToCursor(element, rect) {
  const polygon = getCursorCorners()
    .map(point => {
      const x = ((point.x - rect.left) / rect.width) * 100;
      const y = ((point.y - rect.top) / rect.height) * 100;
      return `${x}% ${y}%`;
    })
    .join(', ');

  element.style.clipPath = `polygon(${polygon})`;
}

function maskSketchOutsideCursor(element, rect) {
  if (!rect.width || !rect.height) return;

  const polygon = getCursorCorners()
    .map(point => {
      const x = point.x - rect.left;
      const y = point.y - rect.top;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}" viewBox="0 0 ${rect.width} ${rect.height}"><mask id="m"><rect width="100%" height="100%" fill="white"/><polygon points="${polygon}" fill="black"/></mask><rect width="100%" height="100%" fill="white" mask="url(#m)"/></svg>`;
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  element.style.webkitMaskImage = url;
  element.style.maskImage = url;
  element.style.webkitMaskSize = '100% 100%';
  element.style.maskSize = '100% 100%';
  element.style.webkitMaskRepeat = 'no-repeat';
  element.style.maskRepeat = 'no-repeat';
}

function clearSketchMask(element) {
  element.style.webkitMaskImage = '';
  element.style.maskImage = '';
  element.style.webkitMaskSize = '';
  element.style.maskSize = '';
  element.style.webkitMaskRepeat = '';
  element.style.maskRepeat = '';
}
function clearSketchMask(element) {
  element.style.webkitMaskImage = '';
  element.style.maskImage = '';
  element.style.webkitMaskSize = '';
  element.style.maskSize = '';
  element.style.webkitMaskRepeat = '';
  element.style.maskRepeat = '';
}

function syncRevealImageToSketch(revealImage, sketchElement, rect) {
  const computed = window.getComputedStyle(sketchElement);

  revealImage.style.left = `${rect.left}px`;
  revealImage.style.top = `${rect.top}px`;
  revealImage.style.width = `${rect.width}px`;
  revealImage.style.height = `${rect.height}px`;

  revealImage.style.transformOrigin = computed.transformOrigin || '50% 50%';
  revealImage.style.transformStyle = 'preserve-3d';

  revealImage.style.transform = computed.transform === 'none'
    ? 'none'
    : computed.transform;
}

function clipOverlayToCursor() {
  const polygon = getCursorCorners()
    .map(point => `${(point.x / window.innerWidth) * 100}% ${(point.y / window.innerHeight) * 100}%`)
    .join(', ');

  revealOverlay.style.clipPath = `polygon(${polygon})`;
}

function clipOverlayToCursor() {
  const polygon = getCursorCorners()
    .map(point => `${(point.x / window.innerWidth) * 100}% ${(point.y / window.innerHeight) * 100}%`)
    .join(', ');

  revealOverlay.style.clipPath = `polygon(${polygon})`;
}

function hideRevealOverlay() {
  revealOverlay.style.clipPath = 'polygon(0 0, 0 0, 0 0, 0 0)';
  cards.forEach(card => {
    const sketch = card.querySelector('.sketch');
    if (sketch) clearSketchMask(sketch);
  });
}

function changeProduct(nextIndex) {
  if (isChanging) return;
  isChanging = true;

  const previousIndex = index;
  const direction = nextIndex > index || (index === sets.length - 1 && wrapIndex(nextIndex) === 0) ? 1 : -1;
  const previousCard = cards[previousIndex];
  cards.forEach(card => card.classList.add('is-changing'));
  headline.classList.add('is-changing');
  headlineReveal.classList.add('is-changing');
  activeName.classList.add('is-changing');
  leftSelector.classList.add('is-changing');
  rightSelector.classList.add('is-changing');

  index = wrapIndex(nextIndex);
  revealIndex = index;
  paintLabels();
  resetRevealExcept(index);
  layoutCards();
  updateReveal();

  const nextCard = cards[index];
  if (window.gsap && previousCard && nextCard) {
    gsap.killTweensOf([previousCard, nextCard, hero]);
    gsap.fromTo(previousCard,
      { '--transition-x': '0px' },
      { '--transition-x': `${-direction * 180}px`, duration: 1.12, ease: 'power4.out' }
    );
    gsap.fromTo(nextCard,
      { '--transition-x': `${direction * 220}px` },
      { '--transition-x': '0px', duration: 1.28, ease: 'power4.out' }
    );
    gsap.fromTo(hero,
      { '--sketch-drift': `${direction * 22}px` },
      { '--sketch-drift': '0px', duration: 1.45, delay: 0.12, ease: 'power4.out' }
    );
  }

  window.setTimeout(() => {
    cards.forEach(card => card.classList.remove('is-changing'));
    cards.forEach(card => card.style.setProperty('--transition-x', '0px'));
    headline.classList.remove('is-changing');
    headlineReveal.classList.remove('is-changing');
    activeName.classList.remove('is-changing');
    leftSelector.classList.remove('is-changing');
    rightSelector.classList.remove('is-changing');
    isChanging = false;
  }, 1360);
}

function startRandomIntroSlide() {
  if (!cards.length) return;

  let targetIndex = Math.floor(Math.random() * sets.length);
  if (sets.length > 1 && targetIndex === index) {
    targetIndex = wrapIndex(targetIndex + 1 + Math.floor(Math.random() * (sets.length - 1)));
  }

  changeProduct(targetIndex);
}

function applyStep(nextStep) {
  const previousStep = slideStep;
  slideStep = Math.max(0, Math.min(8, nextStep));
  heroProgress = slideStep / 8;
  document.body.classList.toggle('ui-hidden', slideStep >= 1);
  document.body.classList.toggle('product-focus', slideStep >= 2);
  document.body.classList.toggle('frame-expanded', slideStep >= 3);
  document.body.classList.toggle('render-showcase', slideStep >= 4 && slideStep < 6);
  document.body.classList.toggle('headline-gone', slideStep >= 4);
  document.body.classList.toggle('studio-transition', slideStep >= 6);
  document.body.classList.toggle('clients-scene', slideStep >= 7);
  document.body.classList.toggle('frame-exit', false);
  if (previousStep < 4 && slideStep >= 4) animateHeadlineExit();
  if (previousStep >= 4 && slideStep < 4) resetHeadlineExit();
  updateScrollProgress();
  updateClientScene();
}

function updateScrollProgress() {
  const progress = Math.min(1, Math.max(0, (slideStep - 1) / 7));
  document.documentElement.style.setProperty('--scroll-progress', String(0.28 + progress * 0.72));
  if (scrollProgressText) {
    scrollProgressText.textContent = 'Scroll';
  }
  if (scrollProgress) {
    scrollProgress.setAttribute('aria-label', `Scroll progress ${Math.round(progress * 100)}%`);
  }
}

function updateClientScene() {
  const clientProgress = Math.min(1, Math.max(0, slideStep - 7));
  document.documentElement.style.setProperty('--client-progress', clientProgress.toFixed(3));
}

function animateMaterialControls() {
  propertyBars.forEach((bar, i) => {
    const base = [42, 12, 68, 78, 62][i] || 50;
    const spread = [24, 18, 20, 16, 18][i] || 20;
    const next = Math.max(8, Math.min(94, base + (Math.random() - 0.5) * spread));
    bar.style.setProperty('--value', `${next.toFixed(1)}%`);
    const number = bar.parentElement?.querySelector('em');
    if (number) number.textContent = (next / 78).toFixed(2);
  });

  const activeChip = Math.floor(Math.random() * materialChips.length);
  materialChips.forEach((chip, i) => chip.classList.toggle('active', i === activeChip));

  const activeDot = Math.floor(Math.random() * materialDots.length);
  materialDots.forEach((dot, i) => dot.classList.toggle('active', i === activeDot));
}

function setupScrollMotion() {
  if (!window.gsap) return false;

  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  const headlineLetters = [...headline.querySelectorAll('.title-letter')];
  const revealLetters = [...headlineReveal.querySelectorAll('.title-letter')];

  gsap.set([headline, headlineReveal], {
    autoAlpha: 1,
    y: 0,
    scale: 1,
    filter: 'none'
  });

  // 두 타이틀 글자를 완전히 같은 시작 상태로 세팅
  gsap.set([headlineLetters, revealLetters], {
    autoAlpha: 0,
    y: 28,
    scale: 0.985,
    filter: 'blur(3px)',
    transformOrigin: '50% 60%'
  });

  const tl = gsap.timeline({
    paused: true,
    defaults: {
      ease: 'power2.out'
    }
  });

  // 원본 Make it real
  tl.to(headlineLetters, {
    autoAlpha: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    duration: 1.65,
    stagger: {
      each: 0.018,
      from: 'start'
    }
  }, 0);

  // 오버랩 Make it real
  // 핵심: 같은 0초 지점에서 동시에 시작
  tl.to(revealLetters, {
    autoAlpha: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    duration: 1.65,
    stagger: {
      each: 0.018,
      from: 'start'
    }
  }, 0);

  window.heroTimeline = tl;
  return true;
}

let headlineHasEntered = false;

function revealHeadlineSmooth() {
  if (!window.heroTimeline) return;

  window.heroTimeline.pause(0);
  window.heroTimeline.restart(true);

  window.setTimeout(() => {
    headlineHasEntered = true;
    window.heroTimeline?.progress(1);
  }, 1900);
}

function animateHeroYears() {
  if (!heroYears) return;

  document.body.classList.remove('is-years-hidden');
  heroYears.querySelectorAll('.year-count').forEach((year) => {
    year.textContent = String(Number(year.dataset.from) || 2000);
  });

  window.setTimeout(() => {
    document.body.classList.add('is-ready');
    heroYears.querySelectorAll('.year-count').forEach((year, i) => {
      const from = Number(year.dataset.from) || 2000;
      const to = Number(year.dataset.to) || from;
      const duration = 1050 + i * 120;
      const startDelay = 760 + i * 120;
      const start = performance.now() + startDelay;

      const tick = (now) => {
        const raw = Math.min(1, Math.max(0, (now - start) / duration));
        const eased = 1 - Math.pow(1 - raw, 4);
        year.textContent = String(Math.round(from + (to - from) * eased));

        if (raw < 1) {
          requestAnimationFrame(tick);
        } else {
          year.textContent = String(to);
        }
      };

      requestAnimationFrame(tick);
    });

    window.setTimeout(() => {
      heroYears.querySelectorAll('.year-count').forEach((year, i) => {
        const from = Number(year.dataset.to) || Number(year.textContent) || 2026;
        const to = from + 11 + i * 3;
        const duration = 760;
        const start = performance.now();

        const tick = (now) => {
          const raw = Math.min(1, Math.max(0, (now - start) / duration));
          const eased = 1 - Math.pow(1 - raw, 3);
          year.textContent = String(Math.round(from + (to - from) * eased));

          if (raw < 1) {
            requestAnimationFrame(tick);
          }
        };

        requestAnimationFrame(tick);
      });
      document.body.classList.add('is-years-hidden');
    }, 2950);
  }, 420);
}

function syncTitleTimeline(value) {
  if (slideStep >= 4 || document.body.classList.contains('headline-falling')) return;

  // 한 번 등장한 뒤에는 다시 0으로 돌아가서 사라지지 않게 고정
  if (headlineHasEntered && slideStep < 6) {
    window.heroTimeline?.progress(1);
    return;
  }

  const titleProgress = Math.min(1, Math.max(0, value / 0.125));
  window.heroTimeline?.progress(titleProgress);
}

function getHeadlineLetters() {
  return [
    ...headline.querySelectorAll('.title-letter'),
    ...headlineReveal.querySelectorAll('.title-letter')
  ];
}

function getHeadlineLetterLayers() {
  return {
    base: [...headline.querySelectorAll('.title-letter')],
    reveal: [...headlineReveal.querySelectorAll('.title-letter')]
  };
}

function resetHeadlineExit() {
  window.clearTimeout(headlineExitTimer);
  document.body.classList.remove('headline-falling', 'headline-finished');
  const letters = getHeadlineLetters();

  if (window.gsap) {
    gsap.killTweensOf(letters);
    gsap.set(letters, {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)'
    });
  } else {
    letters.forEach(letter => {
      letter.style.opacity = '';
      letter.style.transform = '';
      letter.style.filter = '';
    });
  }
}

function animateHeadlineExit() {
  const { base, reveal } = getHeadlineLetterLayers();
  const letters = [...base, ...reveal];
  document.body.classList.remove('headline-finished');
  document.body.classList.add('headline-falling');
  window.clearTimeout(headlineExitTimer);

  if (window.gsap) {
    gsap.killTweensOf(letters);
    const exitVars = {
      autoAlpha: 0,
      y: 96,
      scale: 0.985,
      filter: 'blur(5px)',
      duration: 0.58,
      ease: 'power3.in',
      stagger: {
        each: 0.018,
        from: 'start'
      }
    };

    gsap.to(base, exitVars);
    gsap.to(reveal, {
      ...exitVars,
      onComplete() {
        document.body.classList.add('headline-finished');
        document.body.classList.remove('headline-falling');
      }
    });
    return;
  }

  headlineExitTimer = window.setTimeout(() => {
    document.body.classList.add('headline-finished');
    document.body.classList.remove('headline-falling');
  }, 760);
}

function animateStep(nextStep) {
  const clampedStep = Math.max(0, Math.min(8, nextStep));
  if (clampedStep === slideStep) return;

  if (isStepAnimating) {
    queuedStepDelta += clampedStep > slideStep ? 1 : -1;
    queuedStepDelta = Math.max(-3, Math.min(3, queuedStepDelta));
    return;
  }

  isStepAnimating = true;
  const previousStep = slideStep;
  applyStep(clampedStep);

  const finish = () => {
    isStepAnimating = false;
    if (!queuedStepDelta) return;

    const delta = queuedStepDelta;
    queuedStepDelta = 0;
    animateStep(slideStep + delta);
  };

  if (!window.gsap) {
    window.setTimeout(finish, 420);
    return;
  }

  const progress = slideStep / 8;
  gsap.to({ value: previousStep / 8 }, {
    value: progress,
    duration: 0.72,
    ease: 'power4.out',
    onUpdate() {
      heroProgress = this.targets()[0].value;
      syncTitleTimeline(heroProgress);
    },
    onComplete: finish
  });
}

function updateReveal() {
  if (!hasMouseMoved) {
    insideProduct = false;
    cursorBox.classList.remove('is-inside', 'is-button');
    cursorLabel.classList.remove('is-visible');
    document.body.appendChild(cursorLabel);
cursorLabel.style.zIndex = '300';
    hideRevealOverlay();
    headlineReveal.style.clipPath = 'polygon(0 0, 0 0, 0 0, 0 0)';
    return;
  }

  const revealTarget = getRevealCandidate();
  const activeCard = revealTarget.card;
  if (!activeCard) return;

  const activeReal = activeCard.querySelector('.real');
  const activeSketch = activeCard.querySelector('.sketch');
  const rect = activeCard.getBoundingClientRect();
  const revealX = cursorX;
  const revealY = cursorY;
  insideProduct = revealX >= rect.left && revealX <= rect.right && revealY >= rect.top && revealY <= rect.bottom;
  revealIndex = revealTarget.i;

  const currentElement = document.elementFromPoint(mouseX, mouseY);
  const onButton = currentElement?.closest('button');
  cursorBox.classList.toggle('is-inside', insideProduct);
  cursorBox.classList.toggle('is-button', !!onButton && !insideProduct);
  cursorLabel.classList.toggle('is-visible', insideProduct);

  resetRevealExcept(revealIndex);

  if (insideProduct && activeReal) {
    const revealSet = sets[revealIndex];
    const sketchRect = activeSketch?.getBoundingClientRect() || rect;
    paintCursorLabel(revealSet);
    if (revealOverlayImage.getAttribute('src') !== revealSet.real) {
      revealOverlayImage.setAttribute('src', revealSet.real);
    }
    revealOverlayImage.style.left = `${sketchRect.left}px`;
    revealOverlayImage.style.top = `${sketchRect.top}px`;
    revealOverlayImage.style.width = `${sketchRect.width}px`;
    revealOverlayImage.style.height = `${sketchRect.height}px`;
    revealOverlayImage.style.transform = 'none';
    if (activeSketch) maskSketchOutsideCursor(activeSketch, sketchRect);
    clipOverlayToCursor();
    clipElementToCursor(headlineReveal, headlineReveal.getBoundingClientRect());
  } else if (activeReal) {
    activeReal.style.clipPath = 'polygon(0 0, 0 0, 0 0, 0 0)';
    if (activeSketch) clearSketchMask(activeSketch);
    revealOverlayImage.style.transform = 'none';
    hideRevealOverlay();
    headlineReveal.style.clipPath = 'polygon(0 0, 0 0, 0 0, 0 0)';
  }

  updateCursorLabel();
}

function updateCursorLabel() {
  if (!insideProduct) return;
  const cursorRect = cursorBox.getBoundingClientRect();
  const x = Math.max(18, cursorRect.right - 18);
  const y = Math.min(window.innerHeight - 18, cursorRect.bottom - 42);
  cursorLabel.style.left = `${x}px`;
  cursorLabel.style.top = `${y}px`;
  cursorLabel.style.transform = `translate3d(-100%, -50%, 0) rotate(${cursorTilt}deg)`;
}

function updateParallax() {
  const nx = (mouseX / window.innerWidth - 0.5) * 2;
  const ny = (mouseY / window.innerHeight - 0.5) * 2;
  parallaxX += (nx - parallaxX) * 0.052;
  parallaxY += (ny - parallaxY) * 0.052;

  document.documentElement.style.setProperty('--look-x', parallaxX.toFixed(3));
  document.documentElement.style.setProperty('--look-y', parallaxY.toFixed(3));
  stage.style.transform = 'translate3d(0, 0, 0)';
  if (slideStep < 6) {
    headline.style.transform = `translateX(-50%) translate3d(${-parallaxX * 10}px, ${-parallaxY * 4}px, 0)`;
    headlineReveal.style.transform = headline.style.transform;
  } else {
    headline.style.transform = '';
    headlineReveal.style.transform = '';
  }

  cards.forEach((card) => {
    card.querySelectorAll('.product').forEach(product => {
      const studioLook = slideStep >= 6 ? 1 : 0;
      const depth = product.classList.contains('real') ? 1 : .7;
product.style.transform = `
  perspective(760px)
  rotateY(${parallaxX * (7.2 + studioLook * 2.2) * depth}deg)
  rotateX(${-parallaxY * (4.2 + studioLook * 1.6) * depth}deg)
  translate3d(${parallaxX * (8 + studioLook * 4)}px, ${parallaxY * (5 + studioLook * 2.5)}px, 0)
`;
    });
  });
}

function animate() {
  const prevCursorX = cursorX;
  const prevCursorY = cursorY;
  cursorX += (mouseX - cursorX) * 0.095;
  cursorY += (mouseY - cursorY) * 0.095;
  const velocityX = cursorX - prevCursorX;
  const velocityY = cursorY - prevCursorY;
  const speed = Math.min(1, Math.hypot(velocityX, velocityY) / 58);
  const targetTilt = Math.max(-2, Math.min(2, velocityX * 0.09));
  const targetSkewX = Math.max(-0.45, Math.min(0.45, velocityY * -0.018)) * speed;
  const targetSkewY = Math.max(-0.28, Math.min(0.28, velocityX * 0.01)) * speed;
  cursorTilt += (targetTilt - cursorTilt) * 0.16;
  cursorSkewX += (targetSkewX - cursorSkewX) * 0.14;
  cursorSkewY += (targetSkewY - cursorSkewY) * 0.14;
  cursorBox.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%) rotate(${cursorTilt}deg) skew(${cursorSkewX}deg, ${cursorSkewY}deg)`;

  updateFloatingCards();
  updateParallax();
  updateReveal();
  updateCursorLabel();

  requestAnimationFrame(animate);
}

window.addEventListener('mousemove', (e) => {
  hasMouseMoved = true;
  mouseX = e.clientX;
  mouseY = e.clientY;
});

window.addEventListener('wheel', (e) => {
  wheelCarry += e.deltaY;
  const threshold = slideStep >= 7 ? 74 : 118;
  const steps = Math.trunc(wheelCarry / threshold);
  if (!steps) return;
  wheelCarry -= steps * threshold;
  const cappedSteps = Math.max(-3, Math.min(3, steps));
  if (isStepAnimating) {
    queuedStepDelta += cappedSteps;
    queuedStepDelta = Math.max(-3, Math.min(3, queuedStepDelta));
    return;
  }
  animateStep(slideStep + cappedSteps);
}, { passive: true });

prevBtn.addEventListener('click', () => changeProduct(index - 1));
nextBtn.addEventListener('click', () => changeProduct(index + 1));

window.addEventListener('resize', () => {
  layoutCards();
  updateReveal();
});

window.setInterval(animateMaterialControls, 900);

window.addEventListener('load', () => {
  const intro = document.getElementById('introScreen');

  // 너무 오래 기다리지 않고 바로 메인으로 전환
  window.setTimeout(() => {
    document.body.classList.remove('is-intro');

    // Make it real을 인트로가 사라지는 타이밍과 동시에 부드럽게 등장
    revealHeadlineSmooth();
    animateHeroYears();

    if (window.gsap && intro) {
      gsap.to(intro, {
        autoAlpha: 0,
        duration: 0.85,
        ease: 'power2.inOut',
        onComplete: () => intro.remove()
      });
    } else {
      intro?.remove();
    }
  }, 550);
});

createCards();
paintLabels();
layoutCards();
useScrollTrigger = setupScrollMotion();
applyStep(0);
window.heroTimeline?.progress(0);
updateScrollProgress();
updateClientScene();
updateReveal();
animate();

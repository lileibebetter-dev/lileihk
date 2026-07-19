const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('[data-menu-button]');
const mobileNav = document.querySelector('[data-mobile-nav]');

const initHeroMotion = () => {
  const hero = document.querySelector('.hero');
  const gridCanvas = document.querySelector('[data-hero-grid]');
  const typeCanvas = document.querySelector('[data-hero-type]');
  const gridContext = gridCanvas?.getContext('2d');
  const typeContext = typeCanvas?.getContext('2d');

  if (!hero || !gridCanvas || !typeCanvas || !gridContext || !typeContext) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = { x: -1000, y: -1000, active: false };
  let width = 0;
  let height = 0;
  let gridDots = [];
  let typeDots = [];
  let frame = 0;
  let visible = true;
  let introComplete = reducedMotion;
  let introStartedAt = 0;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const mix = (from, to, progress) => from + (to - from) * progress;
  const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);
  const easeInOutCubic = (value) => value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
  const seeded = (x, y, salt = 0) => {
    const value = Math.sin(x * 12.9898 + y * 78.233 + salt * 37.719) * 43758.5453;
    return value - Math.floor(value);
  };

  const timing = () => width <= 640
    ? { black: 240, burst: 820, title: 1580, subtitle: 2050 }
    : { black: 380, burst: 1320, title: 2600, subtitle: 3200 };

  const setCanvasSize = (canvas, context, pixelRatio) => {
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };

  const typeSize = () => {
    if (width > 1300) return 260;
    if (width > 900) return 190;
    if (width > 640) return 132;
    return 78;
  };

  const subtitleSize = () => {
    if (width > 1300) return 34;
    if (width > 900) return 30;
    if (width > 640) return 24;
    return 18;
  };

  const createTypeDot = (x, y, kind) => {
    const centerX = width / 2;
    const centerY = height * 0.46;
    const angle = seeded(x, y, 1) * Math.PI * 2;
    const reach = Math.hypot(width, height) * (0.18 + seeded(x, y, 2) * 0.48);

    return {
      baseX: x,
      baseY: y,
      burstX: centerX + Math.cos(angle) * reach,
      burstY: centerY + Math.sin(angle) * reach,
      x: centerX,
      y: centerY,
      kind,
      delay: seeded(x, y, 3) * 0.18,
      green: seeded(x, y, 4) > 0.86,
      phase: seeded(x, y, 5) * Math.PI * 2
    };
  };

  const rebuild = () => {
    const bounds = hero.getBoundingClientRect();
    width = Math.max(1, Math.round(bounds.width));
    height = Math.max(1, Math.round(bounds.height));
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    setCanvasSize(gridCanvas, gridContext, pixelRatio);
    setCanvasSize(typeCanvas, typeContext, pixelRatio);

    const gridGap = width <= 640 ? 22 : 28;
    gridDots = [];
    for (let y = gridGap / 2; y < height; y += gridGap) {
      for (let x = gridGap / 2; x < width; x += gridGap) {
        gridDots.push({ x, y });
      }
    }

    const sampler = document.createElement('canvas');
    sampler.width = width;
    sampler.height = height;
    const samplerContext = sampler.getContext('2d', { willReadFrequently: true });
    if (!samplerContext) return;

    const fontSize = typeSize();
    const smallFontSize = subtitleSize();
    const titleY = height * 0.44;
    const subtitle = '把复杂的 AI 能力，做成用户能理解、团队能交付、业务真正用得起来的产品。';
    samplerContext.clearRect(0, 0, width, height);
    samplerContext.fillStyle = '#ffffff';
    samplerContext.font = `600 ${fontSize}px Inter, Helvetica Neue, Arial, sans-serif`;
    samplerContext.textAlign = 'center';
    samplerContext.textBaseline = 'middle';
    samplerContext.fillText('LI LEI', width / 2, titleY);

    samplerContext.font = `600 ${smallFontSize}px Inter, PingFang SC, Microsoft YaHei, sans-serif`;
    const subtitleWidth = samplerContext.measureText(subtitle).width;
    const subtitleLines = width <= 640
      ? ['把复杂的 AI 能力，做成用户能理解、', '团队能交付、业务真正用得起来的产品。']
      : subtitleWidth <= width - 80
        ? [subtitle]
        : ['把复杂的 AI 能力，做成用户能理解、团队能交付，', '业务真正用得起来的产品。'];
    const subtitleStartY = titleY + fontSize * 0.63 + smallFontSize;
    subtitleLines.forEach((line, index) => {
      samplerContext.fillText(line, width / 2, subtitleStartY + index * smallFontSize * 1.55);
    });

    const pixels = samplerContext.getImageData(0, 0, width, height).data;
    const sampleGap = width <= 640 ? 3 : 4;
    const minY = Math.max(0, Math.floor(titleY - fontSize * 0.65));
    const maxY = Math.min(height, Math.ceil(titleY + fontSize * 0.65));
    typeDots = [];

    for (let y = minY; y < maxY; y += sampleGap) {
      for (let x = 0; x < width; x += sampleGap) {
        if (pixels[(y * width + x) * 4 + 3] > 100) {
          typeDots.push(createTypeDot(x, y, 'title'));
        }
      }
    }

    const subtitleMinY = Math.max(0, Math.floor(subtitleStartY - smallFontSize));
    const subtitleMaxY = Math.min(
      height,
      Math.ceil(subtitleStartY + (subtitleLines.length - 1) * smallFontSize * 1.55 + smallFontSize)
    );
    const subtitleGap = 2;

    for (let y = subtitleMinY; y < subtitleMaxY; y += subtitleGap) {
      for (let x = 20; x < width - 20; x += subtitleGap) {
        if (pixels[(y * width + x) * 4 + 3] > 100) {
          typeDots.push(createTypeDot(x, y, 'subtitle'));
        }
      }
    }

    document.documentElement.classList.add('hero-motion-ready');
    if (introComplete) {
      typeDots.forEach((dot) => {
        dot.x = dot.baseX;
        dot.y = dot.baseY;
      });
      draw();
    }
  };

  const drawGrid = (opacity = 1) => {
    gridContext.clearRect(0, 0, width, height);
    const radius = width <= 640 ? 92 : 150;

    for (const dot of gridDots) {
      let x = dot.x;
      let y = dot.y;
      let fill = `rgba(244, 242, 236, ${0.1 * opacity})`;
      let size = 0.65;

      if (pointer.active && introComplete) {
        const dx = dot.x - pointer.x;
        const dy = dot.y - pointer.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance < radius) {
          const strength = 1 - distance / radius;
          x += (dx / distance) * strength * 8;
          y += (dy / distance) * strength * 8;
          size = 0.8 + strength * 0.85;
          fill = `rgba(199, 255, 61, ${(0.2 + strength * 0.62) * opacity})`;
        }
      }

      gridContext.beginPath();
      gridContext.arc(x, y, size, 0, Math.PI * 2);
      gridContext.fillStyle = fill;
      gridContext.fill();
    }

    if (pointer.active && introComplete) {
      gridContext.beginPath();
      gridContext.arc(pointer.x, pointer.y, 18, 0, Math.PI * 2);
      gridContext.strokeStyle = 'rgba(199, 255, 61, 0.55)';
      gridContext.lineWidth = 1;
      gridContext.stroke();
    }
  };

  const drawType = () => {
    typeContext.clearRect(0, 0, width, height);
    const radius = width <= 640 ? 86 : 132;

    for (const dot of typeDots) {
      const isSubtitle = dot.kind === 'subtitle';
      let targetX = dot.baseX;
      let targetY = dot.baseY;
      let fill = isSubtitle ? 'rgba(244, 242, 236, 0.92)' : 'rgba(244, 242, 236, 0.9)';
      let size = isSubtitle ? 0.95 : (width <= 640 ? 1.05 : 1.1);

      if (pointer.active) {
        const dx = dot.baseX - pointer.x;
        const dy = dot.baseY - pointer.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance < radius) {
          const strength = 1 - distance / radius;
          const displacement = isSubtitle ? 22 : 34;
          targetX += (dx / distance) * strength * displacement;
          targetY += (dy / distance) * strength * displacement;
          size += strength * (isSubtitle ? 0.55 : 0.9);
          fill = `rgba(199, 255, 61, ${0.66 + strength * 0.34})`;
        }
      }

      dot.x += (targetX - dot.x) * 0.15;
      dot.y += (targetY - dot.y) * 0.15;
      typeContext.fillStyle = fill;
      typeContext.fillRect(dot.x - size, dot.y - size, size * 2, size * 2);
    }
  };

  const drawIntroPixel = (dot, x, y, alpha, size) => {
    if (alpha <= 0) return;
    typeContext.fillStyle = dot.green
      ? `rgba(199, 255, 61, ${alpha})`
      : `rgba(244, 242, 236, ${alpha})`;
    typeContext.fillRect(x - size, y - size, size * 2, size * 2);
  };

  const drawBurstRings = (progress) => {
    const centerX = width / 2;
    const centerY = height * 0.46;
    const maxRadius = Math.min(width, height) * 0.42;

    typeContext.save();
    typeContext.globalCompositeOperation = 'lighter';
    for (let index = 0; index < 3; index += 1) {
      const local = clamp((progress - index * 0.12) / (1 - index * 0.12));
      if (local <= 0 || local >= 1) continue;
      typeContext.beginPath();
      typeContext.arc(centerX, centerY, maxRadius * easeOutCubic(local), 0, Math.PI * 2);
      typeContext.strokeStyle = index === 1
        ? `rgba(199, 255, 61, ${(1 - local) * 0.42})`
        : `rgba(244, 242, 236, ${(1 - local) * 0.24})`;
      typeContext.lineWidth = 1;
      typeContext.stroke();
    }
    typeContext.restore();
  };

  const settleIntro = () => {
    if (introComplete) return;
    introComplete = true;
    pointer.active = false;
    hero.dataset.introStage = 'interactive';
    typeDots.forEach((dot) => {
      dot.x = dot.baseX;
      dot.y = dot.baseY;
    });
    document.documentElement.classList.remove(
      'hero-intro-pending',
      'hero-intro-active',
      'hero-intro-reveal',
      'hero-intro-ui'
    );
    document.documentElement.classList.add('hero-intro-settled');
    draw();
  };

  const drawIntro = (now) => {
    const stages = timing();
    const elapsed = now - introStartedAt;
    const centerX = width / 2;
    const centerY = height * 0.46;

    typeContext.clearRect(0, 0, width, height);

    if (elapsed < stages.black) {
      hero.dataset.introStage = 'black';
      gridContext.clearRect(0, 0, width, height);
      return;
    }

    if (elapsed < stages.burst) {
      hero.dataset.introStage = 'burst';
      gridContext.clearRect(0, 0, width, height);
      const progress = clamp((elapsed - stages.black) / (stages.burst - stages.black));
      drawBurstRings(progress);
      typeContext.save();
      typeContext.globalCompositeOperation = 'lighter';
      typeDots.forEach((dot, index) => {
        const local = clamp((progress - dot.delay) / (1 - dot.delay));
        const travel = easeOutCubic(local);
        const x = mix(centerX, dot.burstX, travel);
        const y = mix(centerY, dot.burstY, travel);
        const alpha = clamp(local * 4) * (0.82 - progress * 0.28);
        const size = dot.kind === 'subtitle' ? 0.7 : 0.85;
        drawIntroPixel(dot, x, y, alpha, size);

        if (index % 24 === 0 && local > 0.08) {
          const tail = 10 + local * 18;
          const angle = Math.atan2(dot.burstY - centerY, dot.burstX - centerX);
          typeContext.beginPath();
          typeContext.moveTo(x, y);
          typeContext.lineTo(x - Math.cos(angle) * tail, y - Math.sin(angle) * tail);
          typeContext.strokeStyle = dot.green
            ? `rgba(199, 255, 61, ${alpha * 0.28})`
            : `rgba(244, 242, 236, ${alpha * 0.18})`;
          typeContext.lineWidth = 0.7;
          typeContext.stroke();
        }
      });
      typeContext.restore();
      return;
    }

    document.documentElement.classList.add('hero-intro-reveal');

    if (elapsed < stages.title) {
      hero.dataset.introStage = 'title';
      const progress = clamp((elapsed - stages.burst) / (stages.title - stages.burst));
      drawGrid(easeOutCubic(progress));
      typeDots.forEach((dot) => {
        const isSubtitle = dot.kind === 'subtitle';
        const delayed = clamp((progress - dot.delay * 0.42) / (1 - dot.delay * 0.42));
        const travel = easeInOutCubic(delayed);
        const float = Math.sin(now * 0.002 + dot.phase) * 3;
        const x = isSubtitle ? dot.burstX + float : mix(dot.burstX, dot.baseX, travel);
        const y = isSubtitle ? dot.burstY - float : mix(dot.burstY, dot.baseY, travel);
        dot.x = x;
        dot.y = y;
        drawIntroPixel(dot, x, y, isSubtitle ? 0.12 * (1 - progress) : 0.3 + travel * 0.62, isSubtitle ? 0.65 : 1.02);
      });
      return;
    }

    document.documentElement.classList.add('hero-intro-ui');
    hero.dataset.introStage = 'subtitle';
    const progress = clamp((elapsed - stages.title) / (stages.subtitle - stages.title));
    drawGrid(1);
    typeDots.forEach((dot) => {
      const isSubtitle = dot.kind === 'subtitle';
      const delayed = clamp((progress - dot.delay * 0.3) / (1 - dot.delay * 0.3));
      const travel = easeInOutCubic(delayed);
      const x = isSubtitle ? mix(dot.burstX, dot.baseX, travel) : dot.baseX;
      const y = isSubtitle ? mix(dot.burstY, dot.baseY, travel) : dot.baseY;
      dot.x = x;
      dot.y = y;
      drawIntroPixel(dot, x, y, isSubtitle ? 0.25 + travel * 0.67 : 0.9, isSubtitle ? 0.95 : 1.1);
    });

    if (elapsed >= stages.subtitle) settleIntro();
  };

  const draw = () => {
    drawGrid();
    drawType();
  };

  const animate = (now) => {
    if (!visible) {
      frame = 0;
      return;
    }
    if (introComplete) draw();
    else drawIntro(now);
    frame = window.requestAnimationFrame(animate);
  };

  const startLoop = () => {
    if (!frame && visible && !reducedMotion) {
      frame = window.requestAnimationFrame(animate);
    }
  };

  const updatePointer = (event) => {
    if (!introComplete || reducedMotion) return;
    const bounds = hero.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
    pointer.active = true;
  };

  hero.addEventListener('pointermove', updatePointer, { passive: true });
  hero.addEventListener('pointerdown', (event) => {
    if (!introComplete) {
      settleIntro();
      return;
    }
    updatePointer(event);
  }, { passive: true });
  hero.addEventListener('pointerleave', () => {
    pointer.active = false;
  }, { passive: true });

  const skipOnIntent = () => {
    if (!introComplete) settleIntro();
  };
  window.addEventListener('keydown', skipOnIntent, { passive: true });
  window.addEventListener('wheel', skipOnIntent, { passive: true });
  window.addEventListener('touchstart', skipOnIntent, { passive: true });

  const resizeObserver = new ResizeObserver(rebuild);
  resizeObserver.observe(hero);

  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) startLoop();
  }, { threshold: 0.01 });
  intersectionObserver.observe(hero);

  rebuild();
  document.documentElement.classList.remove('hero-intro-pending');
  if (reducedMotion) {
    hero.dataset.introStage = 'interactive';
    document.documentElement.classList.add('hero-intro-settled');
    draw();
  } else {
    hero.dataset.introStage = 'black';
    document.documentElement.classList.add('hero-intro-active');
    introStartedAt = performance.now();
    startLoop();
  }
};

initHeroMotion();

const syncHeader = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 24);
};

syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });

const closeMenu = () => {
  if (!menuButton || !mobileNav || !header) return;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', '打开导航');
  mobileNav.classList.remove('is-open');
  header.classList.remove('menu-open');
  document.body.classList.remove('menu-open');
};

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  if (open) {
    closeMenu();
    return;
  }

  menuButton.setAttribute('aria-expanded', 'true');
  menuButton.setAttribute('aria-label', '关闭导航');
  mobileNav?.classList.add('is-open');
  header?.classList.add('menu-open');
  document.body.classList.add('menu-open');
});

mobileNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMenu);
});

const railWraps = [...document.querySelectorAll('.rail-wrap')];

const syncRailActions = () => {
  railWraps.forEach((wrap) => {
    const rail = wrap.querySelector('[data-rail]');
    const actions = wrap.querySelector('.rail-actions');
    if (!rail || !actions) return;
    actions.hidden = rail.scrollWidth <= rail.clientWidth + 2;
  });
};

railWraps.forEach((wrap) => {
  const rail = wrap.querySelector('[data-rail]');
  if (!rail) return;

  wrap.querySelectorAll('[data-scroll]').forEach((button) => {
    button.addEventListener('click', () => {
      const direction = Number(button.dataset.scroll || 1);
      rail.scrollBy({ left: rail.clientWidth * 0.78 * direction, behavior: 'smooth' });
    });
  });
});

window.addEventListener('load', syncRailActions);
window.addEventListener('resize', syncRailActions, { passive: true });
syncRailActions();

const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();

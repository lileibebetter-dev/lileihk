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
          typeDots.push({ baseX: x, baseY: y, x, y, kind: 'title' });
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
          typeDots.push({ baseX: x, baseY: y, x, y, kind: 'subtitle' });
        }
      }
    }

    document.documentElement.classList.add('hero-motion-ready');
    draw();
  };

  const drawGrid = () => {
    gridContext.clearRect(0, 0, width, height);
    const radius = width <= 640 ? 92 : 150;

    for (const dot of gridDots) {
      let x = dot.x;
      let y = dot.y;
      let fill = 'rgba(244, 242, 236, 0.1)';
      let size = 0.65;

      if (pointer.active) {
        const dx = dot.x - pointer.x;
        const dy = dot.y - pointer.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance < radius) {
          const strength = 1 - distance / radius;
          x += (dx / distance) * strength * 8;
          y += (dy / distance) * strength * 8;
          size = 0.8 + strength * 0.85;
          fill = `rgba(199, 255, 61, ${0.2 + strength * 0.62})`;
        }
      }

      gridContext.beginPath();
      gridContext.arc(x, y, size, 0, Math.PI * 2);
      gridContext.fillStyle = fill;
      gridContext.fill();
    }

    if (pointer.active) {
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

  const draw = () => {
    drawGrid();
    drawType();
  };

  const animate = () => {
    if (!visible) {
      frame = 0;
      return;
    }
    draw();
    frame = window.requestAnimationFrame(animate);
  };

  const updatePointer = (event) => {
    const bounds = hero.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
    pointer.active = true;
    if (reducedMotion) draw();
  };

  hero.addEventListener('pointermove', updatePointer, { passive: true });
  hero.addEventListener('pointerdown', updatePointer, { passive: true });
  hero.addEventListener('pointerleave', () => {
    pointer.active = false;
    if (reducedMotion) draw();
  }, { passive: true });

  const resizeObserver = new ResizeObserver(rebuild);
  resizeObserver.observe(hero);

  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !reducedMotion && !frame) animate();
  }, { threshold: 0.01 });
  intersectionObserver.observe(hero);

  rebuild();
  if (!reducedMotion) animate();
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

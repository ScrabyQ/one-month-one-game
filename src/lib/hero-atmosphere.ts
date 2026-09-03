const PARTICLE_AREA = 14_000;
const DESKTOP_MIN_PARTICLES = 54;
const DESKTOP_MAX_PARTICLES = 96;
const TOUCH_MIN_PARTICLES = 20;
const TOUCH_MAX_PARTICLES = 42;
const ACCENT_PARTICLE_RATIO = 0.12;
const PARTICLE_MIN_SIZE = 12;
const PARTICLE_MAX_SIZE = 28;
const PARTICLE_LINE_WIDTH = 1;
const NEUTRAL_OPACITY_MIN = 0.18;
const NEUTRAL_OPACITY_MAX = 0.34;
const ACCENT_OPACITY_MIN = 0.3;
const ACCENT_OPACITY_MAX = 0.55;
const DRIFT_AMPLITUDE_MIN = 8;
const DRIFT_AMPLITUDE_MAX = 18;
const DRIFT_SPEED_MIN = 0.12;
const DRIFT_SPEED_MAX = 0.3;
const REPULSION_RADIUS = 150;
const REPULSION_MAX_OFFSET = 14;
const RETURN_RATE = 7;
const MAX_DPR = 1.75;
const MAX_PARALLAX = 6;

type ParticleShape = "triangle" | "square" | "sphere";

const PARTICLE_SHAPES: ParticleShape[] = ["triangle", "square", "sphere"];

interface Particle {
  anchorX: number;
  anchorY: number;
  originX: number;
  originY: number;
  x: number;
  y: number;
  shape: ParticleShape;
  rotationCos: number;
  rotationSin: number;
  size: number;
  opacity: number;
  accent: boolean;
  driftX: number;
  driftY: number;
  driftSpeed: number;
  phaseX: number;
  phaseY: number;
}

interface PointerPosition {
  active: boolean;
  x: number;
  y: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function randomBetween(minimum: number, maximum: number): number {
  return minimum + Math.random() * (maximum - minimum);
}

function randomShape(): ParticleShape {
  return PARTICLE_SHAPES[Math.floor(Math.random() * PARTICLE_SHAPES.length)] ?? "square";
}

function particleCount(width: number, height: number, precisePointer: boolean): number {
  const desired = Math.round((width * height) / PARTICLE_AREA);
  const minimum = precisePointer ? DESKTOP_MIN_PARTICLES : TOUCH_MIN_PARTICLES;
  const maximum = precisePointer ? DESKTOP_MAX_PARTICLES : TOUCH_MAX_PARTICLES;
  return clamp(desired, minimum, maximum);
}

function readColor(styles: CSSStyleDeclaration, property: string, fallback: string): string {
  const value = styles.getPropertyValue(property).trim();
  return value && !value.startsWith("var(") ? value : fallback;
}

function addMediaQueryListener(
  query: MediaQueryList,
  listener: (event: MediaQueryListEvent) => void,
): void {
  query.addEventListener("change", listener);
}

function removeMediaQueryListener(
  query: MediaQueryList,
  listener: (event: MediaQueryListEvent) => void,
): void {
  query.removeEventListener("change", listener);
}

export function mountHeroAtmosphere(
  hero: HTMLElement,
  canvas: HTMLCanvasElement,
  roundNumber: HTMLElement,
): () => void {
  if (canvas.dataset.heroAtmosphereMounted === "true") return () => {};

  canvas.dataset.heroAtmosphereMounted = "true";
  const context = canvas.getContext("2d");

  if (!context) {
    canvas.hidden = true;
    return () => {
      delete canvas.dataset.heroAtmosphereMounted;
    };
  }

  const drawingContext: CanvasRenderingContext2D = context;

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const precisePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  const particles: Particle[] = [];
  const pointer: PointerPosition = { active: false, x: 0, y: 0 };

  let width = 0;
  let height = 0;
  let dpr = 1;
  let accentColor = "";
  let neutralColor = "";
  let prefersReducedMotion = reducedMotionQuery.matches;
  let precisePointer = precisePointerQuery.matches;
  let isVisible = true;
  let isPageVisible = document.visibilityState === "visible";
  let animationFrame: number | null = null;
  let lastTimestamp = 0;
  let destroyed = false;

  function resetParallax(): void {
    roundNumber.style.removeProperty("--hero-parallax-x");
    roundNumber.style.removeProperty("--hero-parallax-y");
  }

  function resetParticles(): void {
    for (const particle of particles) {
      particle.x = particle.originX;
      particle.y = particle.originY;
    }
  }

  function updateColors(): void {
    const styles = getComputedStyle(hero);
    accentColor = readColor(styles, "--round-accent", readColor(styles, "--jam-accent", styles.color));
    neutralColor = readColor(styles, "--jam-ink", styles.color);
  }

  function createParticle(): Particle {
    const accent = Math.random() < ACCENT_PARTICLE_RATIO;
    const rotation = randomBetween(0, Math.PI * 2);
    const driftDirection = randomBetween(0, Math.PI * 2);
    const driftAmplitude = randomBetween(DRIFT_AMPLITUDE_MIN, DRIFT_AMPLITUDE_MAX);

    return {
      anchorX: Math.random(),
      anchorY: Math.random(),
      originX: 0,
      originY: 0,
      x: 0,
      y: 0,
      shape: randomShape(),
      rotationCos: Math.cos(rotation),
      rotationSin: Math.sin(rotation),
      size: randomBetween(PARTICLE_MIN_SIZE, PARTICLE_MAX_SIZE),
      opacity: accent
        ? randomBetween(ACCENT_OPACITY_MIN, ACCENT_OPACITY_MAX)
        : randomBetween(NEUTRAL_OPACITY_MIN, NEUTRAL_OPACITY_MAX),
      accent,
      driftX: Math.cos(driftDirection) * driftAmplitude,
      driftY: Math.sin(driftDirection) * driftAmplitude,
      driftSpeed: randomBetween(DRIFT_SPEED_MIN, DRIFT_SPEED_MAX),
      phaseX: randomBetween(0, Math.PI * 2),
      phaseY: randomBetween(0, Math.PI * 2),
    };
  }

  function resizeParticles(): void {
    const count = particleCount(width, height, precisePointer);
    particles.length = count;

    for (let index = 0; index < count; index += 1) {
      const particle = particles[index] ?? createParticle();
      particle.originX = particle.anchorX * width;
      particle.originY = particle.anchorY * height;
      particle.x = particle.originX;
      particle.y = particle.originY;
      particles[index] = particle;
    }
  }

  function resizeCanvas(nextWidth: number, nextHeight: number): void {
    if (nextWidth <= 0 || nextHeight <= 0) return;

    width = nextWidth;
    height = nextHeight;
    dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    drawingContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    updateColors();
    resizeParticles();
    resetParticles();
    drawParticles();
  }

  function resizeToHero(): void {
    const bounds = hero.getBoundingClientRect();
    resizeCanvas(bounds.width, bounds.height);
  }

  function updateParallax(clientX: number, clientY: number): void {
    const bounds = hero.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const normalizedX = clamp((clientX - centerX) / Math.max(bounds.width / 2, 1), -1, 1);
    const normalizedY = clamp((clientY - centerY) / Math.max(bounds.height / 2, 1), -1, 1);
    roundNumber.style.setProperty("--hero-parallax-x", `${-normalizedX * MAX_PARALLAX}px`);
    roundNumber.style.setProperty("--hero-parallax-y", `${-normalizedY * MAX_PARALLAX}px`);
  }

  function handlePointerMove(event: PointerEvent): void {
    if (!precisePointer || prefersReducedMotion || event.pointerType === "touch") return;

    const bounds = hero.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
    pointer.active = true;
    updateParallax(event.clientX, event.clientY);
  }

  function resetPointer(): void {
    pointer.active = false;
    resetParallax();
  }

  function updateParticles(timestamp: number, deltaSeconds: number): void {
    const returnAmount = 1 - Math.exp(-RETURN_RATE * deltaSeconds);
    const radiusSquared = REPULSION_RADIUS * REPULSION_RADIUS;

    for (const particle of particles) {
      let targetX = particle.originX + Math.sin(timestamp * particle.driftSpeed + particle.phaseX) * particle.driftX;
      let targetY = particle.originY + Math.cos(timestamp * particle.driftSpeed * 0.83 + particle.phaseY) * particle.driftY;

      if (pointer.active) {
        let distanceX = particle.x - pointer.x;
        let distanceY = particle.y - pointer.y;
        let distanceSquared = distanceX * distanceX + distanceY * distanceY;

        if (distanceSquared < radiusSquared) {
          if (distanceSquared < 0.001) {
            distanceX = Math.cos(particle.phaseX);
            distanceY = Math.sin(particle.phaseY);
            distanceSquared = 1;
          }

          const distance = Math.sqrt(distanceSquared);
          const falloff = 1 - distance / REPULSION_RADIUS;
          const offset = falloff * falloff * REPULSION_MAX_OFFSET;
          targetX += (distanceX / distance) * offset;
          targetY += (distanceY / distance) * offset;
        }
      }

      particle.x += (targetX - particle.x) * returnAmount;
      particle.y += (targetY - particle.y) * returnAmount;
    }
  }

  function drawParticle(particle: Particle): void {
    const halfSize = particle.size / 2;
    const { rotationCos, rotationSin } = particle;

    if (particle.shape === "triangle") {
      drawingContext.beginPath();
      drawingContext.moveTo(
        particle.x + halfSize * rotationSin,
        particle.y - halfSize * rotationCos,
      );
      drawingContext.lineTo(
        particle.x + halfSize * (rotationCos - rotationSin),
        particle.y + halfSize * (rotationSin + rotationCos),
      );
      drawingContext.lineTo(
        particle.x - halfSize * (rotationCos + rotationSin),
        particle.y + halfSize * (rotationCos - rotationSin),
      );
      drawingContext.closePath();
      drawingContext.stroke();
      return;
    }

    if (particle.shape === "sphere") {
      drawingContext.beginPath();
      drawingContext.arc(particle.x, particle.y, halfSize, 0, Math.PI * 2);
      drawingContext.stroke();
      return;
    }

    drawingContext.beginPath();
    drawingContext.moveTo(
      particle.x + halfSize * (rotationSin - rotationCos),
      particle.y - halfSize * (rotationSin + rotationCos),
    );
    drawingContext.lineTo(
      particle.x + halfSize * (rotationCos + rotationSin),
      particle.y + halfSize * (rotationSin - rotationCos),
    );
    drawingContext.lineTo(
      particle.x + halfSize * (rotationCos - rotationSin),
      particle.y + halfSize * (rotationSin + rotationCos),
    );
    drawingContext.lineTo(
      particle.x - halfSize * (rotationCos + rotationSin),
      particle.y + halfSize * (rotationCos - rotationSin),
    );
    drawingContext.closePath();
    drawingContext.stroke();
  }

  function drawParticles(): void {
    if (width <= 0 || height <= 0) return;

    drawingContext.clearRect(0, 0, width, height);
    drawingContext.lineWidth = PARTICLE_LINE_WIDTH;
    drawingContext.strokeStyle = neutralColor;

    for (const particle of particles) {
      if (!particle.accent) {
        drawingContext.globalAlpha = particle.opacity;
        drawParticle(particle);
      }
    }

    drawingContext.strokeStyle = accentColor;

    for (const particle of particles) {
      if (particle.accent) {
        drawingContext.globalAlpha = particle.opacity;
        drawParticle(particle);
      }
    }

    drawingContext.globalAlpha = 1;
  }

  function shouldAnimate(): boolean {
    return !destroyed && !prefersReducedMotion && isVisible && isPageVisible;
  }

  function render(timestamp: number): void {
    animationFrame = null;
    if (!shouldAnimate()) return;

    const deltaSeconds = lastTimestamp === 0
      ? 0
      : Math.min((timestamp - lastTimestamp) / 1000, 0.05);
    lastTimestamp = timestamp;
    updateParticles(timestamp / 1000, deltaSeconds);
    drawParticles();
    animationFrame = window.requestAnimationFrame(render);
  }

  function updateLoopState(): void {
    if (shouldAnimate()) {
      if (animationFrame === null) {
        lastTimestamp = 0;
        animationFrame = window.requestAnimationFrame(render);
      }
      return;
    }

    if (animationFrame !== null) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    lastTimestamp = 0;
    resetPointer();

    if (prefersReducedMotion) {
      resetParticles();
      drawParticles();
    }
  }

  function handleVisibilityChange(): void {
    isPageVisible = document.visibilityState === "visible";
    updateLoopState();
  }

  function handleReducedMotionChange(event: MediaQueryListEvent): void {
    prefersReducedMotion = event.matches;
    if (prefersReducedMotion) resetParticles();
    drawParticles();
    updateLoopState();
  }

  function handlePrecisePointerChange(event: MediaQueryListEvent): void {
    precisePointer = event.matches;
    if (!precisePointer) resetPointer();
    resizeParticles();
    drawParticles();
    updateLoopState();
  }

  const resizeObserver = typeof ResizeObserver === "undefined"
    ? null
    : new ResizeObserver(() => resizeToHero());
  const intersectionObserver = typeof IntersectionObserver === "undefined"
    ? null
    : new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        isVisible = entry.isIntersecting;
        updateLoopState();
      }, { threshold: 0 });

  hero.addEventListener("pointermove", handlePointerMove);
  hero.addEventListener("pointerleave", resetPointer);
  hero.addEventListener("pointercancel", resetPointer);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  addMediaQueryListener(reducedMotionQuery, handleReducedMotionChange);
  addMediaQueryListener(precisePointerQuery, handlePrecisePointerChange);

  if (resizeObserver) {
    resizeObserver.observe(hero);
  } else {
    window.addEventListener("resize", resizeToHero);
  }

  if (intersectionObserver) intersectionObserver.observe(hero);
  resizeToHero();
  updateLoopState();

  return () => {
    if (destroyed) return;
    destroyed = true;
    if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    hero.removeEventListener("pointermove", handlePointerMove);
    hero.removeEventListener("pointerleave", resetPointer);
    hero.removeEventListener("pointercancel", resetPointer);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    removeMediaQueryListener(reducedMotionQuery, handleReducedMotionChange);
    removeMediaQueryListener(precisePointerQuery, handlePrecisePointerChange);
    if (!resizeObserver) window.removeEventListener("resize", resizeToHero);
    resetParallax();
    delete canvas.dataset.heroAtmosphereMounted;
  };
}

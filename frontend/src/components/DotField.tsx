import { useRef, useEffect } from 'react';

/**
 * DotField — an interactive grid of dots that react to the cursor.
 * Dots near the pointer brighten, grow, shift toward the accent colours, and
 * get gently pushed away. Rendered on a single <canvas>.
 *
 * Performance: the animation loop only runs while the cursor is moving (plus a
 * short tail). When idle it draws a single static frame and stops, so it never
 * burns CPU/GPU in the background — keeping the rest of the UI smooth.
 */
export default function DotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const spacing = 34;
    const radius = 150;
    const mouse = { x: -9999, y: -9999 };
    let width = 0;
    let height = 0;
    let raf = 0;
    let running = false;
    let lastMove = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawOnce();
    };

    const drawOnce = () => {
      ctx.clearRect(0, 0, width, height);
      for (let x = spacing / 2; x < width; x += spacing) {
        for (let y = spacing / 2; y < height; y += spacing) {
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const dist = Math.hypot(dx, dy) || 0.0001;

          let px = x;
          let py = y;
          let r = 1;
          let alpha = 0.14;
          let colour = '148,163,184';

          if (dist < radius) {
            const t = 1 - dist / radius;
            const push = t * 10;
            px = x + (dx / dist) * push;
            py = y + (dy / dist) * push;
            r = 1 + t * 2.4;
            alpha = 0.14 + t * 0.65;
            colour = t > 0.55 ? '34,211,238' : '129,140,248';
          }

          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${colour},${alpha})`;
          ctx.fill();
        }
      }
    };

    const loop = () => {
      drawOnce();
      // keep animating for a short tail after the last movement, then idle
      if (performance.now() - lastMove < 450) {
        raf = requestAnimationFrame(loop);
      } else {
        running = false;
      }
    };

    const start = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      lastMove = performance.now();
      start();
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
      lastMove = performance.now();
      start();
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseout', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseout', onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="dot-field" aria-hidden="true" />;
}

import { useEffect, useRef } from 'react';

const UX_SCIENCE_NODES = [
  '[UX AI]', '[Fitts\' Law]', '[WCAG 2.1]', '[Eye-Tracking]', 
  '[Nielsen #1]', '[Hick\'s Law]', '[AI Vision]', '[CRO 99%]', 
  '[Visual Hierarchy]', '[Nielsen #4]', '[Gestalt]', '[Typography]',
  'λ_01', '0101', '∫_UX', '98.4%', '[Contrast AAA]'
];

export default function ParticleCanvas() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let textNodes = [];
    const PARTICLE_COUNT = 70;
    const TEXT_COUNT = 14;
    const CONNECTION_DIST = 140;
    const MOUSE_RADIUS = 180;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.offsetWidth;
        this.y = Math.random() * canvas.offsetHeight;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
        this.radius = Math.random() * 2.5 + 1;
        this.baseAlpha = Math.random() * 0.5 + 0.3;
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.02 + Math.random() * 0.03;
      }
      update() {
        this.pulse += this.pulseSpeed;
        const dx = this.x - mouseRef.current.x;
        const dy = this.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS * 0.03;
          this.vx += (dx / dist) * force;
          this.vy += (dy / dist) * force;
        }
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        if (this.x < 0) this.x = w;
        if (this.x > w) this.x = 0;
        if (this.y < 0) this.y = h;
        if (this.y > h) this.y = 0;
      }
      draw() {
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        const alpha = this.baseAlpha + Math.sin(this.pulse) * 0.2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(0, 240, 255, ${Math.max(0.1, alpha)})`
          : `rgba(99, 102, 241, ${Math.max(0.2, alpha)})`;
        ctx.fill();

        // Node aura pulse
        if (Math.sin(this.pulse) > 0.8) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2);
          ctx.strokeStyle = isDark ? `rgba(139, 92, 246, 0.3)` : `rgba(168, 85, 247, 0.3)`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    class TextNode {
      constructor(label) {
        this.label = label;
        this.x = Math.random() * canvas.offsetWidth;
        this.y = Math.random() * canvas.offsetHeight;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.alpha = Math.random() * 0.4 + 0.25;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        if (this.x < -100) this.x = w + 50;
        if (this.x > w + 100) this.x = -50;
        if (this.y < -50) this.y = h + 50;
        if (this.y > h + 50) this.y = -50;
      }
      draw() {
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        ctx.font = '10px "Space Grotesk", monospace';
        ctx.fillStyle = isDark
          ? `rgba(0, 240, 255, ${this.alpha})`
          : `rgba(79, 70, 229, ${this.alpha})`;
        ctx.fillText(this.label, this.x, this.y);
      }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());
    for (let i = 0; i < TEXT_COUNT; i++) {
      const label = UX_SCIENCE_NODES[i % UX_SCIENCE_NODES.length];
      textNodes.push(new TextNode(label));
    }

    let radarAngle = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

      // Laser network connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * (isDark ? 0.18 : 0.25);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = isDark ? `rgba(0, 240, 255, ${alpha})` : `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Floating UX science text labels
      textNodes.forEach(tn => { tn.update(); tn.draw(); });
      particles.forEach(p => { p.update(); p.draw(); });

      // Interactive Eye-Tracking Radar Arc at cursor position
      if (mouseRef.current.active && mouseRef.current.x > 0) {
        radarAngle += 0.04;
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;

        // Concentric eye-tracking target rings
        ctx.beginPath();
        ctx.arc(mx, my, 40, 0, Math.PI * 2);
        ctx.strokeStyle = isDark ? 'rgba(0, 240, 255, 0.25)' : 'rgba(99, 102, 241, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(mx, my, 75, radarAngle, radarAngle + Math.PI * 0.6);
        ctx.strokeStyle = isDark ? 'rgba(139, 92, 246, 0.4)' : 'rgba(168, 85, 247, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Target label
        ctx.font = '9px "Space Grotesk", sans-serif';
        ctx.fillStyle = isDark ? 'rgba(0, 240, 255, 0.7)' : 'rgba(99, 102, 241, 0.8)';
        ctx.fillText('AI EYE-TRACKING RADAR', mx + 15, my - 15);
      }

      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true };
    };
    const handleLeave = () => { mouseRef.current.active = false; };

    canvas.addEventListener('mousemove', handleMouse);
    canvas.addEventListener('mouseleave', handleLeave);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouse);
      canvas.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        zIndex: 0,
      }}
    />
  );
}

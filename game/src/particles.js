// Particles, floating combat text and screen shake. Everything here is
// cosmetic: the simulation never reads it, so it can never change a run.

export class Particles {
  constructor() {
    this.list = [];
    this.texts = [];
    this.trauma = 0;
  }

  burst(x, y, color, count = 14, speed = 220, life = 0.6, size = 4) {
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.3 + Math.random() * 0.7);
      this.list.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: life * (0.6 + Math.random() * 0.6),
        maxLife: life,
        size: size * (0.6 + Math.random() * 0.8),
        color,
      });
    }
  }

  ring(x, y, color, count = 26, speed = 320) {
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2;
      this.list.push({
        x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 0.5,
        maxLife: 0.5,
        size: 5,
        color,
      });
    }
  }

  trail(x, y, color) {
    this.list.push({
      x, y,
      vx: (Math.random() - 0.5) * 30,
      vy: (Math.random() - 0.5) * 30,
      life: 0.35,
      maxLife: 0.35,
      size: 3,
      color,
    });
  }

  floatText(x, y, text, color = '#ffd76a', size = 18) {
    this.texts.push({ x, y, text, color, size, life: 0.9, maxLife: 0.9 });
  }

  addShake(amount) {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  shakeOffset() {
    const s = this.trauma * this.trauma * 14;
    return {
      x: (Math.random() * 2 - 1) * s,
      y: (Math.random() * 2 - 1) * s,
    };
  }

  update(dt) {
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
    for (let i = this.list.length - 1; i >= 0; i -= 1) {
      const p = this.list[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.list.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
    }
    for (let i = this.texts.length - 1; i >= 0; i -= 1) {
      const t = this.texts[i];
      t.life -= dt;
      t.y -= 42 * dt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }
  }

  draw(ctx) {
    for (const p of this.list) {
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * a + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const t of this.texts) {
      const a = Math.max(0, t.life / t.maxLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = t.color;
      ctx.font = `bold ${t.size}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}

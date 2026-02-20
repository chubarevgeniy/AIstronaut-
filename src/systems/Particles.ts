export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
}

export class ParticleSystem {
    particles: Particle[] = [];

    emit(x: number, y: number, count: number, speed: number, direction: number, spread: number, color: string, life: number) {
        for (let i = 0; i < count; i++) {
            const angle = direction + (Math.random() - 0.5) * spread;
            const velocity = speed * (0.5 + Math.random() * 0.5);

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                life: life * (0.8 + Math.random() * 0.4),
                maxLife: life, // Store original life if needed for fading
                color,
                size: Math.random() * 3 + 1
            });
        }
    }

    update(deltaTime: number) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
}

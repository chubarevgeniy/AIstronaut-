import { Ship } from '../entities/Ship';
import { Planet, PlanetType } from '../entities/Planet';
import { FuelItem } from '../entities/FuelItem';
import type { Particle } from './Particles';

interface Star {
    x: number;
    y: number;
    size: number;
    alpha: number;
}

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private width: number;
    private height: number;
    private stars: Star[] = [];
    private fuelFlashTimer: number = 0;

    constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.generateStars();
    }

    resize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.generateStars();
    }

    private generateStars() {
        this.stars = [];
        for (let i = 0; i < 200; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 0.5,
                alpha: Math.random() * 0.8 + 0.2
            });
        }
    }

    render(ship: Ship, planets: Planet[], items: FuelItem[], particles: Particle[]) {
        // Clear screen
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Camera Logic
        // We want ship to be at (width/2, height * 0.75)
        const camX = ship.x - this.width / 2;
        const camY = ship.y - this.height * 0.75;

        // Draw Stars (Screen Space Parallax)
        this.drawStars(camX, camY);

        this.ctx.save();
        this.ctx.translate(-camX, -camY);

        // Draw Planets
        for (const planet of planets) {
            this.drawPlanet(planet);
        }

        // Draw Items
        for (const item of items) {
            if (!item.collected) {
                this.drawItem(item);
            }
        }

        // Draw Particles
        for (const p of particles) {
            this.ctx.globalAlpha = p.life / p.maxLife; // Fade out
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        this.ctx.globalAlpha = 1.0;

        // Draw Ship
        this.drawShip(ship);

        // Draw Nearest Planet Indicator
        this.drawNearestPlanetIndicator(ship, planets, items);

        this.ctx.restore();

        // Draw HUD
        this.drawHUD(ship);
    }

    triggerFuelFlash() {
        this.fuelFlashTimer = 1.0;
    }

    private drawNearestPlanetIndicator(ship: Ship, planets: Planet[], items: FuelItem[]) {
        let nearest: { x: number, y: number, radius: number, isFuel: boolean } | null = null;
        let minSurfaceDist = Infinity;

        // Check Planets
        for (const p of planets) {
            const dx = p.x - ship.x;
            const dy = p.y - ship.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const surfaceDist = dist - p.radius;

            if (surfaceDist < minSurfaceDist) {
                minSurfaceDist = surfaceDist;
                nearest = { x: p.x, y: p.y, radius: p.radius, isFuel: false };
            }
        }

        // Check Items
        for (const item of items) {
             if (item.collected) continue;
             const dx = item.x - ship.x;
             const dy = item.y - ship.y;
             const dist = Math.sqrt(dx * dx + dy * dy);
             const surfaceDist = dist - item.radius;

             if (surfaceDist < minSurfaceDist) {
                 minSurfaceDist = surfaceDist;
                 nearest = { x: item.x, y: item.y, radius: item.radius, isFuel: true };
             }
        }

        if (nearest) {
            const dx = nearest.x - ship.x;
            const dy = nearest.y - ship.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (minSurfaceDist > 10 && minSurfaceDist < 2000) {
                const indicatorDist = 40; // Distance from ship center
                const ix = (dx / dist) * indicatorDist;
                const iy = (dy / dist) * indicatorDist;

                this.ctx.save();
                this.ctx.translate(ship.x + ix, ship.y + iy);
                this.ctx.fillStyle = nearest.isFuel ? '#00FF00' : 'red';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }
        }
    }

    private drawStars(camX: number, camY: number) {
        this.ctx.fillStyle = '#FFFFFF';
        for (const star of this.stars) {
            // Parallax factor (0.1 = slow movement)
            // Calculate screen position with wrap-around
            // Note: camY is negative as we go up.

            let sx = (star.x - camX * 0.05) % this.width;
            let sy = (star.y - camY * 0.05) % this.height;

            if (sx < 0) sx += this.width;
            if (sy < 0) sy += this.height;

            this.ctx.globalAlpha = star.alpha;
            this.ctx.fillRect(sx, sy, star.size, star.size);
        }
        this.ctx.globalAlpha = 1.0;
    }

    private drawItem(item: FuelItem) {
        this.ctx.save();
        this.ctx.translate(item.x, item.y);

        // Green glow
        const time = Date.now() / 200;
        this.ctx.fillStyle = `rgba(0, 255, 0, 0.3)`;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, item.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Crashed Ship Model (Jagged)
        this.ctx.fillStyle = '#999999';
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;

        this.ctx.beginPath();
        this.ctx.moveTo(0, -20);   // Nose
        this.ctx.lineTo(-10, -5);  // Left crack
        this.ctx.lineTo(-15, 10);  // Left Wing tip
        this.ctx.lineTo(-5, 5);    // Broken part
        this.ctx.lineTo(5, 15);    // Right debris
        this.ctx.lineTo(15, 10);   // Right Wing tip
        this.ctx.lineTo(10, -5);    // Right crack
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.restore();
    }

    private drawPlanet(planet: Planet) {
        // Draw Gravity Radius (Skip for Asteroids)
        if (planet.type !== PlanetType.Asteroid) {
            this.ctx.beginPath();
            this.ctx.setLineDash([5, 5]);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.arc(planet.x, planet.y, planet.gravityRadius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        // Star Danger Zone
        if (planet.type === PlanetType.Star) {
            this.ctx.beginPath();
            this.ctx.setLineDash([10, 5]);
            this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)'; // Red Dashed
            this.ctx.lineWidth = 2;
            this.ctx.arc(planet.x, planet.y, planet.gravityRadius / 3, 0, Math.PI * 2); // 1/3 of gravity field
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        if (planet.type === PlanetType.BlackHole) {
            // Accretion Disk (Outer Glow)
            const gradient = this.ctx.createRadialGradient(planet.x, planet.y, planet.radius, planet.x, planet.y, planet.radius * 2.5);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(100, 100, 255, 0.2)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(planet.x, planet.y, planet.radius * 2.5, 0, Math.PI * 2);
            this.ctx.fill();

            // Event Horizon
            this.ctx.fillStyle = '#000000';
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            return;
        }

        if (planet.type === PlanetType.Asteroid) {
            this.ctx.fillStyle = planet.color;
            this.ctx.beginPath();
            // Draw irregular shape or just circle for now. Keeping it simple.
            this.ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Texture/Details
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(planet.x + planet.radius * 0.3, planet.y + planet.radius * 0.3, planet.radius * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
            return;
        }

        this.ctx.fillStyle = planet.color;
        this.ctx.beginPath();
        this.ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Add a simple highlight or crater effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.beginPath();
        this.ctx.arc(planet.x - planet.radius * 0.2, planet.y - planet.radius * 0.2, planet.radius * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    private drawShip(ship: Ship) {
        this.ctx.save();
        this.ctx.translate(ship.x, ship.y);
        this.ctx.rotate(ship.rotation);

        // Simple triangle ship
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.moveTo(10, 0); // Nose
        this.ctx.lineTo(-10, 7);
        this.ctx.lineTo(-5, 0); // Engine indent
        this.ctx.lineTo(-10, -7);
        this.ctx.closePath();
        this.ctx.fill();

        // Thrust flame
        if (ship.isThrusting && ship.fuel > 0) {
            this.ctx.fillStyle = '#FFA500';
            this.ctx.beginPath();
            this.ctx.moveTo(-5, 0);
            this.ctx.lineTo(-15, 5);
            this.ctx.lineTo(-25 + Math.random() * 10, 0); // Dynamic flame
            this.ctx.lineTo(-15, -5);
            this.ctx.closePath();
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    private drawHUD(ship: Ship) {
        this.ctx.save();
        this.ctx.font = '12px "JetBrains Mono", monospace';

        // Altitude
        const altitude = Math.floor(-ship.y / 100);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(`ALT: ${altitude.toString().padStart(6, '0')} LY`, 10, 60);

        // Fuel
        if (ship.maxFuel !== Infinity) {
            this.ctx.fillText(`FUEL`, 10, 80);

            // Update Flash Timer (Assuming 60fps roughly for visual decay)
            if (this.fuelFlashTimer > 0) {
                this.fuelFlashTimer -= 0.1;
            }

            // Dotted Fuel Bar
            const barX = 50;
            const barY = 72;
            const totalDots = 20;
            const dotSize = 3;
            const dotGap = 2;

            const fuelPercent = Math.max(0, ship.fuel / ship.maxFuel);
            const activeDots = Math.floor(fuelPercent * totalDots);

            for (let i = 0; i < totalDots; i++) {
                if (i < activeDots) {
                    // Logic: Green Flash > Orange Thrust > Red Low Fuel > White Normal
                    if (this.fuelFlashTimer > 0) {
                         this.ctx.fillStyle = '#00FF00'; // Green Flash
                    } else if (ship.isThrusting) {
                         this.ctx.fillStyle = '#FFA500'; // Orange Burn
                    } else {
                         this.ctx.fillStyle = fuelPercent > 0.2 ? '#ffffff' : '#ff0000';
                    }
                } else {
                    this.ctx.fillStyle = '#333333';
                }
                this.ctx.fillRect(barX + i * (dotSize + dotGap), barY, dotSize, dotSize);
            }
        } else {
             this.ctx.fillStyle = '#666';
             this.ctx.fillText(`FUEL: ∞`, 10, 80);
        }

        this.ctx.restore();
    }
}

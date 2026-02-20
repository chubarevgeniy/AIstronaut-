import { Ship } from '../entities/Ship';
import { Planet } from '../entities/Planet';

export class PhysicsSystem {
    private G: number = 500; // Reduced gravity
    private thrustPower: number = 300; // Adjusted thrust

    update(ship: Ship, planets: Planet[], deltaTime: number): boolean {
        // Calculate gravity from planets
        let gx = 0;
        let gy = 0;
        let hasCollided = false;

        for (const planet of planets) {
            const dx = planet.x - ship.x;
            const dy = planet.y - ship.y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq);

            // Collision detection
            if (dist < planet.radius + 10) { // Simple circle collision, +10 for ship size approx
                hasCollided = true;
            }

            // Simple gravity logic: pull towards center
            // Avoid applying massive forces when very close (inside planet)
            if (dist > 10) {
                const force = (this.G * planet.mass) / distSq;
                gx += force * (dx / dist);
                gy += force * (dy / dist);
            }
        }

        if (hasCollided) {
            // Stop ship or mark as dead
            ship.vx = 0;
            ship.vy = 0;
            return true; // Return collision status
        }

        ship.vx += gx * deltaTime;
        ship.vy += gy * deltaTime;

        // Thrust application
        if (ship.isThrusting && ship.fuel > 0) {
            ship.vx += Math.cos(ship.rotation) * this.thrustPower * deltaTime;
            ship.vy += Math.sin(ship.rotation) * this.thrustPower * deltaTime;
            ship.fuel -= 10 * deltaTime;
        }

        // Update position
        ship.x += ship.vx * deltaTime;
        ship.y += ship.vy * deltaTime;

        // Update rotation based on velocity vector
        const speedSq = ship.vx * ship.vx + ship.vy * ship.vy;
        if (speedSq > 1) {
            ship.rotation = Math.atan2(ship.vy, ship.vx);
        }

        return false;
    }
}

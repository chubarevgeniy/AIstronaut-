import { Ship } from '../entities/Ship';
import { Planet } from '../entities/Planet';
import { GameConfig } from '../engine/GameConfig';

export class PhysicsSystem {

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
            if (dist < planet.radius + GameConfig.shipCollisionRadius) { // Simple circle collision
                hasCollided = true;
            }

            // Simple gravity logic: pull towards center
            // Avoid applying massive forces when very close (inside planet)
            // Also respect gravity radius
            if (dist > 10 && dist < planet.gravityRadius) {
                const force = (GameConfig.gravityConstant * planet.mass) / distSq;
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
            // Find nearest planet for repulsion
            let nearestPlanet: Planet | null = null;
            let minDistSq = Infinity;
            let minSurfaceDist = Infinity;

            for (const planet of planets) {
                const dx = ship.x - planet.x;
                const dy = ship.y - planet.y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq);
                const surfaceDist = dist - planet.radius;

                if (surfaceDist < minSurfaceDist) {
                    minSurfaceDist = surfaceDist;
                    nearestPlanet = planet;
                    minDistSq = distSq;
                }
            }

            // Repulsive force logic (Arcade style)
            // Push away from the nearest planet instead of forward acceleration
            if (nearestPlanet && minDistSq < 4000000) { // 2000px range
                const dx = ship.x - nearestPlanet.x;
                const dy = ship.y - nearestPlanet.y;
                const dist = Math.sqrt(minDistSq);

                if (dist > 1) {
                    ship.vx += (dx / dist) * GameConfig.thrustPower * deltaTime;
                    ship.vy += (dy / dist) * GameConfig.thrustPower * deltaTime;
                }
            } else {
                // Fallback: standard thrust if in deep space
                ship.vx += Math.cos(ship.rotation) * GameConfig.thrustPower * deltaTime;
                ship.vy += Math.sin(ship.rotation) * GameConfig.thrustPower * deltaTime;
            }

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

import { Ship } from '../entities/Ship';
import { Planet, PlanetType } from '../entities/Planet';
import { FuelItem } from '../entities/FuelItem';
import { GameConfig } from '../engine/GameConfig';

export class PhysicsSystem {

    checkItemCollisions(ship: Ship, items: FuelItem[]): void {
        for (const item of items) {
            if (item.collected) continue;

            const dx = ship.x - item.x;
            const dy = ship.y - item.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Simple collision
            if (dist < item.radius + 10) { // Approx ship radius
                item.collected = true;
                if (ship.maxFuel !== Infinity) {
                    ship.fuel = Math.min(ship.maxFuel, ship.fuel + item.amount);
                }
            }
        }
    }

    update(ship: Ship, planets: Planet[], items: FuelItem[], deltaTime: number): boolean {
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
                let force = (GameConfig.gravityConstant * planet.mass) / distSq;

                if (planet.type === PlanetType.BlackHole) {
                    force *= 3.0; // Stronger gravity

                    // Fuel Regen in orbit
                    if (ship.maxFuel !== Infinity) {
                         ship.fuel = Math.min(ship.maxFuel, ship.fuel + 50 * deltaTime);
                    }
                }

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
            // Find nearest object (Planet or FuelItem) for repulsion/attraction
            let nearestObj: { x: number, y: number, type: 'planet' | 'fuel' } | null = null;
            let minSurfaceDist = Infinity;

            // Check Planets
            for (const planet of planets) {
                const dx = ship.x - planet.x;
                const dy = ship.y - planet.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const surfaceDist = dist - planet.radius;

                if (surfaceDist < minSurfaceDist) {
                    minSurfaceDist = surfaceDist;
                    nearestObj = { x: planet.x, y: planet.y, type: 'planet' };
                }
            }

            // Check Fuel Items
            for (const item of items) {
                if (item.collected) continue;
                const dx = ship.x - item.x;
                const dy = ship.y - item.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const surfaceDist = dist - item.radius;

                if (surfaceDist < minSurfaceDist) {
                    minSurfaceDist = surfaceDist;
                    nearestObj = { x: item.x, y: item.y, type: 'fuel' };
                }
            }

            // Apply Force
            if (nearestObj && minSurfaceDist < 2000) {
                const dx = ship.x - nearestObj.x;
                const dy = ship.y - nearestObj.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 1) {
                    if (nearestObj.type === 'fuel') {
                         // PULL TOWARDS FUEL
                        ship.vx -= (dx / dist) * GameConfig.thrustPower * deltaTime;
                        ship.vy -= (dy / dist) * GameConfig.thrustPower * deltaTime;
                    } else {
                        // PUSH AWAY FROM PLANET
                        ship.vx += (dx / dist) * GameConfig.thrustPower * deltaTime;
                        ship.vy += (dy / dist) * GameConfig.thrustPower * deltaTime;
                    }
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

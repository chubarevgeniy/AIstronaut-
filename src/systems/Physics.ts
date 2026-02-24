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
                ship.addFuel(item.amount);
            }
        }
    }

    update(ship: Ship, planets: Planet[], items: FuelItem[], deltaTime: number): boolean {
        if (ship.thrustCooldown > 0) {
            ship.thrustCooldown -= deltaTime;
            ship.isThrusting = false;
        }

        // Landed Logic
        if (ship.isLanded && ship.landedPlanet) {
            if (ship.isThrusting) {
                // Takeoff
                ship.isLanded = false;
                const angle = ship.landedPlanet.angle;
                ship.vx += Math.cos(angle) * 100;
                ship.vy += Math.sin(angle) * 100;
                ship.landedPlanet = null;
            } else {
                // Stay Landed
                const p = ship.landedPlanet;
                const surfaceDist = p.radius + GameConfig.shipCollisionRadius;
                ship.x = p.x + Math.cos(p.angle) * surfaceDist;
                ship.y = p.y + Math.sin(p.angle) * surfaceDist;
                ship.vx = 0;
                ship.vy = 0;
                return false;
            }
        }

        // Calculate gravity from planets
        let gx = 0;
        let gy = 0;
        let hasCollided = false;

        if (ship.nearMissTimer > 0) {
            ship.nearMissTimer -= deltaTime;
        }

        for (const planet of planets) {
            const dx = planet.x - ship.x;
            const dy = planet.y - ship.y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq);

            // Collision detection
            // Asteroids don't cause Game Over, they are just physical obstacles or background
            if (planet.type !== PlanetType.Asteroid) {
                if (dist < planet.radius + GameConfig.shipCollisionRadius) {
                    const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
                    if (speed < GameConfig.landingMaxSpeed) {
                        // Land
                        ship.isLanded = true;
                        ship.isThrusting = false;
                        ship.thrustCooldown = 1.0;

                        const angle = Math.atan2(ship.y - planet.y, ship.x - planet.x);
                        ship.rotation = angle;
                        ship.addFuel(5);

                        planet.hasFlag = true;
                        planet.flagAngle = angle;

                        ship.landedPlanet = {
                            x: planet.x,
                            y: planet.y,
                            radius: planet.radius,
                            angle: angle
                        };
                        const surfaceDist = planet.radius + GameConfig.shipCollisionRadius;
                        ship.x = planet.x + Math.cos(angle) * surfaceDist;
                        ship.y = planet.y + Math.sin(angle) * surfaceDist;
                        ship.vx = 0;
                        ship.vy = 0;
                    } else {
                        hasCollided = true;
                    }
                }
            }

            // Simple gravity logic
            if (dist > 10 && dist < planet.gravityRadius) {
                // Skip logic for Asteroids completely
                if (planet.type !== PlanetType.Asteroid) {

                    let force = (GameConfig.gravityConstant * planet.mass) / distSq;

                    if (planet.type === PlanetType.BlackHole) {
                        force *= 3.0;
                        ship.addFuel(50 * deltaTime);
                    }

                    // Near Miss Bonus
                    // High speed close pass
                    if (ship.nearMissTimer <= 0) {
                        // Check if close (radius + ship_size + margin) and fast
                        if (dist < planet.radius + GameConfig.nearMissDistance && Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy) > GameConfig.nearMissSpeedThreshold) {
                            ship.addFuel(GameConfig.nearMissFuelReward);
                            ship.nearMissTimer = GameConfig.nearMissCooldown; // Cooldown

                            // @ts-ignore
                            if (GameConfig.debugShowNearMiss === 1 && ship.onNearMiss) {
                                ship.onNearMiss();
                            }
                        }
                    }

                    if (planet.type === PlanetType.Star) {
                        // Star Logic: Red dashed line (Danger Zone)
                        // "Inner 1/3 of gravity field"
                        const dangerRadius = planet.gravityRadius / 3.0;
                        if (dist < dangerRadius) {
                            if (ship.maxFuel !== Infinity) {
                                ship.fuel -= (GameConfig.starFuelBurnRate || 20) * deltaTime;
                            }
                        }
                    }

                    gx += force * (dx / dist);
                    gy += force * (dy / dist);
                }
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

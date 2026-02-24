
import { Planet, PlanetType } from '../entities/Planet';
import { FuelItem } from '../entities/FuelItem';
import { GameConfig } from '../engine/GameConfig';

export class LevelGenerator {
    private visitedChunks: Set<string> = new Set();
    private lastFuelSpawnY: number = 0;
    private spawnInterval: number = GameConfig.fuelSpawnInterval;

    generateItems(shipY: number): FuelItem[] {
        const items: FuelItem[] = [];

        // shipY is negative as we go up.
        if (shipY < this.lastFuelSpawnY - this.spawnInterval) {
            this.lastFuelSpawnY -= this.spawnInterval;

            // 90% chance for at least one
            if (Math.random() < 0.9) {
                const y = this.lastFuelSpawnY - Math.random() * 1000;
                const x = (Math.random() - 0.5) * GameConfig.chunkSize * 3; // Wide spread

                items.push(new FuelItem(x, y));

                // 50% chance for a second one
                if (Math.random() < 0.5) {
                    const y2 = this.lastFuelSpawnY - Math.random() * 1000;
                    const x2 = (Math.random() - 0.5) * GameConfig.chunkSize * 3;
                    items.push(new FuelItem(x2, y2));
                }
            }
        }
        return items;
    }

    generate(shipX: number, shipY: number, existingPlanets: Planet[] = []): Planet[] {
        const newPlanets: Planet[] = [];
        const currentChunkX = Math.floor(shipX / GameConfig.chunkSize);
        const currentChunkY = Math.floor(shipY / GameConfig.chunkSize);
        const minGap = 100;

        // Check 3x3 grid around current chunk
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const chunkX = currentChunkX + dx;
                const chunkY = currentChunkY + dy;
                const chunkKey = `${chunkX},${chunkY}`;

                if (!this.visitedChunks.has(chunkKey)) {
                    this.visitedChunks.add(chunkKey);

                    // Generate planets in this chunk
                    const count = GameConfig.minPlanetsPerChunk + Math.floor(Math.random() * (GameConfig.maxPlanetsPerChunk - GameConfig.minPlanetsPerChunk));

                    for (let i = 0; i < count; i++) {
                        let attempts = 0;
                        let valid = false;
                        let x = 0;
                        let y = 0;
                        let radius = 0;

                        while (!valid && attempts < 10) {
                            attempts++;
                            // Position within chunk
                            x = (chunkX * GameConfig.chunkSize) + Math.random() * GameConfig.chunkSize;
                            y = (chunkY * GameConfig.chunkSize) + Math.random() * GameConfig.chunkSize;

                            radius = GameConfig.minPlanetRadius + Math.random() * (GameConfig.maxPlanetRadius - GameConfig.minPlanetRadius);

                            // Check collision with ship start (approx)
                            if (chunkX === 0 && chunkY === 0) {
                                if (Math.abs(x) < 350 && Math.abs(y) < 350) continue;
                            }

                            valid = true;

                            // Check collision with newPlanets
                            for (const p of newPlanets) {
                                const dist = Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2);
                                if (dist < (radius + p.radius + minGap)) {
                                    valid = false;
                                    break;
                                }
                            }
                            if (!valid) continue;

                            // Check collision with existingPlanets
                            for (const p of existingPlanets) {
                                const dist = Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2);
                                if (dist < (radius + p.radius + minGap)) {
                                    valid = false;
                                    break;
                                }
                            }
                        }

                        if (valid) {
                            // Random Type Logic based on depth
                            let type: PlanetType;
                            const types = Object.values(PlanetType) as PlanetType[];

                            // Filter valid types based on depth (y is negative going up)
                            // 50 LY = -5000
                            // 100 LY = -10000
                            // 200 LY = -20000

                            const depth = -y; // Positive distance

                            // Phase 1: 0-50 LY (No Black Holes)
                            let availableTypes = types.filter(t => t !== PlanetType.Asteroid && t !== PlanetType.Star);
                            if (depth < 5000) {
                                availableTypes = availableTypes.filter(t => t !== PlanetType.BlackHole);
                            }

                            // Phase 3: 200 LY+ (Add Stars)
                            if (depth > 20000) {
                                // Small chance for Star
                                if (Math.random() < 0.05) {
                                     type = PlanetType.Star;
                                     radius = GameConfig.maxPlanetRadius; // Stars are big
                                } else {
                                     type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
                                }
                            } else {
                                type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
                            }

                            newPlanets.push(new Planet(x, y, radius, type));
                        }
                    }

                    // Phase 2: 100 LY+ (Add Asteroid Clusters)
                    // Separate pass for asteroids to allow density
                    const asteroidStartDepth = 10000;
                    const chunkDepth = -chunkY * GameConfig.chunkSize;

                    if (chunkDepth > asteroidStartDepth) {
                         if (Math.random() < 0.4) { // 40% chance per chunk to have a cluster
                             const clusterCount = Math.floor(Math.random() * 5) + 3; // 3-8 asteroids
                             const clusterX = (chunkX * GameConfig.chunkSize) + Math.random() * GameConfig.chunkSize;
                             const clusterY = (chunkY * GameConfig.chunkSize) + Math.random() * GameConfig.chunkSize;

                             for(let k=0; k<clusterCount; k++) {
                                 const offX = (Math.random() - 0.5) * 200;
                                 const offY = (Math.random() - 0.5) * 200;
                                 const ax = clusterX + offX;
                                 const ay = clusterY + offY;
                                 const ar = 10 + Math.random() * 10; // Small radius

                                 // Simple collision check against existing planets only (not other asteroids to allow overlap/density)
                                 let aValid = true;
                                 for (const p of newPlanets) {
                                     const dist = Math.sqrt((ax - p.x)**2 + (ay - p.y)**2);
                                     if (dist < p.radius + ar + 50) {
                                         aValid = false; break;
                                     }
                                 }
                                 if (existingPlanets) {
                                      for (const p of existingPlanets) {
                                         const dist = Math.sqrt((ax - p.x)**2 + (ay - p.y)**2);
                                         if (dist < p.radius + ar + 50) {
                                             aValid = false; break;
                                         }
                                     }
                                 }

                                 if (aValid) {
                                     newPlanets.push(new Planet(ax, ay, ar, PlanetType.Asteroid));
                                 }
                             }
                         }
                    }
                }
            }
        }
        return newPlanets;
    }

    // Remove visited chunks that are far away to allow regeneration if returned to
    cleanup(shipX: number, shipY: number, cleanupRadius: number) {
        const currentChunkX = Math.floor(shipX / GameConfig.chunkSize);
        const currentChunkY = Math.floor(shipY / GameConfig.chunkSize);
        const cleanupChunkRadius = Math.ceil(cleanupRadius / GameConfig.chunkSize);

        for (const key of this.visitedChunks) {
            const [cxStr, cyStr] = key.split(',');
            const cx = parseInt(cxStr);
            const cy = parseInt(cyStr);

            // Simple Manhattan or Chebyshev distance check is faster
            if (Math.abs(cx - currentChunkX) > cleanupChunkRadius ||
                Math.abs(cy - currentChunkY) > cleanupChunkRadius) {
                this.visitedChunks.delete(key);
            }
        }
    }

    reset(startY: number = 0) {
        this.visitedChunks.clear();
        this.lastFuelSpawnY = startY;
    }
}

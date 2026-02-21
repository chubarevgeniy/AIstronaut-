
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
                            // Random Type
                            const types = Object.values(PlanetType) as PlanetType[];
                            const type = types[Math.floor(Math.random() * types.length)];

                            newPlanets.push(new Planet(x, y, radius, type));
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

    reset() {
        this.visitedChunks.clear();
        this.lastFuelSpawnY = 0;
    }
}

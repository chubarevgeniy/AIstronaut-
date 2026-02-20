
import { Planet, PlanetType } from '../entities/Planet';
import { GameConfig } from '../engine/GameConfig';

export class LevelGenerator {
    private visitedChunks: Set<string> = new Set();

    generate(shipX: number, shipY: number): Planet[] {
        const newPlanets: Planet[] = [];
        const currentChunkX = Math.floor(shipX / GameConfig.chunkSize);
        const currentChunkY = Math.floor(shipY / GameConfig.chunkSize);

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
                        // Position within chunk
                        const x = (chunkX * GameConfig.chunkSize) + Math.random() * GameConfig.chunkSize;
                        const y = (chunkY * GameConfig.chunkSize) + Math.random() * GameConfig.chunkSize;

                        // Check collision with ship start (approx)
                        if (chunkX === 0 && chunkY === 0) {
                             if (Math.abs(x) < 350 && Math.abs(y) < 350) continue;
                        }

                        const radius = GameConfig.minPlanetRadius + Math.random() * (GameConfig.maxPlanetRadius - GameConfig.minPlanetRadius);

                        // Random Type
                        const types = Object.values(PlanetType) as PlanetType[];
                        const type = types[Math.floor(Math.random() * types.length)];

                        newPlanets.push(new Planet(x, y, radius, type));
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
    }
}

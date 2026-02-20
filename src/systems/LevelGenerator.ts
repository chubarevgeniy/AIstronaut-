
import { Planet, PlanetType } from '../entities/Planet';

export class LevelGenerator {
    private visitedChunks: Set<string> = new Set();
    private chunkSize: number = 600; // Reduced chunk size for denser generation

    generate(shipX: number, shipY: number): Planet[] {
        const newPlanets: Planet[] = [];
        const currentChunkX = Math.floor(shipX / this.chunkSize);
        const currentChunkY = Math.floor(shipY / this.chunkSize);

        // Check 3x3 grid around current chunk
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const chunkX = currentChunkX + dx;
                const chunkY = currentChunkY + dy;
                const chunkKey = `${chunkX},${chunkY}`;

                if (!this.visitedChunks.has(chunkKey)) {
                    this.visitedChunks.add(chunkKey);

                    // Generate planets in this chunk
                    // Increased density: 2 to 5 planets
                    const count = 2 + Math.floor(Math.random() * 4);

                    for (let i = 0; i < count; i++) {
                        // Position within chunk
                        const x = (chunkX * this.chunkSize) + Math.random() * this.chunkSize;
                        const y = (chunkY * this.chunkSize) + Math.random() * this.chunkSize;

                        // Check collision with ship start (approx)
                        if (chunkX === 0 && chunkY === 0) {
                             if (Math.abs(x) < 350 && Math.abs(y) < 350) continue;
                        }

                        // Reduced Radius: 15 to 50 (smaller planets)
                        const radius = 15 + Math.random() * 35;

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
        const currentChunkX = Math.floor(shipX / this.chunkSize);
        const currentChunkY = Math.floor(shipY / this.chunkSize);
        const cleanupChunkRadius = Math.ceil(cleanupRadius / this.chunkSize);

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


import { Planet, PlanetType } from '../entities/Planet';

export class LevelGenerator {
    private visitedChunks: Set<string> = new Set();
    private chunkSize: number = 800; // Chunk size in pixels

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
                    // Limit number of planets per chunk (0 to 2)
                    const count = Math.floor(Math.random() * 3);

                    for (let i = 0; i < count; i++) {
                        // Position within chunk
                        const x = (chunkX * this.chunkSize) + Math.random() * this.chunkSize;
                        const y = (chunkY * this.chunkSize) + Math.random() * this.chunkSize;

                        // Check collision with ship start (approx)
                        // If chunk is (0,0), avoid placing right on top of ship (0,0)
                        // Also avoid placing where the manual starter planet is (180, -100)
                        // Let's clear a larger box around (0,0)
                        if (chunkX === 0 && chunkY === 0) {
                             if (Math.abs(x) < 350 && Math.abs(y) < 350) continue;
                        }

                        // Random Radius: 30 to 120
                        const radius = 30 + Math.random() * 90;

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

    reset() {
        this.visitedChunks.clear();
    }
}

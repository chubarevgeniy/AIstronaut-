import { Planet, PlanetType } from '../entities/Planet';

export class LevelGenerator {
    private lastSpawnY: number = 0;
    private spawnDistance: number = 600; // Distance between potential planet spawns

    generate(currentY: number): Planet[] {
        const newPlanets: Planet[] = [];

        // Ship moves "up" (Y decreases).
        // We want to ensure planets exist ahead of the ship.
        // Let's keep a buffer of planets generated ahead.
        const spawnHorizon = currentY - 2000; // Ensure planets are generated up to 2000 units ahead

        while (this.lastSpawnY > spawnHorizon) {
            this.lastSpawnY -= (this.spawnDistance + Math.random() * 200); // Varied distance

            // Random X position. Assume a playable corridor width of approx 600 (-300 to 300)
            const x = (Math.random() - 0.5) * 600;

            // Random Radius: 30 to 120
            const radius = 30 + Math.random() * 90;

            // Random Type
            const types = Object.values(PlanetType) as PlanetType[];
            const type = types[Math.floor(Math.random() * types.length)];

            newPlanets.push(new Planet(x, this.lastSpawnY, radius, type));
        }

        return newPlanets;
    }

    reset(startY: number) {
        this.lastSpawnY = startY;
    }
}

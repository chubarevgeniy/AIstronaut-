import { GameConfig } from '../engine/GameConfig';

export const PlanetType = {
    Dead: 'dead',
    Ocean: 'ocean',
    Ice: 'ice',
    Desert: 'desert',
    GasGiant: 'gas_giant',
    BlackHole: 'black_hole',
    Asteroid: 'asteroid',
    Star: 'star'
} as const;

export type PlanetType = typeof PlanetType[keyof typeof PlanetType];

export class Planet {
    x: number;
    y: number;
    radius: number;
    mass: number;
    type: PlanetType;
    color: string;
    gravityScale: number;

    get gravityRadius(): number {
        return this.radius * this.gravityScale;
    }

    constructor(x: number, y: number, radius: number, type: PlanetType) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.type = type;
        this.gravityScale = GameConfig.gravityRadiusScale;

        // Mass proportional to area (radius squared)
        // Adjust density based on type if needed
        this.mass = radius * radius * 1;

        switch (type) {
            case PlanetType.Dead:
                this.color = '#888888';
                break;
            case PlanetType.Ocean:
                this.color = '#0000FF';
                break;
            case PlanetType.Ice:
                this.color = '#ADD8E6';
                break;
            case PlanetType.Desert:
                this.color = '#FFA500';
                break;
            case PlanetType.GasGiant:
                this.color = '#FF4500'; // Placeholder
                this.mass *= 2; // Gas giants are heavier
                break;
            case PlanetType.BlackHole:
                this.color = '#000000';
                this.mass *= 4; // Massive
                break;
            case PlanetType.Asteroid:
                this.color = '#666666';
                this.mass = 0; // No gravity
                break;
            case PlanetType.Star:
                this.color = '#FFFFE0'; // Light Yellow
                this.mass *= 4; // Massive like Black Hole
                this.gravityScale = 6.0; // Larger gravity field so 1/3 is > radius
                break;
            default:
                this.color = '#FFFFFF';
        }
    }
}

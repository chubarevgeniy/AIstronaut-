export class Ship {
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    width: number;
    height: number;
    isThrusting: boolean;
    fuel: number;
    maxFuel: number;
    hasEjected: boolean;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.rotation = -Math.PI / 2; // Pointing up
        this.width = 20;
        this.height = 30;
        this.isThrusting = false;
        this.maxFuel = 100;
        this.fuel = this.maxFuel;
        this.hasEjected = false;
    }
}

export class FuelItem {
    x: number;
    y: number;
    radius: number = 30;
    collected: boolean = false;
    amount: number = 50; // Amount of fuel restored

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

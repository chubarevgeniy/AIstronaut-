import { Ship } from '../entities/Ship';
import { PhysicsSystem } from '../systems/Physics';
import { Planet } from '../entities/Planet';
import { LevelGenerator } from '../systems/LevelGenerator';
import { InputHandler } from '../systems/Input';
import { Renderer } from '../systems/Renderer';
import { GameState, GameMode } from './GameState';
import { ParticleSystem } from '../systems/Particles';

export class GameLoop {
    private canvas: HTMLCanvasElement;
    private animationFrameId: number | null = null;
    private isRunning: boolean = false;
    private lastTime: number = 0;

    private ship: Ship;
    private physics: PhysicsSystem;
    private input: InputHandler;
    private levelGenerator: LevelGenerator;
    private renderer: Renderer;
    private particleSystem: ParticleSystem;
    private planets: Planet[] = [];

    private state: GameState = GameState.Start;
    private mode: GameMode = GameMode.Survival;
    public onStateChange: ((state: GameState, score: number) => void) | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error("Could not get canvas context");
        }

        // Initialize systems
        this.input = new InputHandler(canvas);
        this.physics = new PhysicsSystem();
        this.levelGenerator = new LevelGenerator();
        this.particleSystem = new ParticleSystem();

        // Initial setup
        this.ship = new Ship(0, 0);
        this.levelGenerator.reset(this.ship.y - 500);

        this.renderer = new Renderer(context, canvas.width, canvas.height);
    }

    startGame(mode: GameMode) {
        this.mode = mode;
        this.reset();
        this.state = GameState.Playing;
        this.start();
        this.notifyState();
    }

    pause() {
        if (this.state === GameState.Playing) {
            this.state = GameState.Paused;
            this.notifyState();
        }
    }

    resume() {
        if (this.state === GameState.Paused) {
            this.state = GameState.Playing;
            this.lastTime = performance.now(); // Prevent time jump
            this.notifyState();
        }
    }

    reset() {
        this.ship = new Ship(0, 0);
        this.ship.vy = -100; // Initial upward velocity

        if (this.mode === GameMode.Zen) {
            this.ship.maxFuel = Infinity;
            this.ship.fuel = Infinity;
        }

        this.planets = [];
        this.particleSystem.particles = [];
        this.levelGenerator.reset(this.ship.y - 500);

        // Initial render
        this.draw();
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop(this.lastTime);
        console.log("Game loop started");
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.input.cleanup();
    }

    private loop(currentTime: number) {
        if (!this.isRunning) return;

        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Only update logic if playing, but always draw
        if (this.state === GameState.Playing) {
            this.update(deltaTime);
        }

        this.draw();

        this.animationFrameId = requestAnimationFrame((time) => this.loop(time));
    }

    private update(deltaTime: number) {
        // Update input state
        this.ship.isThrusting = this.input.isPressed;

        // Run physics
        const collision = this.physics.update(this.ship, this.planets, deltaTime);

        // Check Game Over conditions
        if (collision) {
            this.gameOver();
            return;
        }

        // Game Over if fallen back to Earth (below start position with buffer)
        if (this.ship.y > 500) {
            this.gameOver();
            return;
        }

        // Particles
        if (this.ship.isThrusting && this.ship.fuel > 0) {
            const engineX = this.ship.x - Math.cos(this.ship.rotation) * 10;
            const engineY = this.ship.y - Math.sin(this.ship.rotation) * 10;

            this.particleSystem.emit(
                engineX,
                engineY,
                2, // count
                150, // speed
                this.ship.rotation + Math.PI, // direction
                0.4, // spread
                '#FFA500',
                0.5 // life
            );
             this.particleSystem.emit(
                engineX,
                engineY,
                1,
                150,
                this.ship.rotation + Math.PI,
                0.2,
                '#FFFF00',
                0.3
            );
        }
        this.particleSystem.update(deltaTime);

        // Generate planets
        const newPlanets = this.levelGenerator.generate(this.ship.y);
        this.planets.push(...newPlanets);

        // Cleanup old planets
        const cleanupThreshold = this.ship.y + this.canvas.height * 2;
        this.planets = this.planets.filter(p => p.y < cleanupThreshold);
    }

    private gameOver() {
        this.state = GameState.GameOver;
        this.ship.vx = 0;
        this.ship.vy = 0;
        this.notifyState();
    }

    private draw() {
        this.renderer.render(this.ship, this.planets, this.particleSystem.particles);
    }

    private notifyState() {
        if (this.onStateChange) {
            this.onStateChange(this.state, Math.floor(-this.ship.y / 100));
        }
    }

    resize(width: number, height: number) {
        this.canvas.width = width;
        this.canvas.height = height;
        if (this.renderer) {
            this.renderer.resize(width, height);
        }
    }
}

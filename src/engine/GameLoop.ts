import { Ship } from '../entities/Ship';
import { PhysicsSystem } from '../systems/Physics';
import { Planet, PlanetType } from '../entities/Planet';
import { FuelItem } from '../entities/FuelItem';
import { LevelGenerator } from '../systems/LevelGenerator';
import { GameConfig } from './GameConfig';
import { InputHandler } from '../systems/Input';
import { Renderer } from '../systems/Renderer';
import { GameState, GameMode } from './GameState';
import { ParticleSystem } from '../systems/Particles';
import { AudioController, EngineType, MusicType } from '../systems/AudioController';

export class GameLoop {
    private canvas: HTMLCanvasElement;
    private animationFrameId: number | null = null;
    private isRunning: boolean = false;
    private lastTime: number = 0;

    private ship: Ship;
    private physics: PhysicsSystem;
    private input: InputHandler;
    private levelGenerator: LevelGenerator;
    public audio: AudioController;
    private renderer: Renderer;
    private particleSystem: ParticleSystem;
    private planets: Planet[] = [];
    private items: FuelItem[] = [];

    private state: GameState = GameState.Start;
    private mode: GameMode = GameMode.Survival;
    public onStateChange: ((state: GameState, score: number) => void) | null = null;
    public onFuelEmpty: (() => void) | null = null;

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
        this.audio = new AudioController();
        this.particleSystem = new ParticleSystem();

        // Initial setup
        this.ship = new Ship(0, 0);
        this.levelGenerator.reset();

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
        this.ship.vy = -60; // Initial upward velocity

        if (this.mode === GameMode.Zen) {
            this.ship.maxFuel = Infinity;
            this.ship.fuel = Infinity;
        }

        this.planets = [];
        this.items = [];
        this.particleSystem.particles = [];
        this.levelGenerator.reset();

        // Add Starter Planet
        // Positioned to the side to create an initial orbit
        // Ship is at (0,0) moving (0, -60)
        // Planet at (200, -200) pulls ship right+up
        // Let's try (150, -100)
        this.planets.push(new Planet(180, -100, 80, PlanetType.Ice));
        // Force generate around start
        const initialPlanets = this.levelGenerator.generate(0, 0, this.planets);
        this.planets.push(...initialPlanets);

        // Initial render
        this.draw();
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.input.attach();
        this.lastTime = performance.now();
        this.audio.resume();
        this.loop(this.lastTime);
        console.log("Game loop started");
    }

    setMute(muted: boolean) {
        this.audio.setMute(muted);
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.input.detach();
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

        const prevFuel = this.ship.fuel;

        // Run physics
        const collision = this.physics.update(this.ship, this.planets, deltaTime);

        // Check for fuel items
        this.physics.checkItemCollisions(this.ship, this.items);
        this.items = this.items.filter(item => !item.collected);

        // Check for fuel empty event
        if (prevFuel > 0 && this.ship.fuel <= 0 && this.mode === GameMode.Survival) {
            if (this.onFuelEmpty) {
                this.onFuelEmpty();
            }
        }

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

        // Audio Update
        // Sync Config
        this.audio.setEngineType(GameConfig.engineType as EngineType);
        this.audio.setMusicType(GameConfig.musicType as MusicType);

        const isLowFuel = this.ship.maxFuel !== Infinity && this.ship.fuel < (this.ship.maxFuel * 0.2);
        this.audio.update(this.ship.isThrusting && this.ship.fuel > 0, isLowFuel);

        // Generate planets
        const newPlanets = this.levelGenerator.generate(this.ship.x, this.ship.y, this.planets);
        this.planets.push(...newPlanets);

        // Generate items
        const newItems = this.levelGenerator.generateItems(this.ship.y);
        this.items.push(...newItems);

        // Cleanup old planets (distance based)
        const cleanupRadius = 3000;
        const cleanupRadiusSq = cleanupRadius * cleanupRadius;

        this.planets = this.planets.filter(p => {
            const dx = p.x - this.ship.x;
            const dy = p.y - this.ship.y;
            return dx * dx + dy * dy < cleanupRadiusSq;
        });

        // Cleanup old items
        this.items = this.items.filter(item => {
            const dy = item.y - this.ship.y;
            // Only remove if far behind (ship.y is less than item.y if moving up)
            // Wait, ship.y is negative. Up is negative.
            // If item.y > ship.y + 2000, it's below the ship.
            return Math.abs(dy) < 3000;
        });

        // Also cleanup visited chunks to allow regeneration
        this.levelGenerator.cleanup(this.ship.x, this.ship.y, cleanupRadius);
    }

    private gameOver() {
        this.state = GameState.GameOver;
        this.ship.vx = 0;
        this.ship.vy = 0;
        this.audio.update(false);
        this.notifyState();
    }

    private draw() {
        this.renderer.render(this.ship, this.planets, this.items, this.particleSystem.particles);
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

    eject() {
        if (this.ship.hasEjected) return;

        this.ship.hasEjected = true;

        // Find nearest planet
        let nearestPlanet: Planet | null = null;
        let minSurfaceDist = Infinity;

        for (const planet of this.planets) {
            const dx = this.ship.x - planet.x;
            const dy = this.ship.y - planet.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const surfaceDist = dist - planet.radius;

            if (surfaceDist < minSurfaceDist) {
                minSurfaceDist = surfaceDist;
                nearestPlanet = planet;
            }
        }

        if (nearestPlanet) {
            const dx = this.ship.x - nearestPlanet.x;
            const dy = this.ship.y - nearestPlanet.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Strong impulse away from planet
            const force = 400; // Strong push
            if (dist > 0.1) {
                this.ship.vx += (dx / dist) * force;
                this.ship.vy += (dy / dist) * force;
            }

            // Visual effect
            this.particleSystem.emit(
                this.ship.x,
                this.ship.y,
                20,
                200,
                0, // random dir handled by spread if needed, or implement omni-emit
                Math.PI * 2,
                '#FF0000',
                1.0
            );
        } else {
            // Fallback: push up
             this.ship.vy -= 400;
        }
    }
}

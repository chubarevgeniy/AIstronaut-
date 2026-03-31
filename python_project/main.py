import pygame
import math
import sys
import os

from game_config import GameConfig
from entities import Ship, Planet, PlanetType
from level_generator import LevelGenerator
from physics import PhysicsSystem
from particles import ParticleSystem
from audio import AudioController
from renderer import Renderer

class GameState:
    Start = 0
    Playing = 1
    GameOver = 2
    Paused = 3

class GameMode:
    Survival = 0
    Zen = 1

class GameLoop:
    def __init__(self, surface, width, height):
        self.surface = surface
        self.width = width
        self.height = height

        self.physics = PhysicsSystem()
        self.levelGenerator = LevelGenerator()
        self.audio = AudioController()
        self.particleSystem = ParticleSystem()
        self.renderer = Renderer(surface, width, height)

        self.ship = Ship(0, 0)
        self.levelGenerator.reset()

        self.planets = []
        self.items = []

        self.state = GameState.Start
        self.mode = GameMode.Survival

        self.is_running = True
        self.clock = pygame.time.Clock()

        # UI fonts
        pygame.font.init()
        self.font_large = pygame.font.SysFont('Courier New', 32, bold=True)
        self.font_small = pygame.font.SysFont('Courier New', 16)

        # Hook up events
        def on_fuel_gained():
            self.renderer.triggerFuelFlash()

        def on_near_miss():
            self.renderer.showNotification("NEAR MISS +10 FUEL!")

        self.ship.onFuelGained = on_fuel_gained
        self.ship.onNearMiss = on_near_miss

        # We manually render the start screen or game over screen

    def reset(self, startLy=0):
        startY = -startLy * 100
        self.ship = Ship(0, startY)
        self.ship.vy = -60

        def on_fuel_gained():
            self.renderer.triggerFuelFlash()

        def on_near_miss():
            self.renderer.showNotification("NEAR MISS +10 FUEL!")

        self.ship.onFuelGained = on_fuel_gained
        self.ship.onNearMiss = on_near_miss

        if self.mode == GameMode.Zen:
            self.ship.maxFuel = float('inf')
            self.ship.fuel = float('inf')

        self.planets = []
        self.items = []
        self.particleSystem.particles = []
        self.levelGenerator.reset(startY)

        if startLy == 0:
            self.planets.append(Planet(180, -100, 80, PlanetType.Ice))

        initialPlanets = self.levelGenerator.generate(0, startY, self.planets)
        self.planets.extend(initialPlanets)

    def start_game(self, mode):
        self.mode = mode
        startLy = GameConfig.debugStartDistance if GameConfig.debugStartDistance > 0 else 0
        self.reset(startLy)
        self.state = GameState.Playing
        self.audio.resume()

    def handle_input(self, events):
        for event in events:
            if event.type == pygame.QUIT:
                self.is_running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE:
                    self.ship.isThrusting = True
            elif event.type == pygame.KEYUP:
                if event.key == pygame.K_SPACE:
                    self.ship.isThrusting = False
            elif event.type == pygame.MOUSEBUTTONDOWN:
                if event.button == 1: # Left click
                    if self.state == GameState.Start or self.state == GameState.GameOver:
                        # Simple click anywhere to start Survival for now
                        # In a full port, we'd check button bounding boxes
                        # Left side Survival, Right side Zen (split screen horizontally)
                        mx, my = event.pos
                        if mx < self.width // 2:
                            self.start_game(GameMode.Survival)
                        else:
                            self.start_game(GameMode.Zen)
                    elif self.state == GameState.Playing:
                        self.ship.isThrusting = True
            elif event.type == pygame.MOUSEBUTTONUP:
                if event.button == 1:
                    self.ship.isThrusting = False

    def game_over(self):
        self.state = GameState.GameOver
        self.ship.vx = 0
        self.ship.vy = 0
        self.audio.update(False)

    def update(self, deltaTime):
        prevFuel = self.ship.fuel

        collision = self.physics.update(self.ship, self.planets, self.items, deltaTime)
        self.physics.checkItemCollisions(self.ship, self.items)

        self.items = [item for item in self.items if not item.collected]

        if collision:
            self.game_over()
            return

        if self.ship.y > 500:
            self.game_over()
            return

        if self.ship.isThrusting and self.ship.fuel > 0:
            import math
            engineX = self.ship.x - math.cos(self.ship.rotation) * 10
            engineY = self.ship.y - math.sin(self.ship.rotation) * 10

            self.particleSystem.emit(engineX, engineY, 2, 150, self.ship.rotation + math.pi, 0.4, '#FFA500', 0.5)
            self.particleSystem.emit(engineX, engineY, 1, 150, self.ship.rotation + math.pi, 0.2, '#FFFF00', 0.3)

        self.particleSystem.update(deltaTime)

        isLowFuel = self.ship.maxFuel != float('inf') and self.ship.fuel < (self.ship.maxFuel * 0.2)
        self.audio.update(self.ship.isThrusting and self.ship.fuel > 0, isLowFuel)

        newPlanets = self.levelGenerator.generate(self.ship.x, self.ship.y, self.planets)
        self.planets.extend(newPlanets)

        newItems = self.levelGenerator.generateItems(self.ship.y)
        self.items.extend(newItems)

        cleanupRadiusSq = 3000 * 3000
        self.planets = [p for p in self.planets if (p.x - self.ship.x)**2 + (p.y - self.ship.y)**2 < cleanupRadiusSq]
        self.items = [item for item in self.items if abs(item.y - self.ship.y) < 3000]

        self.levelGenerator.cleanup(self.ship.x, self.ship.y, 3000)

    def draw_ui(self):
        if self.state == GameState.Start or self.state == GameState.GameOver:
            # Dim background
            s = pygame.Surface((self.width, self.height))
            s.set_alpha(128)
            s.fill((0, 0, 0))
            self.surface.blit(s, (0, 0))

            title = "AISTRonaut" if self.state == GameState.Start else "GAME OVER"
            title_surf = self.font_large.render(title, True, (255, 255, 255))
            tr = title_surf.get_rect(center=(self.width // 2, self.height // 3))
            self.surface.blit(title_surf, tr)

            if self.state == GameState.GameOver:
                score = math.floor(-self.ship.y / 100)
                score_surf = self.font_small.render(f"SCORE: {score} LY", True, (255, 255, 255))
                sr = score_surf.get_rect(center=(self.width // 2, self.height // 3 + 40))
                self.surface.blit(score_surf, sr)

            surv_surf = self.font_small.render("CLICK LEFT: SURVIVAL", True, (200, 200, 200))
            zen_surf = self.font_small.render("CLICK RIGHT: ZEN", True, (200, 200, 200))

            surv_rect = surv_surf.get_rect(center=(self.width // 4, self.height // 2))
            zen_rect = zen_surf.get_rect(center=(self.width * 3 // 4, self.height // 2))

            self.surface.blit(surv_surf, surv_rect)
            self.surface.blit(zen_surf, zen_rect)

    def run(self):
        while self.is_running:
            deltaTime = self.clock.tick(60) / 1000.0

            # Handle events
            events = pygame.event.get()
            self.handle_input(events)

            # Check window resize
            # (In a fully resizable window, we'd handle VIDEORESIZE event)
            for event in events:
                if event.type == pygame.VIDEORESIZE:
                    self.width, self.height = event.w, event.h
                    self.surface = pygame.display.set_mode((self.width, self.height), pygame.RESIZABLE)
                    self.renderer.resize(self.width, self.height)

            if self.state == GameState.Playing:
                self.update(deltaTime)

            self.renderer.render(self.ship, self.planets, self.items, self.particleSystem.particles)
            self.draw_ui()

            pygame.display.flip()

        pygame.quit()
        sys.exit()

if __name__ == "__main__":
    pygame.init()

    # We open a window with an arbitrary width, letting it be wider to demonstrate the fog
    init_w, init_h = 800, 600
    screen = pygame.display.set_mode((init_w, init_h), pygame.RESIZABLE)
    pygame.display.set_caption("AIstronaut Python")

    game = GameLoop(screen, init_w, init_h)
    game.run()

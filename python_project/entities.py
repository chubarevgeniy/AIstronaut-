import math
from game_config import GameConfig

class Ship:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.vx = 0
        self.vy = 0
        self.rotation = -math.pi / 2 # Pointing up
        self.width = 20
        self.height = 30
        self.isThrusting = False
        self.maxFuel = 100
        self.fuel = 100
        self.hasEjected = False
        self.thrustCooldown = 0
        self.nearMissTimer = 0
        self.onFuelGained = None
        self.isLanded = False
        self.landedPlanet = None
        self.onNearMiss = None

    def addFuel(self, amount):
        if self.maxFuel == float('inf'):
            return

        oldFuel = self.fuel
        self.fuel = min(self.maxFuel, self.fuel + amount)

        if self.fuel > oldFuel and self.onFuelGained:
            self.onFuelGained()

class PlanetType:
    Dead = 'dead'
    Ocean = 'ocean'
    Ice = 'ice'
    Desert = 'desert'
    GasGiant = 'gas_giant'
    BlackHole = 'black_hole'
    Asteroid = 'asteroid'
    Star = 'star'

class Planet:
    def __init__(self, x, y, radius, planet_type):
        self.x = x
        self.y = y
        self.radius = radius
        self.type = planet_type
        self.gravityScale = GameConfig.gravityRadiusScale
        self.mass = radius * radius * 1
        self.hasFlag = False
        self.flagAngle = 0

        if planet_type == PlanetType.Dead:
            self.color = (136, 136, 136)
        elif planet_type == PlanetType.Ocean:
            self.color = (0, 0, 255)
        elif planet_type == PlanetType.Ice:
            self.color = (173, 216, 230)
        elif planet_type == PlanetType.Desert:
            self.color = (255, 165, 0)
        elif planet_type == PlanetType.GasGiant:
            self.color = (255, 69, 0)
            self.mass *= 2
        elif planet_type == PlanetType.BlackHole:
            self.color = (0, 0, 0)
            self.mass *= 4
        elif planet_type == PlanetType.Asteroid:
            self.color = (102, 102, 102)
            self.mass = 0
        elif planet_type == PlanetType.Star:
            self.color = (255, 255, 224)
            self.mass *= 4
            self.gravityScale = 6.0
        else:
            self.color = (255, 255, 255)

    @property
    def gravityRadius(self):
        return self.radius * self.gravityScale

class FuelItem:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.radius = 30
        self.collected = False
        self.amount = 50

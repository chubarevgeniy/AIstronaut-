import math
import random
from game_config import GameConfig
from entities import Planet, PlanetType, FuelItem

class LevelGenerator:
    def __init__(self):
        self.visitedChunks = set()
        self.lastFuelSpawnY = 0
        self.spawnInterval = GameConfig.fuelSpawnInterval

    def generateItems(self, shipY):
        items = []
        if shipY < self.lastFuelSpawnY - self.spawnInterval:
            self.lastFuelSpawnY -= self.spawnInterval

            if random.random() < 0.9:
                y = self.lastFuelSpawnY - random.random() * 1000
                x = (random.random() - 0.5) * GameConfig.chunkSize * 3
                items.append(FuelItem(x, y))

                if random.random() < 0.5:
                    y2 = self.lastFuelSpawnY - random.random() * 1000
                    x2 = (random.random() - 0.5) * GameConfig.chunkSize * 3
                    items.append(FuelItem(x2, y2))
        return items

    def generate(self, shipX, shipY, existingPlanets=None):
        if existingPlanets is None:
            existingPlanets = []

        newPlanets = []
        currentChunkX = math.floor(shipX / GameConfig.chunkSize)
        currentChunkY = math.floor(shipY / GameConfig.chunkSize)
        minGap = 100

        for dx in range(-1, 2):
            for dy in range(-1, 2):
                chunkX = currentChunkX + dx
                chunkY = currentChunkY + dy
                chunkKey = f"{chunkX},{chunkY}"

                if chunkKey not in self.visitedChunks:
                    self.visitedChunks.add(chunkKey)

                    count = GameConfig.minPlanetsPerChunk + math.floor(random.random() * (GameConfig.maxPlanetsPerChunk - GameConfig.minPlanetsPerChunk))

                    for _ in range(count):
                        attempts = 0
                        valid = False
                        x = 0
                        y = 0
                        radius = 0

                        while not valid and attempts < 10:
                            attempts += 1
                            x = (chunkX * GameConfig.chunkSize) + random.random() * GameConfig.chunkSize
                            y = (chunkY * GameConfig.chunkSize) + random.random() * GameConfig.chunkSize
                            radius = GameConfig.minPlanetRadius + random.random() * (GameConfig.maxPlanetRadius - GameConfig.minPlanetRadius)

                            if chunkX == 0 and chunkY == 0:
                                if abs(x) < 350 and abs(y) < 350:
                                    continue

                            valid = True

                            for p in newPlanets:
                                dist = math.sqrt((x - p.x)**2 + (y - p.y)**2)
                                if dist < (radius + p.radius + minGap):
                                    valid = False
                                    break

                            if not valid:
                                continue

                            for p in existingPlanets:
                                dist = math.sqrt((x - p.x)**2 + (y - p.y)**2)
                                if dist < (radius + p.radius + minGap):
                                    valid = False
                                    break

                        if valid:
                            depth = -y
                            availableTypes = [PlanetType.Dead, PlanetType.Ocean, PlanetType.Ice, PlanetType.Desert, PlanetType.GasGiant, PlanetType.BlackHole]

                            if depth < 5000:
                                availableTypes.remove(PlanetType.BlackHole)

                            if depth > 20000:
                                if random.random() < 0.05:
                                    ptype = PlanetType.Star
                                    radius = GameConfig.maxPlanetRadius
                                else:
                                    ptype = random.choice(availableTypes)
                            else:
                                ptype = random.choice(availableTypes)

                            newPlanets.append(Planet(x, y, radius, ptype))

                    asteroidStartDepth = 10000
                    chunkDepth = -chunkY * GameConfig.chunkSize

                    if chunkDepth > asteroidStartDepth:
                        if random.random() < 0.4:
                            clusterCount = math.floor(random.random() * 5) + 3
                            clusterX = (chunkX * GameConfig.chunkSize) + random.random() * GameConfig.chunkSize
                            clusterY = (chunkY * GameConfig.chunkSize) + random.random() * GameConfig.chunkSize

                            for _ in range(clusterCount):
                                offX = (random.random() - 0.5) * 200
                                offY = (random.random() - 0.5) * 200
                                ax = clusterX + offX
                                ay = clusterY + offY
                                ar = 10 + random.random() * 10

                                aValid = True
                                for p in newPlanets:
                                    dist = math.sqrt((ax - p.x)**2 + (ay - p.y)**2)
                                    if dist < p.radius + ar + 50:
                                        aValid = False
                                        break

                                if aValid and existingPlanets:
                                    for p in existingPlanets:
                                        dist = math.sqrt((ax - p.x)**2 + (ay - p.y)**2)
                                        if dist < p.radius + ar + 50:
                                            aValid = False
                                            break

                                if aValid:
                                    newPlanets.append(Planet(ax, ay, ar, PlanetType.Asteroid))
        return newPlanets

    def cleanup(self, shipX, shipY, cleanupRadius):
        currentChunkX = math.floor(shipX / GameConfig.chunkSize)
        currentChunkY = math.floor(shipY / GameConfig.chunkSize)
        cleanupChunkRadius = math.ceil(cleanupRadius / GameConfig.chunkSize)

        keysToRemove = []
        for key in self.visitedChunks:
            cxStr, cyStr = key.split(',')
            cx = int(cxStr)
            cy = int(cyStr)

            if abs(cx - currentChunkX) > cleanupChunkRadius or abs(cy - currentChunkY) > cleanupChunkRadius:
                keysToRemove.append(key)

        for key in keysToRemove:
            self.visitedChunks.remove(key)

    def reset(self, startY=0):
        self.visitedChunks.clear()
        self.lastFuelSpawnY = startY

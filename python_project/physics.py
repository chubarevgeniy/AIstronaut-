import math
from game_config import GameConfig
from entities import PlanetType

class PhysicsSystem:

    def checkItemCollisions(self, ship, items):
        for item in items:
            if item.collected:
                continue

            dx = ship.x - item.x
            dy = ship.y - item.y
            dist = math.sqrt(dx * dx + dy * dy)

            if dist < item.radius + 10:
                item.collected = True
                ship.addFuel(item.amount)

    def update(self, ship, planets, items, deltaTime):
        if ship.thrustCooldown > 0:
            ship.thrustCooldown -= deltaTime
            ship.isThrusting = False

        if ship.isLanded and ship.landedPlanet:
            if ship.isThrusting:
                ship.isLanded = False
                angle = ship.landedPlanet['angle']

                ship.x += math.cos(angle) * 5
                ship.y += math.sin(angle) * 5

                ship.vx += math.cos(angle) * 100
                ship.vy += math.sin(angle) * 100
                ship.landedPlanet = None
            else:
                p = ship.landedPlanet
                surfaceDist = p['radius'] + GameConfig.shipCollisionRadius
                ship.x = p['x'] + math.cos(p['angle']) * surfaceDist
                ship.y = p['y'] + math.sin(p['angle']) * surfaceDist
                ship.vx = 0
                ship.vy = 0
                return False

        gx = 0
        gy = 0
        hasCollided = False

        if ship.nearMissTimer > 0:
            ship.nearMissTimer -= deltaTime

        for planet in planets:
            dx = planet.x - ship.x
            dy = planet.y - ship.y
            distSq = dx * dx + dy * dy
            dist = math.sqrt(distSq)

            if planet.type != PlanetType.Asteroid:
                if dist < planet.radius + GameConfig.shipCollisionRadius:
                    speed = math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy)
                    if speed < GameConfig.landingMaxSpeed:
                        ship.isLanded = True
                        ship.isThrusting = False
                        ship.thrustCooldown = 1.0

                        angle = math.atan2(ship.y - planet.y, ship.x - planet.x)
                        ship.rotation = angle
                        ship.addFuel(5)

                        planet.hasFlag = True
                        planet.flagAngle = angle

                        ship.landedPlanet = {
                            'x': planet.x,
                            'y': planet.y,
                            'radius': planet.radius,
                            'angle': angle
                        }
                        surfaceDist = planet.radius + GameConfig.shipCollisionRadius
                        ship.x = planet.x + math.cos(angle) * surfaceDist
                        ship.y = planet.y + math.sin(angle) * surfaceDist
                        ship.vx = 0
                        ship.vy = 0
                    else:
                        hasCollided = True

            if dist > 10 and dist < planet.gravityRadius:
                if planet.type != PlanetType.Asteroid:
                    force = (GameConfig.gravityConstant * planet.mass) / distSq

                    if planet.type == PlanetType.BlackHole:
                        force *= 3.0
                        ship.addFuel(50 * deltaTime)

                    if ship.nearMissTimer <= 0:
                        if dist < planet.radius + GameConfig.nearMissDistance and math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy) > GameConfig.nearMissSpeedThreshold:
                            ship.addFuel(GameConfig.nearMissFuelReward)
                            ship.nearMissTimer = GameConfig.nearMissCooldown

                            if GameConfig.debugShowNearMiss == 1 and ship.onNearMiss:
                                ship.onNearMiss()

                    if planet.type == PlanetType.Star:
                        dangerRadius = planet.gravityRadius / 3.0
                        if dist < dangerRadius:
                            if ship.maxFuel != float('inf'):
                                ship.fuel -= (GameConfig.starFuelBurnRate or 20) * deltaTime

                    gx += force * (dx / dist)
                    gy += force * (dy / dist)

        if hasCollided:
            ship.vx = 0
            ship.vy = 0
            return True

        ship.vx += gx * deltaTime
        ship.vy += gy * deltaTime

        if ship.isThrusting and ship.fuel > 0:
            nearestObj = None
            minSurfaceDist = float('inf')

            for planet in planets:
                dx = ship.x - planet.x
                dy = ship.y - planet.y
                dist = math.sqrt(dx * dx + dy * dy)
                surfaceDist = dist - planet.radius

                if surfaceDist < minSurfaceDist:
                    minSurfaceDist = surfaceDist
                    nearestObj = {'x': planet.x, 'y': planet.y, 'type': 'planet'}

            for item in items:
                if item.collected:
                    continue
                dx = ship.x - item.x
                dy = ship.y - item.y
                dist = math.sqrt(dx * dx + dy * dy)
                surfaceDist = dist - item.radius

                if surfaceDist < minSurfaceDist:
                    minSurfaceDist = surfaceDist
                    nearestObj = {'x': item.x, 'y': item.y, 'type': 'fuel'}

            if nearestObj and minSurfaceDist < 2000:
                dx = ship.x - nearestObj['x']
                dy = ship.y - nearestObj['y']
                dist = math.sqrt(dx * dx + dy * dy)

                if dist > 1:
                    if nearestObj['type'] == 'fuel':
                        ship.vx -= (dx / dist) * GameConfig.thrustPower * deltaTime
                        ship.vy -= (dy / dist) * GameConfig.thrustPower * deltaTime
                    else:
                        ship.vx += (dx / dist) * GameConfig.thrustPower * deltaTime
                        ship.vy += (dy / dist) * GameConfig.thrustPower * deltaTime
            else:
                ship.vx += math.cos(ship.rotation) * GameConfig.thrustPower * deltaTime
                ship.vy += math.sin(ship.rotation) * GameConfig.thrustPower * deltaTime

            ship.fuel -= 10 * deltaTime

        ship.x += ship.vx * deltaTime
        ship.y += ship.vy * deltaTime

        speedSq = ship.vx * ship.vx + ship.vy * ship.vy
        if speedSq > 1:
            ship.rotation = math.atan2(ship.vy, ship.vx)

        return False

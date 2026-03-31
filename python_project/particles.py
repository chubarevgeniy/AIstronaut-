import math
import random

class Particle:
    def __init__(self, x, y, vx, vy, life, color, size):
        self.x = x
        self.y = y
        self.vx = vx
        self.vy = vy
        self.life = life
        self.maxLife = life
        self.color = color
        self.size = size

class ParticleSystem:
    def __init__(self):
        self.particles = []

    def emit(self, x, y, count, speed, angle, spread, color, life):
        for _ in range(count):
            a = angle + (random.random() - 0.5) * spread
            s = speed * (0.5 + random.random() * 0.5)
            vx = math.cos(a) * s
            vy = math.sin(a) * s
            size = random.random() * 2 + 1
            l = life * (0.5 + random.random() * 0.5)
            self.particles.append(Particle(x, y, vx, vy, l, color, size))

    def update(self, deltaTime):
        for p in self.particles:
            p.x += p.vx * deltaTime
            p.y += p.vy * deltaTime
            p.life -= deltaTime

        self.particles = [p for p in self.particles if p.life > 0]

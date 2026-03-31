import pygame
import math
import random
from entities import PlanetType

class Renderer:
    def __init__(self, surface, width, height):
        self.surface = surface
        self.width = width
        self.height = height
        self.stars = []
        self.fuelFlashTimer = 0
        self.notificationTimer = 0
        self.notificationText = ""
        self.generateStars()

        # Pygame font init
        pygame.font.init()
        # Fallback to sysfont, matching monospace style
        self.font = pygame.font.SysFont('Courier New', 12)
        self.notif_font = pygame.font.SysFont('Courier New', 20)

        # For fog effect (wider screen ratio fix)
        # Assuming mobile aspect ratio 320:568 ~ 9:16
        self.target_width = 320
        self.target_ratio = 320 / 568.0

    def resize(self, width, height):
        self.width = width
        self.height = height
        self.generateStars()

    def generateStars(self):
        self.stars = []
        for _ in range(200):
            self.stars.append({
                'x': random.random() * self.width,
                'y': random.random() * self.height,
                'size': random.random() * 2 + 0.5,
                'alpha': random.random() * 0.8 + 0.2
            })

    def triggerFuelFlash(self):
        self.fuelFlashTimer = 1.0

    def showNotification(self, text):
        self.notificationText = text
        self.notificationTimer = 2.0

    def render(self, ship, planets, items, particles):
        # Determine internal rendering bounds to enforce ratio
        current_ratio = self.width / float(self.height)

        # Logic for maintaining a mobile-like aspect ratio
        # Calculate play_width and play_height
        if current_ratio > self.target_ratio:
            # Window is wider than needed. Cap width, add "fog" bars on sides.
            play_height = self.height
            play_width = int(self.height * self.target_ratio)
            offset_x = (self.width - play_width) // 2
            offset_y = 0
        else:
            # Window is taller or matches ratio.
            play_width = self.width
            play_height = self.height
            offset_x = 0
            offset_y = 0

        # Fill background (black)
        self.surface.fill((0, 0, 0))

        # Camera Logic
        # Ship fixed at (play_width/2, play_height*0.75) within play area
        camX = ship.x - play_width / 2
        camY = ship.y - play_height * 0.75

        # Create a subsurface or clip rect for the playable area to prevent
        # drawing over the fog if we want a clean cut. But the requirements say:
        # "maybe some fog effect should be used to keep same screen ration (or similar) not to change difficulty for players with wider screen"
        play_rect = pygame.Rect(offset_x, offset_y, play_width, play_height)
        self.surface.set_clip(play_rect)

        # Draw Stars (Parallax)
        self.drawStars(camX, camY, offset_x, offset_y, play_width, play_height)

        # To translate world coords to screen coords:
        # screen_x = world_x - camX + offset_x
        # screen_y = world_y - camY + offset_y

        for planet in planets:
            self.drawPlanet(planet, camX, camY, offset_x, offset_y)

        for item in items:
            if not item.collected:
                self.drawItem(item, camX, camY, offset_x, offset_y)

        for p in particles:
            alpha = int((p.life / p.maxLife) * 255)
            # Create a small surface to support alpha
            color_str = p.color if isinstance(p.color, str) else '#FFFFFF'
            c = pygame.Color(color_str)

            s_x = int(p.x - camX + offset_x)
            s_y = int(p.y - camY + offset_y)

            # Fast rect drawing (no alpha for perf, or manual alpha surface if needed)
            pygame.draw.rect(self.surface, c, (s_x, s_y, max(1, int(p.size)), max(1, int(p.size))))

        self.drawShip(ship, camX, camY, offset_x, offset_y)

        self.drawNearestPlanetIndicator(ship, planets, items, camX, camY, offset_x, offset_y)

        # Notifications
        if self.notificationTimer > 0:
            self.notificationTimer -= 0.016
            alpha = min(255, int(self.notificationTimer * 255))
            text_surf = self.notif_font.render(self.notificationText, True, (255, 255, 255))
            # Pygame doesn't easily do text alpha without blitting to another surface.
            text_surf.set_alpha(alpha)

            text_rect = text_surf.get_rect(center=(offset_x + play_width // 2, offset_y + play_height // 2))
            self.surface.blit(text_surf, text_rect)

        self.drawHUD(ship, offset_x, offset_y)

        # Reset clip region
        self.surface.set_clip(None)

        # Draw Fog on margins
        self.drawFog(offset_x, offset_y, play_width, play_height)


    def drawStars(self, camX, camY, ox, oy, pw, ph):
        for star in self.stars:
            sx = (star['x'] - camX * 0.05) % self.width
            sy = (star['y'] - camY * 0.05) % self.height
            if sx < 0: sx += self.width
            if sy < 0: sy += self.height

            # Wrap within playable width for seamless parallax
            sx = (sx % pw) + ox
            sy = (sy % ph) + oy

            c = max(0, min(255, int(star['alpha'] * 255)))
            pygame.draw.rect(self.surface, (c, c, c), (int(sx), int(sy), max(1, int(star['size'])), max(1, int(star['size']))))

    def drawItem(self, item, camX, camY, ox, oy):
        sx = int(item.x - camX + ox)
        sy = int(item.y - camY + oy)

        # Outline / glow (simplified)
        pygame.draw.circle(self.surface, (0, 100, 0), (sx, sy), int(item.radius))

        # Jagged Ship Model
        points = [
            (sx, sy - 20),
            (sx - 10, sy - 5),
            (sx - 15, sy + 10),
            (sx - 5, sy + 5),
            (sx + 5, sy + 15),
            (sx + 15, sy + 10),
            (sx + 10, sy - 5)
        ]
        pygame.draw.polygon(self.surface, (153, 153, 153), points)
        pygame.draw.polygon(self.surface, (255, 255, 255), points, 2)

    def drawPlanet(self, planet, camX, camY, ox, oy):
        sx = int(planet.x - camX + ox)
        sy = int(planet.y - camY + oy)
        r = int(planet.radius)

        if planet.type != PlanetType.Asteroid:
            # Gravity radius (dotted simplified to thin circle)
            gr = int(planet.gravityRadius)
            pygame.draw.circle(self.surface, (50, 50, 50), (sx, sy), gr, 1)

        if planet.type == PlanetType.Star:
            # Danger zone
            dr = int(planet.gravityRadius / 3)
            pygame.draw.circle(self.surface, (150, 0, 0), (sx, sy), dr, 2)

        if planet.type == PlanetType.BlackHole:
            # Event Horizon
            pygame.draw.circle(self.surface, (0, 0, 0), (sx, sy), r)
            pygame.draw.circle(self.surface, (255, 255, 255), (sx, sy), r, 2)
            return

        if planet.type == PlanetType.Asteroid:
            pygame.draw.circle(self.surface, planet.color, (sx, sy), r)
            # Crater
            pygame.draw.circle(self.surface, (0, 0, 0), (int(sx + r*0.3), int(sy + r*0.3)), int(r*0.3))
            return

        pygame.draw.circle(self.surface, planet.color, (sx, sy), r)
        # Highlight
        pygame.draw.circle(self.surface, (255, 255, 255, 25), (int(sx - r*0.2), int(sy - r*0.2)), int(r*0.2))

        if planet.hasFlag:
            surfX = sx + math.cos(planet.flagAngle) * planet.radius
            surfY = sy + math.sin(planet.flagAngle) * planet.radius
            # Simplify flag rendering due to rotation
            # Draw line then tri
            pole_end_x = surfX + math.cos(planet.flagAngle) * 25
            pole_end_y = surfY + math.sin(planet.flagAngle) * 25
            pygame.draw.line(self.surface, (255, 255, 255), (surfX, surfY), (pole_end_x, pole_end_y), 2)
            pygame.draw.circle(self.surface, (255, 255, 255), (int(pole_end_x), int(pole_end_y)), 3)

    def drawShip(self, ship, camX, camY, ox, oy):
        sx = ship.x - camX + ox
        sy = ship.y - camY + oy

        # Rotate points
        p1 = (10, 0)
        p2 = (-10, 7)
        p3 = (-5, 0)
        p4 = (-10, -7)

        pts = [p1, p2, p3, p4]
        rot_pts = []
        for p in pts:
            rx = p[0] * math.cos(ship.rotation) - p[1] * math.sin(ship.rotation)
            ry = p[0] * math.sin(ship.rotation) + p[1] * math.cos(ship.rotation)
            rot_pts.append((int(sx + rx), int(sy + ry)))

        pygame.draw.polygon(self.surface, (255, 255, 255), rot_pts)

        if ship.isThrusting and ship.fuel > 0:
            flame = [
                (-5, 0),
                (-15, 5),
                (-25 + random.random() * 10, 0),
                (-15, -5)
            ]
            f_pts = []
            for p in flame:
                rx = p[0] * math.cos(ship.rotation) - p[1] * math.sin(ship.rotation)
                ry = p[0] * math.sin(ship.rotation) + p[1] * math.cos(ship.rotation)
                f_pts.append((int(sx + rx), int(sy + ry)))
            pygame.draw.polygon(self.surface, (255, 165, 0), f_pts)


    def drawNearestPlanetIndicator(self, ship, planets, items, camX, camY, ox, oy):
        nearest = None
        minSurfaceDist = float('inf')

        for p in planets:
            dx = p.x - ship.x
            dy = p.y - ship.y
            dist = math.sqrt(dx * dx + dy * dy)
            surfaceDist = dist - p.radius

            if surfaceDist < minSurfaceDist:
                minSurfaceDist = surfaceDist
                nearest = {'x': p.x, 'y': p.y, 'isFuel': False}

        for item in items:
            if item.collected: continue
            dx = item.x - ship.x
            dy = item.y - ship.y
            dist = math.sqrt(dx * dx + dy * dy)
            surfaceDist = dist - item.radius

            if surfaceDist < minSurfaceDist:
                minSurfaceDist = surfaceDist
                nearest = {'x': item.x, 'y': item.y, 'isFuel': True}

        if nearest:
            dx = nearest['x'] - ship.x
            dy = nearest['y'] - ship.y
            dist = math.sqrt(dx * dx + dy * dy)

            if 10 < minSurfaceDist < 2000:
                indicatorDist = 40
                ix = (dx / dist) * indicatorDist
                iy = (dy / dist) * indicatorDist

                color = (0, 255, 0) if nearest['isFuel'] else (255, 0, 0)

                sx = int(ship.x + ix - camX + ox)
                sy = int(ship.y + iy - camY + oy)
                pygame.draw.circle(self.surface, color, (sx, sy), 2)

    def drawHUD(self, ship, ox, oy):
        altitude = math.floor(-ship.y / 100)
        alt_str = f"ALT: {str(altitude).zfill(6)} LY"
        alt_surf = self.font.render(alt_str, True, (255, 255, 255))
        self.surface.blit(alt_surf, (ox + 10, oy + 60))

        if ship.maxFuel != float('inf'):
            fuel_label = self.font.render("FUEL", True, (255, 255, 255))
            self.surface.blit(fuel_label, (ox + 10, oy + 80))

            if self.fuelFlashTimer > 0:
                self.fuelFlashTimer -= 0.1

            barX = ox + 50
            barY = oy + 82
            totalDots = 20
            dotSize = 3
            dotGap = 2

            fuelPercent = max(0, ship.fuel / ship.maxFuel)
            activeDots = int(fuelPercent * totalDots)

            for i in range(totalDots):
                if i < activeDots:
                    if self.fuelFlashTimer > 0:
                        color = (0, 255, 0)
                    elif ship.isThrusting:
                        color = (255, 165, 0)
                    else:
                        color = (255, 255, 255) if fuelPercent > 0.2 else (255, 0, 0)
                else:
                    color = (51, 51, 51)

                pygame.draw.rect(self.surface, color, (barX + i * (dotSize + dotGap), barY, dotSize, dotSize))
        else:
            inf_label = self.font.render("FUEL: INF", True, (102, 102, 102))
            self.surface.blit(inf_label, (ox + 10, oy + 80))

    def drawFog(self, ox, oy, pw, ph):
        # Draw the areas outside the play width if any.
        # This keeps the game mobile ratio and adds fog to sides.
        if ox > 0:
            # Left side
            left_rect = pygame.Rect(0, 0, ox, self.height)
            # We can draw dark gray gradient or dither pattern.
            # Simple gray for performance, or semi-transparent overlay
            pygame.draw.rect(self.surface, (10, 10, 15), left_rect)

            # Right side
            right_rect = pygame.Rect(ox + pw, 0, self.width - (ox + pw), self.height)
            pygame.draw.rect(self.surface, (10, 10, 15), right_rect)

            # Optionally add some subtle lines or noise to "fog" rects
            for _ in range(50):
                lx = random.randint(0, ox - 1)
                ly = random.randint(0, self.height - 1)
                pygame.draw.line(self.surface, (20, 20, 30), (lx, ly), (lx+2, ly))

                rx = random.randint(ox + pw, self.width - 1)
                ry = random.randint(0, self.height - 1)
                pygame.draw.line(self.surface, (20, 20, 30), (rx, ry), (rx+2, ry))

            # Draw borders separating play area and fog
            pygame.draw.line(self.surface, (40, 40, 50), (ox, 0), (ox, self.height), 2)
            pygame.draw.line(self.surface, (40, 40, 50), (ox + pw, 0), (ox + pw, self.height), 2)

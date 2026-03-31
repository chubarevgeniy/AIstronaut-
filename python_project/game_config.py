import json
import os

class GameConfig:
    gravityConstant = 300
    gravityRadiusScale = 3.0
    thrustPower = 300
    minPlanetRadius = 15
    maxPlanetRadius = 50
    minPlanetsPerChunk = 2
    maxPlanetsPerChunk = 5
    chunkSize = 600
    shipCollisionRadius = 5
    fuelSpawnInterval = 10000
    engineType = 2
    musicType = 2
    engineVolume = 0.3
    musicVolume = 2.5
    starFuelBurnRate = 20.0
    nearMissSpeedThreshold = 300
    nearMissFuelReward = 10.0
    nearMissCooldown = 1.0
    nearMissDistance = 40
    debugStartDistance = 0
    landingMaxSpeed = 65.0
    debugShowNearMiss = 0

    @classmethod
    def load(cls, filepath="../game_config.json"):
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                data = json.load(f)
                for k, v in data.items():
                    if hasattr(cls, k):
                        setattr(cls, k, v)
        else:
            print(f"Warning: Configuration file {filepath} not found. Using defaults.")

# Try to load the config relative to the script
script_dir = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(script_dir, "..", "game_config.json")
GameConfig.load(config_path)

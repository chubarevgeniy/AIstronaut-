using UnityEngine;

namespace Core {
    public static class GameConfig {
        public const float GravityConstant = 300.0f;
        public const float GravityRadiusScale = 3.0f;
        public const float ThrustPower = 300.0f;
        public const float MinPlanetRadius = 15.0f;
        public const float MaxPlanetRadius = 50.0f;
        public const int MinPlanetsPerChunk = 2;
        public const int MaxPlanetsPerChunk = 5;
        public const float ChunkSize = 600.0f;
        public const float ShipCollisionRadius = 5.0f;
        public const float FuelSpawnInterval = 10000.0f;
        public const int EngineType = 2;
        public const int MusicType = 2;
        public const float EngineVolume = 0.3f;
        public const float MusicVolume = 2.5f;
        public const float StarFuelBurnRate = 20.0f;
        public const float NearMissSpeedThreshold = 300.0f;
        public const float NearMissFuelReward = 10.0f;
        public const float NearMissCooldown = 1.0f;
        public const float NearMissDistance = 40.0f;
        public const float DebugStartDistance = 0.0f;
        public const float LandingMaxSpeed = 65.0f;
        public const int DebugShowNearMiss = 0;
    }
}

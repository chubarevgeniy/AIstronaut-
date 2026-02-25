using UnityEngine;
using System.Collections.Generic;
using Core;
using Entities;
using Visuals;

namespace Systems {
    public class LevelGenerator : MonoBehaviour {
        public static LevelGenerator Instance { get; private set; }

        public List<Planet> ActivePlanets = new List<Planet>();
        public List<FuelItem> ActiveFuelItems = new List<FuelItem>();

        private HashSet<string> visitedChunks = new HashSet<string>();
        private float lastFuelSpawnY = 0;
        private float spawnInterval;

        private void Awake() {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);

            spawnInterval = GameConfig.FuelSpawnInterval;
        }

        private void Update() {
            if (ShipController.Instance == null) return;

            Vector3 shipPos = ShipController.Instance.transform.position;

            // Check chunks around ship
            int cx = Mathf.FloorToInt(shipPos.x / GameConfig.ChunkSize);
            int cy = Mathf.FloorToInt(shipPos.y / GameConfig.ChunkSize);

            for (int dx = -1; dx <= 1; dx++) {
                for (int dy = -1; dy <= 1; dy++) {
                    string key = $"{cx + dx},{cy + dy}";
                    if (!visitedChunks.Contains(key)) {
                        GenerateChunk(cx + dx, cy + dy);
                        visitedChunks.Add(key);
                    }
                }
            }

            // Fuel Spawning (Depth based)
            if (shipPos.y < lastFuelSpawnY - spawnInterval) {
                lastFuelSpawnY -= spawnInterval;
                SpawnFuel(lastFuelSpawnY);
            }

            // Cleanup
            Cleanup(shipPos);
        }

        private void GenerateChunk(int cx, int cy) {
            float chunkWorldX = cx * GameConfig.ChunkSize;
            float chunkWorldY = cy * GameConfig.ChunkSize;

            int count = Random.Range(GameConfig.MinPlanetsPerChunk, GameConfig.MaxPlanetsPerChunk);

            for (int i = 0; i < count; i++) {
                float x = chunkWorldX + Random.Range(0, GameConfig.ChunkSize);
                float y = chunkWorldY + Random.Range(0, GameConfig.ChunkSize);
                float radius = Random.Range(GameConfig.MinPlanetRadius, GameConfig.MaxPlanetRadius);

                // Check ship start collision
                if (cx == 0 && cy == 0 && Mathf.Abs(x) < 350 && Mathf.Abs(y) < 350) continue;

                // Collision with other planets
                bool valid = true;
                foreach (var p in ActivePlanets) {
                    if (Vector2.Distance(new Vector2(x, y), p.transform.position) < radius + p.Radius + 100f) {
                        valid = false;
                        break;
                    }
                }
                if (!valid) continue;

                PlanetType type = DeterminePlanetType(y);
                SpawnPlanet(x, y, radius, type);
            }
        }

        private PlanetType DeterminePlanetType(float y) {
            float depth = -y;
            // Simplified logic matching TS
            if (depth > 20000 && Random.value < 0.05f) return PlanetType.Star;
            if (depth > 10000 && Random.value < 0.4f) return PlanetType.Asteroid;

            // Default random
            var types = (PlanetType[])System.Enum.GetValues(typeof(PlanetType));
            return types[Random.Range(0, types.Length)];
        }

        private void SpawnPlanet(float x, float y, float radius, PlanetType type) {
            GameObject go = new GameObject($"Planet_{type}");
            go.transform.position = new Vector3(x, y, 0);

            Planet p = go.AddComponent<Planet>();
            p.Init(radius, type);

            // Add Visuals
            ShapeGenerator.Instance.GeneratePlanetVisuals(p);

            ActivePlanets.Add(p);
        }

        private void SpawnFuel(float baseY) {
            float y = baseY - Random.Range(0, 1000f);
            float x = (Random.value - 0.5f) * GameConfig.ChunkSize * 3;

            GameObject go = new GameObject("FuelItem");
            go.transform.position = new Vector3(x, y, 0);

            FuelItem f = go.AddComponent<FuelItem>();
            f.Init(20f, 15f); // 20 fuel, 15 radius

            ShapeGenerator.Instance.GenerateFuelVisuals(f);

            ActiveFuelItems.Add(f);
        }

        private void Cleanup(Vector3 shipPos) {
            float cleanupDist = GameConfig.ChunkSize * 3;

            for (int i = ActivePlanets.Count - 1; i >= 0; i--) {
                if (Vector2.Distance(shipPos, ActivePlanets[i].transform.position) > cleanupDist) {
                    Destroy(ActivePlanets[i].gameObject);
                    ActivePlanets.RemoveAt(i);
                }
            }
             for (int i = ActiveFuelItems.Count - 1; i >= 0; i--) {
                if (Vector2.Distance(shipPos, ActiveFuelItems[i].transform.position) > cleanupDist) {
                    Destroy(ActiveFuelItems[i].gameObject);
                    ActiveFuelItems.RemoveAt(i);
                }
            }
        }

        public void ResetLevel() {
            foreach (var p in ActivePlanets) Destroy(p.gameObject);
            foreach (var f in ActiveFuelItems) Destroy(f.gameObject);
            ActivePlanets.Clear();
            ActiveFuelItems.Clear();
            visitedChunks.Clear();
            lastFuelSpawnY = 0;
        }
    }
}

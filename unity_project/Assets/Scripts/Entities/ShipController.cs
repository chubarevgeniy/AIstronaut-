using UnityEngine;
using Core;
using Systems;
using InputSystem;
using System.Collections.Generic;

namespace Entities {
    public class ShipController : MonoBehaviour {
        public static ShipController Instance { get; private set; }

        public float Fuel;
        public float MaxFuel = 100f;
        public bool IsLanded;
        public bool IsThrusting;

        private Vector2 velocity;
        private float rotation;
        private float thrustCooldown;
        private float nearMissTimer;

        // Visuals
        public GameObject FlameObject;

        private Planet landedPlanet;

        private void Awake() {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void Start() {
            Visuals.ShapeGenerator.Instance.GenerateShipVisuals(this);
            ResetShip();
        }

        public void ResetShip() {
            transform.position = new Vector3(0, -Core.GameConfig.DebugStartDistance * 100f, 0); // Start position
            velocity = Vector2.zero;
            Fuel = MaxFuel;
            IsLanded = false;
            landedPlanet = null;
            rotation = -Mathf.PI / 2; // Point up
        }

        private void Update() {
            if (GameManager.Instance.CurrentState != GameState.Playing) return;

            float dt = Time.deltaTime;

            HandleThrust(dt);
            ApplyGravity(dt);
            Move(dt);
            CheckCollisions();

            // Near Miss Timer
            if (nearMissTimer > 0) nearMissTimer -= dt;

            // Rotation
            if (velocity.sqrMagnitude > 1f) {
                rotation = Mathf.Atan2(velocity.y, velocity.x);
            } else if (IsLanded && landedPlanet != null) {
                // Keep relative rotation
            }

            transform.rotation = Quaternion.Euler(0, 0, rotation * Mathf.Rad2Deg);
        }

        private void HandleThrust(float dt) {
            IsThrusting = InputManager.Instance.IsThrusting;
            if (FlameObject) FlameObject.SetActive(IsThrusting && Fuel > 0);

            if (IsLanded && IsThrusting) {
                // Takeoff
                IsLanded = false;
                // Add initial boost away from surface
                float angle = landedPlanet.FlagAngle;
                Vector2 push = new Vector2(Mathf.Cos(angle), Mathf.Sin(angle)) * 100f; // Initial push
                velocity += push;
                landedPlanet = null;
                transform.position += (Vector3)push.normalized * 5f; // Nudge
                thrustCooldown = 0.5f;
            }

            if (thrustCooldown > 0) {
                thrustCooldown -= dt;
                IsThrusting = false;
            }

            if (IsThrusting && Fuel > 0) {
                Fuel -= 10f * dt; // Consumption rate

                // Find nearest for attraction/repulsion
                Vector2 pos = transform.position;
                Vector2 force = Vector2.zero;

                // Simple implementation: Use GameConfig logic
                // Find nearest Planet or Fuel
                float minDist = float.MaxValue;
                Vector2 targetPos = Vector2.zero;
                bool isFuel = false;

                // Check Planets
                foreach (var p in LevelGenerator.Instance.ActivePlanets) {
                    float d = Vector2.Distance(pos, p.transform.position);
                    float surfaceD = d - p.Radius;
                    if (surfaceD < minDist) {
                        minDist = surfaceD;
                        targetPos = p.transform.position;
                        isFuel = false;
                    }
                }

                // Check Fuel
                foreach (var f in LevelGenerator.Instance.ActiveFuelItems) {
                    if (f.Collected) continue;
                    float d = Vector2.Distance(pos, f.transform.position);
                    float surfaceD = d - f.Radius;
                    if (surfaceD < minDist) {
                        minDist = surfaceD;
                        targetPos = f.transform.position;
                        isFuel = true;
                    }
                }

                if (minDist < 2000f) {
                    Vector2 dir = (targetPos - pos).normalized;
                    if (isFuel) {
                        // Attract
                        force = dir * GameConfig.ThrustPower;
                    } else {
                        // Repel
                        force = -dir * GameConfig.ThrustPower;
                    }
                } else {
                    // Standard thrust
                    force = new Vector2(Mathf.Cos(rotation), Mathf.Sin(rotation)) * GameConfig.ThrustPower;
                }

                velocity += force * dt;
            }
        }

        private void ApplyGravity(float dt) {
            if (IsLanded) return;

            Vector2 pos = transform.position;
            Vector2 totalForce = Vector2.zero;

            foreach (var p in LevelGenerator.Instance.ActivePlanets) {
                if (p.Type == PlanetType.Asteroid) continue;

                Vector2 d = (Vector2)p.transform.position - pos;
                float distSq = d.sqrMagnitude;
                float dist = Mathf.Sqrt(distSq);

                if (dist > p.GravityRadius) continue;
                if (dist < 10f) continue; // Avoid singularity

                float forceMag = (GameConfig.GravityConstant * p.Mass) / distSq;

                // Black Hole Pull
                if (p.Type == PlanetType.BlackHole) {
                    forceMag *= 3.0f;
                    // Also fuel regen near black hole?
                     Fuel += 50f * dt;
                     if(Fuel > MaxFuel) Fuel = MaxFuel;
                }

                totalForce += d.normalized * forceMag;

                // Near Miss Logic
                if (nearMissTimer <= 0) {
                     if (dist < p.Radius + GameConfig.NearMissDistance && velocity.magnitude > GameConfig.NearMissSpeedThreshold) {
                        AddFuel(GameConfig.NearMissFuelReward);
                        nearMissTimer = GameConfig.NearMissCooldown;
                        if (Systems.AudioManager.Instance) {
                            Systems.AudioManager.Instance.PlaySfx(Systems.AudioManager.Instance.NearMissClip);
                        }
                     }
                }

                // Star Damage
                if (p.Type == PlanetType.Star) {
                    if (dist < p.GravityRadius / 3.0f) {
                         Fuel -= GameConfig.StarFuelBurnRate * dt;
                    }
                }
            }

            velocity += totalForce * dt;
        }

        private void Move(float dt) {
            if (IsLanded) {
                 velocity = Vector2.zero;
                 // Stick to planet
                 if (landedPlanet != null) {
                     // Could implement rotation with planet if planets rotated, but they don't
                     // Just keep position fixed relative to center?
                     // Actually, just set velocity zero is enough if we snap position on collision
                 }
            } else {
                transform.position += (Vector3)(velocity * dt);
            }
        }

        private void CheckCollisions() {
             Vector2 pos = transform.position;

             // Planets
             foreach (var p in LevelGenerator.Instance.ActivePlanets) {
                 if (p.Type == PlanetType.Asteroid) continue; // No crash on asteroids

                 float dist = Vector2.Distance(pos, p.transform.position);
                 if (dist < p.Radius + GameConfig.ShipCollisionRadius) {
                     float speed = velocity.magnitude;
                     if (speed < GameConfig.LandingMaxSpeed) {
                         Land(p);
                     } else {
                         Crash();
                     }
                     return;
                 }
             }

             // Fuel
             foreach (var f in LevelGenerator.Instance.ActiveFuelItems) {
                 if (f.Collected) continue;
                 float dist = Vector2.Distance(pos, f.transform.position);
                 if (dist < f.Radius + GameConfig.ShipCollisionRadius + 10f) {
                     f.Collect();
                     AddFuel(f.Amount);
                     if (Systems.AudioManager.Instance) {
                         Systems.AudioManager.Instance.PlaySfx(Systems.AudioManager.Instance.FuelCollectClip);
                     }
                 }
             }
        }

        private void Land(Planet p) {
            IsLanded = true;
            landedPlanet = p;
            velocity = Vector2.zero;
            thrustCooldown = 0.5f;

            // Snap to surface
            Vector2 dir = (transform.position - p.transform.position).normalized;
            transform.position = p.transform.position + (Vector3)(dir * (p.Radius + GameConfig.ShipCollisionRadius));

            // Set rotation tangent to surface (head out)
            float angle = Mathf.Atan2(dir.y, dir.x);
            p.FlagAngle = angle;
            p.HasFlag = true;

            rotation = angle;

            AddFuel(5f); // Landing bonus
        }

        private void Crash() {
            if (Systems.AudioManager.Instance) {
                Systems.AudioManager.Instance.PlaySfx(Systems.AudioManager.Instance.CrashClip);
            }
            GameManager.Instance.GameOver();
            gameObject.SetActive(false);
        }

        public void AddFuel(float amount) {
            Fuel += amount;
            if (Fuel > MaxFuel) Fuel = MaxFuel;
        }
    }
}

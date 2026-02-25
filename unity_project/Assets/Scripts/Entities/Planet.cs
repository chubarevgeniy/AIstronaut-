using UnityEngine;

namespace Entities {
    public enum PlanetType {
        Normal,
        Oxygen,
        Ice,
        Magma,
        Gas,
        Asteroid,
        BlackHole,
        Star
    }

    public class Planet : MonoBehaviour {
        public PlanetType Type;
        public float Radius;
        public float GravityRadius;
        public float Mass;
        public bool HasFlag;
        public float FlagAngle;

        public void Init(float radius, PlanetType type) {
            this.Radius = radius;
            this.Type = type;
            this.Mass = radius * radius * Mathf.PI; // Area as mass approximation
            this.GravityRadius = radius * Core.GameConfig.GravityRadiusScale;

            // Visuals will be handled by a separate component or here
        }
    }
}

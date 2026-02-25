using UnityEngine;
using Entities;

namespace Visuals {
    public class ShapeGenerator : MonoBehaviour {
        public static ShapeGenerator Instance { get; private set; }

        public Material DefaultMaterial; // Assign in Inspector (Sprites-Default)

        private void Awake() {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        public void GeneratePlanetVisuals(Planet p) {
            MeshFilter mf = p.gameObject.AddComponent<MeshFilter>();
            MeshRenderer mr = p.gameObject.AddComponent<MeshRenderer>();
            mr.material = DefaultMaterial ? DefaultMaterial : new Material(Shader.Find("Sprites/Default"));

            Color color = GetPlanetColor(p.Type);
            mr.material.color = color;

            Mesh mesh = CreateCircleMesh(p.Radius, 32);
            mf.mesh = mesh;

            // Optional: Add child objects for details (craters)
        }

        public void GenerateFuelVisuals(FuelItem f) {
            MeshFilter mf = f.gameObject.AddComponent<MeshFilter>();
            MeshRenderer mr = f.gameObject.AddComponent<MeshRenderer>();
            mr.material = DefaultMaterial ? DefaultMaterial : new Material(Shader.Find("Sprites/Default"));
            mr.material.color = Color.green;

            // Jagged circle
            Mesh mesh = CreateJaggedCircleMesh(f.Radius, 16, 2f);
            mf.mesh = mesh;
        }

        public void GenerateShipVisuals(ShipController ship) {
            // Body
            MeshFilter mf = ship.gameObject.AddComponent<MeshFilter>();
            MeshRenderer mr = ship.gameObject.AddComponent<MeshRenderer>();
            mr.material = DefaultMaterial ? DefaultMaterial : new Material(Shader.Find("Sprites/Default"));
            mr.material.color = Color.white;

            Mesh mesh = new Mesh();
            // Triangle pointing right (rotation handled by ship controller)
            // Vertices: (0.5, 0), (-0.5, 0.35), (-0.25, 0), (-0.5, -0.35) scaled by 20?
            // Web uses pixels: (10, 0), (-10, 7), (-5, 0), (-10, -7).
            // Unity units: let's use 1 unit = 10 pixels? No, web config says 1 LY = 100 pixels.
            // GameConfig.ChunkSize = 600.
            // Ship width = 20.
            // If 1 Unity Unit = 1 Pixel, then chunk is 600 units wide. Camera size 300.
            // This is fine. Use pixel coordinates directly.

            Vector3[] vertices = new Vector3[] {
                new Vector3(10, 0, 0),
                new Vector3(-10, 7, 0),
                new Vector3(-5, 0, 0),
                new Vector3(-10, -7, 0)
            };
            int[] triangles = new int[] { 0, 1, 2, 0, 2, 3 };
            mesh.vertices = vertices;
            mesh.triangles = triangles;
            mf.mesh = mesh;

            // Flame (Child object)
            GameObject flame = new GameObject("Flame");
            flame.transform.parent = ship.transform;
            flame.transform.localPosition = Vector3.zero;
            flame.transform.localRotation = Quaternion.identity;

            MeshFilter fmf = flame.AddComponent<MeshFilter>();
            MeshRenderer fmr = flame.AddComponent<MeshRenderer>();
            fmr.material = DefaultMaterial ? DefaultMaterial : new Material(Shader.Find("Sprites/Default"));
            fmr.material.color = new Color(1f, 0.64f, 0f); // Orange

            // Simple flame triangle
            Mesh fMesh = new Mesh();
            Vector3[] fVerts = new Vector3[] {
                new Vector3(-5, 0, 0),
                new Vector3(-15, 5, 0),
                new Vector3(-25, 0, 0), // Tip
                new Vector3(-15, -5, 0)
            };
            int[] fTris = new int[] { 0, 1, 2, 0, 2, 3 };
            fMesh.vertices = fVerts;
            fMesh.triangles = fTris;
            fmf.mesh = fMesh;

            ship.FlameObject = flame;
            flame.SetActive(false);
        }

        private Color GetPlanetColor(PlanetType type) {
            switch (type) {
                case PlanetType.Normal: return Color.white;
                case PlanetType.Oxygen: return new Color(0.4f, 0.4f, 1f);
                case PlanetType.Ice: return Color.cyan;
                case PlanetType.Magma: return new Color(1f, 0.4f, 0f);
                case PlanetType.Gas: return new Color(0.8f, 0f, 0.8f);
                case PlanetType.Asteroid: return Color.gray;
                case PlanetType.BlackHole: return Color.black; // With white rim?
                case PlanetType.Star: return Color.yellow;
                default: return Color.white;
            }
        }

        private Mesh CreateCircleMesh(float radius, int segments) {
            Mesh mesh = new Mesh();
            Vector3[] vertices = new Vector3[segments + 1];
            int[] triangles = new int[segments * 3];

            vertices[0] = Vector3.zero; // Center

            float angleStep = 360f / segments;
            for (int i = 0; i < segments; i++) {
                float angle = i * angleStep * Mathf.Deg2Rad;
                vertices[i + 1] = new Vector3(Mathf.Cos(angle) * radius, Mathf.Sin(angle) * radius, 0);

                triangles[i * 3] = 0;
                triangles[i * 3 + 1] = i + 1;
                triangles[i * 3 + 2] = (i == segments - 1) ? 1 : i + 2;
            }

            mesh.vertices = vertices;
            mesh.triangles = triangles;
            mesh.RecalculateNormals();
            return mesh;
        }

        private Mesh CreateJaggedCircleMesh(float radius, int segments, float jitter) {
            Mesh mesh = new Mesh();
            Vector3[] vertices = new Vector3[segments + 1];
            int[] triangles = new int[segments * 3];

            vertices[0] = Vector3.zero;

            float angleStep = 360f / segments;
            for (int i = 0; i < segments; i++) {
                float angle = i * angleStep * Mathf.Deg2Rad;
                float r = radius + Random.Range(-jitter, jitter);
                vertices[i + 1] = new Vector3(Mathf.Cos(angle) * r, Mathf.Sin(angle) * r, 0);

                triangles[i * 3] = 0;
                triangles[i * 3 + 1] = i + 1;
                triangles[i * 3 + 2] = (i == segments - 1) ? 1 : i + 2;
            }

            mesh.vertices = vertices;
            mesh.triangles = triangles;
            return mesh;
        }
    }
}

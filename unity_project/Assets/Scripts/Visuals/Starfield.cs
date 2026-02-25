using UnityEngine;
using System.Collections.Generic;
using Core;

namespace Visuals {
    public class Starfield : MonoBehaviour {
        public int StarCount = 200;
        public float ParallaxFactor = 0.05f;

        private Transform camTransform;
        private List<Transform> stars = new List<Transform>();
        private List<Vector2> starOrigins = new List<Vector2>(); // Original random positions
        private float width = 20f; // Viewport width in world units (approx)
        private float height = 40f; // Viewport height

        private void Start() {
            camTransform = Camera.main.transform;
            float orthoSize = Camera.main.orthographicSize;
            height = orthoSize * 2f;
            width = height * Camera.main.aspect;

            // Create stars
            for (int i = 0; i < StarCount; i++) {
                GameObject go = GameObject.CreatePrimitive(PrimitiveType.Quad);
                Destroy(go.GetComponent<Collider>());
                go.transform.parent = transform;
                go.name = $"Star_{i}";

                float size = Random.Range(0.05f, 0.2f);
                go.transform.localScale = new Vector3(size, size, 1f);

                // Simple material
                MeshRenderer mr = go.GetComponent<MeshRenderer>();
                mr.material = new Material(Shader.Find("Sprites/Default"));
                mr.material.color = new Color(1f, 1f, 1f, Random.Range(0.2f, 1f));

                stars.Add(go.transform);
                starOrigins.Add(new Vector2(Random.Range(0, width), Random.Range(0, height)));
            }
        }

        private void LateUpdate() {
            if (camTransform == null) return;

            Vector3 camPos = camTransform.position;

            for (int i = 0; i < stars.Count; i++) {
                Transform star = stars[i];
                Vector2 origin = starOrigins[i];

                // Parallax Logic
                float x = (origin.x + camPos.x * (1f - ParallaxFactor)) % width;
                float y = (origin.y + camPos.y * (1f - ParallaxFactor)) % height;

                // Wrap around logic relative to camera
                // We want star to be within camPos +/- width/2

                float relX = (origin.x - camPos.x * ParallaxFactor) % width;
                float relY = (origin.y - camPos.y * ParallaxFactor) % height;

                if (relX < 0) relX += width;
                if (relY < 0) relY += height;

                // Position relative to camera bottom-left
                float finalX = camPos.x - width/2 + relX;
                float finalY = camPos.y - height/2 + relY;

                star.position = new Vector3(finalX, finalY, 10f); // Behind everything
            }
        }
    }
}

using UnityEngine;
using Entities;

namespace Visuals {
    public class CameraFollow : MonoBehaviour {
        public Transform Target;
        public float SmoothSpeed = 0.125f;
        public Vector3 Offset = new Vector3(0, 0, -10f);

        private void LateUpdate() {
            if (ShipController.Instance != null && Target == null) {
                Target = ShipController.Instance.transform;
            }

            if (Target == null) return;

            // Simple follow with offset (Ship usually at lower part of screen)
            Vector3 desiredPosition = Target.position + Offset;
            Vector3 smoothedPosition = Vector3.Lerp(transform.position, desiredPosition, SmoothSpeed);
            transform.position = smoothedPosition;
        }
    }
}

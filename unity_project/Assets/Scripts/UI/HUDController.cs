using UnityEngine;
using UnityEngine.UI;
using Entities;
using Systems;
using Core;

namespace UI {
    public class HUDController : MonoBehaviour {
        [Header("References")]
        public Text AltitudeText;
        public RectTransform FuelBarContainer; // Layout Group for dots
        public RectTransform NearestIndicator; // Image arrow
        public GameObject FuelDotPrefab; // Image prefab

        [Header("Settings")]
        public float IndicatorDistance = 100f; // UI distance

        private Image[] fuelDots;
        private int totalDots = 20;

        private void Start() {
            // Create dots if container exists
            if (FuelBarContainer && FuelDotPrefab) {
                fuelDots = new Image[totalDots];
                for (int i = 0; i < totalDots; i++) {
                    GameObject dot = Instantiate(FuelDotPrefab, FuelBarContainer);
                    fuelDots[i] = dot.GetComponent<Image>();
                }
            }
        }

        private void Update() {
            if (ShipController.Instance == null) return;
            if (GameManager.Instance.CurrentState != GameState.Playing) return;

            UpdateAltitude();
            UpdateFuelBar();
            UpdateIndicator();
        }

        private void UpdateAltitude() {
            if (AltitudeText) {
                float alt = -ShipController.Instance.transform.position.y / 100f; // Scale
                GameManager.Instance.UpdateScore(alt);
                AltitudeText.text = $"ALT: {Mathf.FloorToInt(alt):000000} LY";
            }
        }

        private void UpdateFuelBar() {
            if (fuelDots == null) return;

            float fuelPercent = ShipController.Instance.Fuel / ShipController.Instance.MaxFuel;
            int activeDots = Mathf.FloorToInt(fuelPercent * totalDots);

            for (int i = 0; i < totalDots; i++) {
                if (i < activeDots) {
                    fuelDots[i].color = (fuelPercent < 0.2f) ? Color.red : Color.white;
                    if (ShipController.Instance.IsThrusting) {
                        fuelDots[i].color = new Color(1f, 0.64f, 0f); // Orange
                    }
                } else {
                    fuelDots[i].color = new Color(0.2f, 0.2f, 0.2f); // Dim
                }
            }
        }

        private void UpdateIndicator() {
            if (!NearestIndicator) return;

            Vector2 shipPos = ShipController.Instance.transform.position;
            Vector2 targetPos = Vector2.zero;
            float minDist = float.MaxValue;
            bool isFuel = false;
            bool found = false;

            // Check Planets
            foreach (var p in LevelGenerator.Instance.ActivePlanets) {
                float d = Vector2.Distance(shipPos, p.transform.position);
                float surfaceD = d - p.Radius;
                if (surfaceD < minDist) {
                    minDist = surfaceD;
                    targetPos = p.transform.position;
                    isFuel = false;
                    found = true;
                }
            }

            // Check Fuel
            foreach (var f in LevelGenerator.Instance.ActiveFuelItems) {
                if (f.Collected) continue;
                float d = Vector2.Distance(shipPos, f.transform.position);
                float surfaceD = d - f.Radius;
                if (surfaceD < minDist) {
                    minDist = surfaceD;
                    targetPos = f.transform.position;
                    isFuel = true;
                    found = true;
                }
            }

            if (found && minDist > 10f && minDist < 2000f) {
                NearestIndicator.gameObject.SetActive(true);
                Vector2 dir = (targetPos - shipPos).normalized;
                float angle = Mathf.Atan2(dir.y, dir.x) * Mathf.Rad2Deg;
                NearestIndicator.localRotation = Quaternion.Euler(0, 0, angle - 90); // Assuming arrow points up

                // Set color
                Image img = NearestIndicator.GetComponent<Image>();
                if (img) img.color = isFuel ? Color.green : Color.red;
            } else {
                NearestIndicator.gameObject.SetActive(false);
            }
        }
    }
}

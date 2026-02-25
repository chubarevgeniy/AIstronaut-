using UnityEngine;

namespace Entities {
    public class FuelItem : MonoBehaviour {
        public float Amount;
        public float Radius;
        public bool Collected;

        public void Init(float amount, float radius) {
            this.Amount = amount;
            this.Radius = radius;
            this.Collected = false;
        }

        public void Collect() {
            Collected = true;
            gameObject.SetActive(false);
        }
    }
}

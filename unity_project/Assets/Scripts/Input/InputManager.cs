using UnityEngine;
using UnityEngine.EventSystems;

namespace InputSystem {
    public class InputManager : MonoBehaviour {
        public static InputManager Instance { get; private set; }

        public bool IsThrusting { get; private set; }
        public bool IsPausePressed { get; private set; }

        private void Awake() {
            if (Instance == null) {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            } else {
                Destroy(gameObject);
            }
        }

        private void Update() {
            IsThrusting = false;
            IsPausePressed = false;

            // Desktop Input
            if (Input.GetKey(KeyCode.Space)) {
                IsThrusting = true;
            }

            if (Input.GetKeyDown(KeyCode.Escape)) {
                IsPausePressed = true;
            }

            // Android / Touch Input
            if (Input.touchCount > 0) {
                Touch touch = Input.GetTouch(0);

                // Check if pointer is over UI object
                bool overUI = false;
                if (EventSystem.current != null) {
                    overUI = EventSystem.current.IsPointerOverGameObject(touch.fingerId);
                }

                if (!overUI) {
                     if (touch.phase == TouchPhase.Began || touch.phase == TouchPhase.Stationary || touch.phase == TouchPhase.Moved) {
                        IsThrusting = true;
                     }
                }
            }
        }
    }
}

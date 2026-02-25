using UnityEngine;
using Core;
using Entities;

namespace Systems {
    public class AudioManager : MonoBehaviour {
        public static AudioManager Instance { get; private set; }

        [Header("Sources")]
        public AudioSource MusicSource;
        public AudioSource EngineSource;
        public AudioSource SfxSource;

        [Header("Clips")]
        public AudioClip MusicClip;
        public AudioClip EngineClip;
        public AudioClip ThrustStartClip;
        public AudioClip FuelCollectClip;
        public AudioClip CrashClip;
        public AudioClip NearMissClip;

        private void Awake() {
            if (Instance == null) {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            } else {
                Destroy(gameObject);
            }
        }

        private void Start() {
            if (MusicSource && MusicClip) {
                MusicSource.clip = MusicClip;
                MusicSource.loop = true;
                MusicSource.Play();
            }

            if (EngineSource && EngineClip) {
                EngineSource.clip = EngineClip;
                EngineSource.loop = true;
                EngineSource.Play();
                EngineSource.volume = 0;
            }

            // Init volumes
            SetMusicVolume(GameConfig.MusicVolume > 0 ? 1f : 0f); // Simplification, should use config val
        }

        private void Update() {
            if (ShipController.Instance != null) {
                if (EngineSource) {
                    bool thrusting = ShipController.Instance.IsThrusting && ShipController.Instance.Fuel > 0;
                    float targetVol = thrusting ? GameConfig.EngineVolume : 0f;
                    if (GameManager.Instance.IsMuted) targetVol = 0;

                    EngineSource.volume = Mathf.Lerp(EngineSource.volume, targetVol, Time.deltaTime * 10f);
                    EngineSource.pitch = Mathf.Lerp(EngineSource.pitch, thrusting ? 1.2f : 0.8f, Time.deltaTime * 5f);
                }
            }
        }

        public void PlaySfx(AudioClip clip, float volumeScale = 1f) {
            if (GameManager.Instance.IsMuted) return;
            if (SfxSource && clip) {
                SfxSource.PlayOneShot(clip, volumeScale);
            }
        }

        public void SetMusicVolume(float v) {
            if (MusicSource) MusicSource.volume = GameManager.Instance.IsMuted ? 0 : v;
        }

        public void SetEngineVolume(float v) {
            // Handled in Update relative to thrust
        }
    }
}

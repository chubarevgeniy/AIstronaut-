using UnityEngine;
using UnityEngine.UI;
using Core;
using Entities;

namespace UI {
    public class UIManager : MonoBehaviour {
        public static UIManager Instance { get; private set; }

        [Header("Panels")]
        public GameObject StartPanel;
        public GameObject PausePanel;
        public GameObject GameOverPanel;
        public GameObject HUDPanel;

        [Header("Text Elements")]
        public Text ScoreText; // For Game Over
        public Text HighScoreText;

        [Header("Audio")]
        public Slider SpaceVolumeSlider;
        public Slider MusicVolumeSlider;
        public Slider EngineVolumeSlider;
        public Button MuteButton;

        private void Awake() {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void Start() {
            GameManager.Instance.OnGameStateChanged += OnGameStateChanged;
            OnGameStateChanged(GameManager.Instance.CurrentState);

            // Setup listeners if sliders are assigned
            if (SpaceVolumeSlider) SpaceVolumeSlider.onValueChanged.AddListener(v => SetVolume("Space", v));
            if (MusicVolumeSlider) MusicVolumeSlider.onValueChanged.AddListener(v => SetVolume("Music", v));
            if (EngineVolumeSlider) EngineVolumeSlider.onValueChanged.AddListener(v => SetVolume("Engine", v));
        }

        private void OnDestroy() {
            if (GameManager.Instance != null) {
                GameManager.Instance.OnGameStateChanged -= OnGameStateChanged;
            }
        }

        private void OnGameStateChanged(GameState state) {
            StartPanel.SetActive(state == GameState.Start);
            PausePanel.SetActive(state == GameState.Paused);
            GameOverPanel.SetActive(state == GameState.GameOver);
            HUDPanel.SetActive(state == GameState.Playing);

            if (state == GameState.GameOver) {
                if (ScoreText) ScoreText.text = $"{Mathf.FloorToInt(GameManager.Instance.Score)} LY";
                if (HighScoreText) HighScoreText.text = $"BEST: {GameManager.Instance.HighScoreSurvival} LY";
            }
        }

        public void OnStartSurvival() {
            GameManager.Instance.StartGame(GameMode.Survival);
        }

        public void OnStartZen() {
            GameManager.Instance.StartGame(GameMode.Zen);
        }

        public void OnResume() {
            GameManager.Instance.SetState(GameState.Playing);
        }

        public void OnPause() {
            GameManager.Instance.SetState(GameState.Paused);
        }

        public void OnExit() {
            GameManager.Instance.SetState(GameState.Start);
            // Reset Level
            Systems.LevelGenerator.Instance.ResetLevel();
        }

        public void OnToggleMute() {
            GameManager.Instance.ToggleMute();
            // Update button text?
            if (MuteButton) {
                MuteButton.GetComponentInChildren<Text>().text = GameManager.Instance.IsMuted ? "UNMUTE" : "MUTE";
            }
        }

        public void OnEject() {
            // ShipController.Instance.Eject();
            Debug.Log("Eject Pressed");
        }

        private void SetVolume(string type, float value) {
            // Implement audio mix setting
            Debug.Log($"Set {type} Volume: {value}");
        }
    }
}

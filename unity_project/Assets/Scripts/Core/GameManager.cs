using UnityEngine;
using Core;

namespace Core {
    public class GameManager : MonoBehaviour {
        public static GameManager Instance { get; private set; }

        public GameState CurrentState { get; private set; } = GameState.Start;
        public GameMode CurrentMode { get; private set; } = GameMode.Survival;

        public float Score { get; private set; }
        public float HighScoreSurvival { get; private set; }
        public float HighScoreZen { get; private set; }

        public bool IsMuted { get; private set; }

        public delegate void GameStateChanged(GameState newState);
        public event GameStateChanged OnGameStateChanged;

        private void Awake() {
            if (Instance == null) {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                LoadHighScores();
            } else {
                Destroy(gameObject);
            }
        }

        private void Start() {
            // Initial state
            SetState(GameState.Start);
        }

        private void Update() {
            if (CurrentState == GameState.Playing) {
                // Score updates usually happen in ShipController or LevelGen based on altitude
                // But let's assume ShipController updates the Score in GameManager
            }
        }

        public void SetState(GameState newState) {
            CurrentState = newState;
            OnGameStateChanged?.Invoke(newState);

            if (newState == GameState.Paused) {
                Time.timeScale = 0;
            } else {
                Time.timeScale = 1;
            }
        }

        public void StartGame(GameMode mode) {
            CurrentMode = mode;
            Score = 0;
            SetState(GameState.Playing);
            // Notify LevelGenerator and Ship to reset
        }

        public void GameOver() {
            SetState(GameState.GameOver);
            SaveHighScores();
        }

        public void UpdateScore(float newScore) {
            if (newScore > Score) {
                Score = newScore;
            }
        }

        private void LoadHighScores() {
            HighScoreSurvival = PlayerPrefs.GetFloat("HighScore_Survival", 0);
            HighScoreZen = PlayerPrefs.GetFloat("HighScore_Zen", 0);
        }

        private void SaveHighScores() {
            if (CurrentMode == GameMode.Survival && Score > HighScoreSurvival) {
                HighScoreSurvival = Score;
                PlayerPrefs.SetFloat("HighScore_Survival", HighScoreSurvival);
            } else if (CurrentMode == GameMode.Zen && Score > HighScoreZen) {
                HighScoreZen = Score;
                PlayerPrefs.SetFloat("HighScore_Zen", HighScoreZen);
            }
            PlayerPrefs.Save();
        }

        public void ResetHighScores() {
            PlayerPrefs.DeleteKey("HighScore_Survival");
            PlayerPrefs.DeleteKey("HighScore_Zen");
            HighScoreSurvival = 0;
            HighScoreZen = 0;
            PlayerPrefs.Save();
        }

        public void ToggleMute() {
            IsMuted = !IsMuted;
            AudioListener.volume = IsMuted ? 0 : 1;
        }
    }
}

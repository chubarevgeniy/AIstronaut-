export const GameState = {
    Start: 'start',
    Playing: 'playing',
    Paused: 'paused',
    GameOver: 'game_over'
} as const;

export type GameState = typeof GameState[keyof typeof GameState];

export const GameMode = {
    Survival: 'survival',
    Zen: 'zen'
} as const;

export type GameMode = typeof GameMode[keyof typeof GameMode];

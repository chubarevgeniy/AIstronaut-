import React, { useRef, useEffect, useState } from 'react';
import { GameLoop } from '../engine/GameLoop';
import { GameState, GameMode } from '../engine/GameState';
import { UI } from './UI';
import { DebugMenu } from './DebugMenu';

export const GameCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameLoopRef = useRef<GameLoop | null>(null);
    const [gameState, setGameState] = useState<GameState>(GameState.Start);
    const [score, setScore] = useState<number>(0);
    const [highScores, setHighScores] = useState<{ [key in GameMode]: number }>(() => {
        const savedSurvival = localStorage.getItem('highScore_survival');
        const savedZen = localStorage.getItem('highScore_zen');

        // Migration logic for legacy high score
        let survival = savedSurvival ? parseInt(savedSurvival, 10) : 0;
        if (!savedSurvival) {
            const legacy = localStorage.getItem('highScore');
            if (legacy) {
                survival = parseInt(legacy, 10);
                localStorage.setItem('highScore_survival', legacy);
            }
        }

        const zen = savedZen ? parseInt(savedZen, 10) : 0;
        return { [GameMode.Survival]: survival, [GameMode.Zen]: zen };
    });
    const [gameMode, setGameMode] = useState<GameMode>(GameMode.Survival);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [isFuelEmpty, setIsFuelEmpty] = useState<boolean>(false);
    const [hasEjected, setHasEjected] = useState<boolean>(false);

    useEffect(() => {
        if (gameState === GameState.GameOver) {
            setHighScores(prev => {
                const currentHigh = prev[gameMode];
                if (score > currentHigh) {
                    const newScores = { ...prev, [gameMode]: score };
                    localStorage.setItem(`highScore_${gameMode}`, score.toString());
                    return newScores;
                }
                return prev;
            });
        }
    }, [gameState, score, gameMode]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Initialize game loop
        gameLoopRef.current = new GameLoop(canvas);

        // Listen to state changes
        gameLoopRef.current.onStateChange = (state, score) => {
            setGameState(state);
            setScore(score);
        };

        gameLoopRef.current.onFuelEmpty = () => {
            setIsFuelEmpty(true);
        };

        // Start rendering loop immediately (renders start screen / bg)
        gameLoopRef.current.start();

        const handleResize = () => {
            if (canvas && canvas.parentElement) {
                const displayWidth = canvas.parentElement.clientWidth;
                const displayHeight = canvas.parentElement.clientHeight;

                // Fixed internal width for pixel art look
                const targetWidth = 320;
                const scale = targetWidth / displayWidth;
                const targetHeight = Math.floor(displayHeight * scale);

                // GameLoop.resize sets canvas.width/height
                gameLoopRef.current?.resize(targetWidth, targetHeight);
            }
        };

        window.addEventListener('resize', handleResize);
        // Delay initial resize slightly to ensure parent is ready or just call it
        setTimeout(handleResize, 0);

        return () => {
            gameLoopRef.current?.stop();
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleStart = (mode: GameMode) => {
        if (gameLoopRef.current) {
            setGameMode(mode);
            setIsFuelEmpty(false);
            setHasEjected(false);
            // Explicitly resume audio context on user gesture
            gameLoopRef.current.audio.resume();
            gameLoopRef.current.startGame(mode);
        }
    };

    const handlePause = () => {
        gameLoopRef.current?.pause();
    };

    const handleResume = () => {
        gameLoopRef.current?.resume();
    };

    const handleToggleMute = () => {
        const nextMuted = !isMuted;
        setIsMuted(nextMuted);
        if (gameLoopRef.current) {
            gameLoopRef.current.setMute(nextMuted);
        }
    };

    const handleResetHighScore = () => {
        localStorage.removeItem('highScore_survival');
        localStorage.removeItem('highScore_zen');
        setHighScores({ [GameMode.Survival]: 0, [GameMode.Zen]: 0 });
    };

    const handleExitToMenu = () => {
        if (gameLoopRef.current) {
            gameLoopRef.current.stop();
            // Reset game state
            gameLoopRef.current.reset();
        }
        setGameState(GameState.Start);
    };

    const handleEject = () => {
        if (gameLoopRef.current) {
            gameLoopRef.current.eject();
            setHasEjected(true);
        }
    };

    const handleVolumeChange = (type: 'space' | 'music' | 'engine', value: number) => {
        if (gameLoopRef.current) {
            if (type === 'space') gameLoopRef.current.audio.setSpaceVolume(value);
            if (type === 'music') gameLoopRef.current.audio.setMusicVolume(value);
            if (type === 'engine') gameLoopRef.current.audio.setEngineVolume(value);
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <canvas
                ref={canvasRef}
                style={{ display: 'block', width: '100%', height: '100%', imageRendering: 'pixelated' }}
            />
            <UI
                gameState={gameState}
                gameMode={gameMode}
                score={score}
                highScores={highScores}
                onStart={handleStart}
                onPause={handlePause}
                onResume={handleResume}
                onExit={handleExitToMenu}
                isMuted={isMuted}
                onToggleMute={handleToggleMute}
                onResetHighScore={handleResetHighScore}
                isFuelEmpty={isFuelEmpty}
                hasEjected={hasEjected}
                onEject={handleEject}
                onVolumeChange={handleVolumeChange}
            />
            <DebugMenu gameState={gameState} onWarp={(ly) => gameLoopRef.current?.warpTo(ly)} />
        </div>
    );
};

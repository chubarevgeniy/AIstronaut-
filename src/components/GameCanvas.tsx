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
    const [gameMode, setGameMode] = useState<GameMode>(GameMode.Survival);
    const [isMuted, setIsMuted] = useState<boolean>(false);

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
                onStart={handleStart}
                onPause={handlePause}
                onResume={handleResume}
                isMuted={isMuted}
                onToggleMute={handleToggleMute}
            />
            <DebugMenu />
        </div>
    );
};

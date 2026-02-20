import React from 'react';
import { GameState, GameMode } from '../engine/GameState';

interface UIProps {
    gameState: GameState;
    gameMode: GameMode;
    score: number;
    onStart: (mode: GameMode) => void;
    onPause: () => void;
    onResume: () => void;
    isMuted: boolean;
    onToggleMute: () => void;
}

const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // Darker for Nothing OS feel
    color: '#ffffff',
    fontFamily: '"JetBrains Mono", monospace',
    zIndex: 10,
    pointerEvents: 'auto',
    textAlign: 'center',
    border: '1px solid #333' // Minimalist frame
};

const titleStyle: React.CSSProperties = {
    fontSize: '2.5rem',
    fontWeight: 300,
    marginBottom: '1rem',
    letterSpacing: '-1px',
    borderBottom: '1px dotted #666',
    paddingBottom: '0.5rem',
    width: '80%',
    maxWidth: '300px'
};

const buttonGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
    width: '200px',
    marginTop: '2rem'
};

const infoTextStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: '#aaa',
    marginBottom: '0.5rem'
};

const dotStyle: React.CSSProperties = {
    width: '8px',
    height: '8px',
    backgroundColor: 'red',
    borderRadius: '50%',
    marginRight: '10px',
    display: 'inline-block'
};

const MuteButton: React.FC<{ isMuted: boolean; onToggleMute: () => void }> = ({ isMuted, onToggleMute }) => (
    <button
        onClick={onToggleMute}
        style={{
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 50,
            padding: '5px 10px',
            opacity: 0.8,
            border: '1px solid #666',
            background: 'black',
            color: 'white',
            fontSize: '12px',
            fontFamily: '"JetBrains Mono", monospace',
            cursor: 'pointer'
        }}>
        {isMuted ? 'UNMUTE' : 'MUTE'}
    </button>
);

export const UI: React.FC<UIProps> = ({ gameState, gameMode, score, onStart, onPause, onResume, isMuted, onToggleMute }) => {
    if (gameState === GameState.Playing) {
        return (
            <>
                <MuteButton isMuted={isMuted} onToggleMute={onToggleMute} />
                <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 20 }}>
                    <button
                        onClick={onPause}
                        style={{
                            padding: '5px 10px',
                            opacity: 0.8,
                            border: '1px solid #666',
                            background: 'black',
                            fontSize: '12px'
                        }}>
                        PAUSE
                    </button>
                </div>
            </>
        );
    }

    if (gameState === GameState.Paused) {
        return (
            <>
                <MuteButton isMuted={isMuted} onToggleMute={onToggleMute} />
                <div style={overlayStyle}>
                    <div style={titleStyle}>PAUSED</div>
                    <div style={{...infoTextStyle, color: '#fff', fontSize: '1.2rem'}}>
                        ALTITUDE: {score} LY
                    </div>
                    <div style={buttonGroupStyle}>
                        <button onClick={onResume}>RESUME</button>
                        <button onClick={() => onStart(GameMode.Survival)}>RESTART</button>
                    </div>
                </div>
            </>
        );
    }

    if (gameState === GameState.Start) {
        return (
            <>
                <MuteButton isMuted={isMuted} onToggleMute={onToggleMute} />
                <div style={overlayStyle}>
                    <div style={titleStyle}>
                        <span style={dotStyle}></span>
                        AIstronaut
                    </div>
                    <div style={infoTextStyle}>TAP & HOLD TO THRUST</div>
                    <div style={infoTextStyle}>USE GRAVITY ASSISTS</div>

                    <div style={buttonGroupStyle}>
                        <button onClick={() => onStart(GameMode.Survival)}>
                            SURVIVAL <span style={{fontSize: '0.7em', color: '#666', marginLeft: '5px'}}>[FUEL]</span>
                        </button>
                        <button onClick={() => onStart(GameMode.Zen)}>
                            ZEN <span style={{fontSize: '0.7em', color: '#666', marginLeft: '5px'}}>[∞]</span>
                        </button>
                    </div>

                    <div style={{position: 'absolute', bottom: '20px', fontSize: '0.7rem', color: '#444'}}>
                        V 1.0.0 // SYSTEM READY
                    </div>
                </div>
            </>
        );
    }

    if (gameState === GameState.GameOver) {
        return (
            <>
                <MuteButton isMuted={isMuted} onToggleMute={onToggleMute} />
                <div style={overlayStyle}>
                    <div style={{...titleStyle, borderBottomColor: 'red', color: 'red'}}>
                        SIGNAL LOST
                    </div>
                    <div style={{fontSize: '1rem', marginTop: '1rem', marginBottom: '0.5rem'}}>
                        DISTANCE
                    </div>
                    <div style={{fontSize: '3rem', fontWeight: 700}}>
                        {score} <span style={{fontSize: '1rem', fontWeight: 300}}>LY</span>
                    </div>

                    <div style={buttonGroupStyle}>
                        <button onClick={() => onStart(gameMode)}>RETRY MISSION</button>
                        {gameMode === GameMode.Survival ? (
                            <button onClick={() => onStart(GameMode.Zen)}>SWITCH TO ZEN</button>
                        ) : (
                            <button onClick={() => onStart(GameMode.Survival)}>SWITCH TO SURVIVAL</button>
                        )}
                    </div>
                </div>
            </>
        );
    }

    return null;
};

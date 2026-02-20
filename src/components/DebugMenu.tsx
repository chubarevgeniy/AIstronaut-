import React, { useState } from 'react';
import { GameConfig } from '../engine/GameConfig';
import { GameState } from '../engine/GameState';

const defaultValues = { ...GameConfig };

interface DebugMenuProps {
    gameState: GameState;
}

export const DebugMenu: React.FC<DebugMenuProps> = ({ gameState }) => {
    const [isOpen, setIsOpen] = useState(false);
    // Force update state to re-render inputs when values change
    const [, setTick] = useState(0);
    const forceUpdate = () => setTick(t => t + 1);

    const handleChange = (key: keyof typeof GameConfig, value: string) => {
        const num = parseFloat(value);
        if (!isNaN(num)) {
            // @ts-ignore
            GameConfig[key] = num;
            forceUpdate();
        }
    };

    const handleReset = () => {
        Object.assign(GameConfig, defaultValues);
        forceUpdate();
    };

    const handleExport = () => {
        navigator.clipboard.writeText(JSON.stringify(GameConfig, null, 2));
        alert("Config copied to clipboard!");
    };

    if (gameState === GameState.Playing) return null;

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'absolute',
                    top: 50, // Below mute button
                    left: 20,
                    zIndex: 100,
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    border: '1px solid #333',
                    fontSize: '10px',
                    padding: '2px 5px',
                    cursor: 'pointer',
                    fontFamily: '"JetBrains Mono", monospace'
                }}
            >
                DEV
            </button>
        );
    }

    return (
        <div style={{
            position: 'absolute',
            top: 50,
            left: 20,
            zIndex: 100,
            background: 'rgba(0,0,0,0.9)',
            padding: '10px',
            border: '1px solid #666',
            color: 'white',
            fontSize: '12px',
            fontFamily: '"JetBrains Mono", monospace',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            maxHeight: '80vh',
            overflowY: 'auto',
            width: '250px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <strong>DEBUG CONFIG</strong>
                <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'red', cursor: 'pointer' }}>[X]</button>
            </div>

            {Object.keys(GameConfig).map((key) => {
                const k = key as keyof typeof GameConfig;
                return (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                        <label style={{ fontSize: '10px', color: '#aaa' }}>{key}</label>
                        <input
                            type="number"
                            value={GameConfig[k]}
                            onChange={(e) => handleChange(k, e.target.value)}
                            style={{ width: '60px', background: '#333', color: 'white', border: 'none', padding: '2px', textAlign: 'right' }}
                        />
                    </div>
                );
            })}

            <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                <button onClick={handleReset} style={{ flex: 1, padding: '5px', background: '#444', color: 'white', border: 'none', cursor: 'pointer', fontSize: '10px' }}>RESET</button>
                <button onClick={handleExport} style={{ flex: 1, padding: '5px', background: '#444', color: 'white', border: 'none', cursor: 'pointer', fontSize: '10px' }}>EXPORT</button>
            </div>
        </div>
    );
};

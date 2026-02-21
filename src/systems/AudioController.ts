
export const EngineType = {
    Standard: 0,
    Retro: 1,
    Rumble: 2,
    Jet: 3,
    SciFi: 4
} as const;
export type EngineType = typeof EngineType[keyof typeof EngineType];

export const MusicType = {
    None: 0,
    Ambient: 1,
    Dark: 2
} as const;
export type MusicType = typeof MusicType[keyof typeof MusicType];

export class AudioController {
    private ctx: AudioContext | null = null;
    private engineOsc: OscillatorNode | null = null;
    private engineOsc2: OscillatorNode | null = null; // For dual-oscillator engines
    private engineGain: GainNode | null = null;
    private engineFilter: BiquadFilterNode | null = null;

    private ambienceNode: AudioBufferSourceNode | null = null;
    private ambienceGain: GainNode | null = null;

    private isMuted: boolean = false;
    private isInitialized: boolean = false;

    private currentEngineType: EngineType = EngineType.Standard;
    private currentMusicType: MusicType = MusicType.None;

    private spaceVolume: number = 1.0;
    private musicVolume: number = 1.0;
    private engineVolume: number = 1.0;

    // Music
    private nextNoteTime: number = 0;
    private musicGain: GainNode | null = null;

    // Low Fuel
    private lastLowFuelBeep: number = 0;

    constructor() {
    }

    init() {
        if (this.isInitialized) return;

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.isInitialized = true;
            this.setupEngine();
            this.setupAmbience();
            this.setupMusic();
        } catch (e) {
            console.error("Audio init failed", e);
        }
    }

    async resume() {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
    }

    setEngineType(type: EngineType) {
        if (this.currentEngineType === type) return;
        this.currentEngineType = type;
        this.setupEngine(); // Rebuild engine
    }

    setMusicType(type: MusicType) {
        if (this.currentMusicType === type) return;
        this.currentMusicType = type;
        // Music logic will handle the change on next beat
    }

    setSpaceVolume(v: number) {
        this.spaceVolume = Math.max(0, Math.min(1, v));
        if (this.ambienceGain && !this.isMuted) {
            this.ambienceGain.gain.setTargetAtTime(0.05 * this.spaceVolume, this.ctx?.currentTime || 0, 0.1);
        }
    }

    setMusicVolume(v: number) {
        this.musicVolume = Math.max(0, Math.min(1, v));
        if (this.musicGain && !this.isMuted) {
            this.musicGain.gain.setTargetAtTime(0.1 * this.musicVolume, this.ctx?.currentTime || 0, 0.1);
        }
    }

    setEngineVolume(v: number) {
        this.engineVolume = Math.max(0, Math.min(1, v));
        // Engine volume is dynamic in update(), so we don't set it here directly unless idling
    }

    private setupEngine() {
        if (!this.ctx) return;

        // Cleanup old
        if (this.engineOsc) { try { this.engineOsc.stop(); this.engineOsc.disconnect(); } catch (e) {} }
        if (this.engineOsc2) { try { this.engineOsc2.stop(); this.engineOsc2.disconnect(); } catch (e) {} }
        if (this.engineGain) { try { this.engineGain.disconnect(); } catch (e) {} }
        if (this.engineFilter) { try { this.engineFilter.disconnect(); } catch (e) {} }

        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.value = 0;
        this.engineGain.connect(this.ctx.destination);

        this.engineOsc = this.ctx.createOscillator();
        this.engineFilter = this.ctx.createBiquadFilter();

        switch (this.currentEngineType) {
            case EngineType.Standard: // Sawtooth + Lowpass
                this.engineOsc.type = 'sawtooth';
                this.engineOsc.frequency.value = 50;
                this.engineFilter.type = 'lowpass';
                this.engineFilter.frequency.value = 200;
                this.engineOsc.connect(this.engineFilter);
                this.engineFilter.connect(this.engineGain);
                break;

            case EngineType.Retro: // Square wave (8-bit)
                this.engineOsc.type = 'square';
                this.engineOsc.frequency.value = 60;
                this.engineFilter.type = 'lowpass';
                this.engineFilter.frequency.value = 1000; // Brighter
                this.engineOsc.connect(this.engineFilter);
                this.engineFilter.connect(this.engineGain);
                break;

            case EngineType.Rumble: // Sine + Distortion (simulated by low freq square/saw mix or just low sine)
                this.engineOsc.type = 'triangle';
                this.engineOsc.frequency.value = 30;
                this.engineFilter.type = 'lowpass';
                this.engineFilter.frequency.value = 100;
                this.engineOsc.connect(this.engineFilter);
                this.engineFilter.connect(this.engineGain);
                break;

            case EngineType.Jet: // White Noise (approximated by high freq random modulation or just careful filtering)
                // Web Audio doesn't have a 'noise' oscillator type directly without buffer
                // We'll use a high sawtooth with highpass
                this.engineOsc.type = 'sawtooth';
                this.engineOsc.frequency.value = 100;
                this.engineFilter.type = 'highpass';
                this.engineFilter.frequency.value = 500;
                this.engineOsc.connect(this.engineFilter);
                this.engineFilter.connect(this.engineGain);
                break;

            case EngineType.SciFi: // Dual Oscillator (Sine + Detuned Saw)
                this.engineOsc.type = 'sine';
                this.engineOsc.frequency.value = 100;

                this.engineOsc2 = this.ctx.createOscillator();
                this.engineOsc2.type = 'sawtooth';
                this.engineOsc2.frequency.value = 102; // Detuned

                const mixGain = this.ctx.createGain();
                mixGain.gain.value = 0.5;

                this.engineOsc.connect(this.engineGain);
                this.engineOsc2.connect(mixGain);
                mixGain.connect(this.engineGain);
                this.engineOsc2.start();
                break;

            default:
                 this.engineOsc.type = 'sawtooth';
                 this.engineOsc.connect(this.engineGain);
        }

        this.engineOsc.start();
    }

    private setupAmbience() {
        if (!this.ctx) return;
        // Create noise buffer
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        this.ambienceNode = this.ctx.createBufferSource();
        this.ambienceNode.buffer = buffer;
        this.ambienceNode.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400; // Deep space rumble

        this.ambienceGain = this.ctx.createGain();
        this.ambienceGain.gain.value = 0.05; // Quiet

        this.ambienceNode.connect(filter);
        filter.connect(this.ambienceGain);
        this.ambienceGain.connect(this.ctx.destination);

        this.ambienceNode.start();
    }

    private setupMusic() {
        if (!this.ctx) return;
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.1;
        this.musicGain.connect(this.ctx.destination);
    }

    update(isThrusting: boolean, isLowFuel: boolean = false) {
        if (!this.ctx || !this.engineGain || !this.engineOsc) return;

        if (this.isMuted) {
             this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
             return;
        }

        // Engine Sound Logic
        if (isThrusting) {
            this.engineGain.gain.setTargetAtTime(0.2 * this.engineVolume, this.ctx.currentTime, 0.1);

            // Dynamic pitch shifting based on type
            const baseFreq = this.getEngineBaseFreq();
            this.engineOsc.frequency.setTargetAtTime(baseFreq * 2, this.ctx.currentTime, 0.2);
            if (this.engineOsc2) {
                 this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2.02, this.ctx.currentTime, 0.2);
            }
        } else {
            this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
            const baseFreq = this.getEngineBaseFreq();
            this.engineOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.2);
            if (this.engineOsc2) {
                 this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.02, this.ctx.currentTime, 0.2);
            }
        }

        // Low Fuel Logic
        if (isLowFuel && !this.isMuted) {
             const now = this.ctx.currentTime;
             if (now - this.lastLowFuelBeep > 1.0) { // Beep every second
                 this.playLowFuelBeep();
                 this.lastLowFuelBeep = now;
             }
        }

        // Music Logic
        this.updateMusic();
    }

    private getEngineBaseFreq(): number {
        switch (this.currentEngineType) {
            case EngineType.Standard: return 50;
            case EngineType.Retro: return 60;
            case EngineType.Rumble: return 30;
            case EngineType.Jet: return 100;
            case EngineType.SciFi: return 100;
            default: return 50;
        }
    }

    private playLowFuelBeep() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime); // High A
        osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    private updateMusic() {
        if (!this.ctx || !this.musicGain || this.currentMusicType === MusicType.None || this.isMuted) return;

        const now = this.ctx.currentTime;
        if (now >= this.nextNoteTime) {
            this.playNextMusicNote();
            // Randomize interval slightly for "human" feel
            this.nextNoteTime = now + 1.0 + Math.random() * 2.0;
        }
    }

    private playNextMusicNote() {
        if (!this.ctx || !this.musicGain) return;

        let scale: number[] = [];

        if (this.currentMusicType === MusicType.Ambient) {
            // C Major Pentatonic: C, D, E, G, A
            scale = [261.63, 293.66, 329.63, 392.00, 440.00];
        } else if (this.currentMusicType === MusicType.Dark) {
            // C Minor Pentatonic: C, Eb, F, G, Bb
            scale = [261.63, 311.13, 349.23, 392.00, 466.16];
        }

        // Add lower octave
        const scaleLow = scale.map(f => f / 2);
        const fullScale = [...scaleLow, ...scale];

        // Pick random note
        const freq = fullScale[Math.floor(Math.random() * fullScale.length)];

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = this.currentMusicType === MusicType.Ambient ? 'sine' : 'triangle';
        osc.frequency.value = freq;

        // Envelope
        const now = this.ctx.currentTime;
        const duration = 2.0;

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.5); // Attack
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration); // Decay

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start();
        osc.stop(now + duration + 0.1);
    }

    setMute(muted: boolean) {
        this.isMuted = muted;
        if (!this.ctx) return;

        if (muted) {
            if (this.ambienceGain) this.ambienceGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
            if (this.engineGain) this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
            if (this.musicGain) this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
        } else {
            if (this.ambienceGain) this.ambienceGain.gain.setTargetAtTime(0.05 * this.spaceVolume, this.ctx.currentTime, 0.1);
            if (this.musicGain) this.musicGain.gain.setTargetAtTime(0.1 * this.musicVolume, this.ctx.currentTime, 0.1);
        }
    }
}

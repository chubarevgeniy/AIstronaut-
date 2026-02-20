export class AudioController {
    private ctx: AudioContext | null = null;
    private engineOsc: OscillatorNode | null = null;
    private engineGain: GainNode | null = null;
    private ambienceNode: AudioBufferSourceNode | null = null;
    private ambienceGain: GainNode | null = null;
    private isMuted: boolean = false;
    private isInitialized: boolean = false;

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

    private setupEngine() {
        if (!this.ctx) return;
        this.engineOsc = this.ctx.createOscillator();
        this.engineGain = this.ctx.createGain();

        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.value = 50;

        // Lowpass filter to muffle the harsh sawtooth
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;

        this.engineOsc.connect(filter);
        filter.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);

        this.engineGain.gain.value = 0;
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

    update(isThrusting: boolean) {
        if (!this.ctx || !this.engineGain || !this.engineOsc) return;

        if (this.isMuted) {
             this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
             return;
        }

        if (isThrusting) {
            this.engineGain.gain.setTargetAtTime(0.2, this.ctx.currentTime, 0.1);
            this.engineOsc.frequency.setTargetAtTime(100, this.ctx.currentTime, 0.2); // Pitch up
        } else {
            this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
            this.engineOsc.frequency.setTargetAtTime(50, this.ctx.currentTime, 0.2); // Pitch down
        }
    }

    setMute(muted: boolean) {
        this.isMuted = muted;
        if (!this.ctx) return;

        if (muted) {
            if (this.ambienceGain) this.ambienceGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
            if (this.engineGain) this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
        } else {
            if (this.ambienceGain) this.ambienceGain.gain.setTargetAtTime(0.05, this.ctx.currentTime, 0.1);
        }
    }
}

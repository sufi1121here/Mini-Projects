// ==========================================================
// Web Audio Studio - Core DSP Synthesis & Clock Engine
// Pure native Web Audio API (AudioContext) with lookahead scheduling
// ==========================================================

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.analyser = null;
        this.noiseBuffer = null;

        // Active synth notes map: freq -> { osc, gain }
        this.activeNotes = new Map();

        // Synth Settings
        this.waveform = 'sawtooth';
        this.attack = 0.02;
        this.decay = 0.15;
        this.sustain = 0.5;
        this.release = 0.3;

        // Sequencer Clock State
        this.isPlaying = false;
        this.bpm = 120;
        this.currentStep = 0;
        this.nextNoteTime = 0.0;
        this.scheduleAheadTime = 0.1; // 100ms lookahead
        this.lookaheadInterval = 25;  // 25ms polling frequency
        this.timerId = null;

        // 16-Step Grid Data: 4 tracks x 16 steps (boolean)
        this.grid = {
            kick: Array(16).fill(false),
            snare: Array(16).fill(false),
            hihat: Array(16).fill(false),
            synth: Array(16).fill(false)
        };

        // Pitch assigned to the sequencer synth track per step (pentatonic / minor frequencies)
        this.synthFrequencies = [
            261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25,
            261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25
        ];

        // UI callback for step change: (stepIndex) => void
        this.onStepChange = null;
    }

    /**
     * Lazy-initializes AudioContext on first user interaction
     * to comply with browser autoplay policies.
     */
    init() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            return;
        }

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();

        // Master Gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

        // Master Analyser Node (for live visualizer)
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 1024;
        this.analyser.smoothingTimeConstant = 0.85;

        // Route: MasterGain -> Analyser -> Speakers
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);

        // Pre-generate white noise buffer for Snare and Hi-Hat
        this.generateNoiseBuffer();
    }

    /**
     * Generates a 2-second mono buffer of random white noise.
     */
    generateNoiseBuffer() {
        const bufferSize = this.ctx.sampleRate * 2;
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1; // values between -1.0 and 1.0
        }
    }

    // ==========================================
    // Procedural Drum Synthesis (Pure DSP Math)
    // ==========================================

    /**
     * Synthesizes a deep sub Kick Drum using pitch drop envelope.
     */
    playKick(time) {
        this.init();
        const t = time || this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        // Rapid exponential frequency drop: 160Hz -> 35Hz
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);

        // Volume Envelope
        gain.gain.setValueAtTime(1.0, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.start(t);
        osc.stop(t + 0.36);
    }

    /**
     * Synthesizes a snappy Snare Drum using filtered noise + tonal body.
     */
    playSnare(time) {
        this.init();
        const t = time || this.ctx.currentTime;

        // 1. Noise Component (Snare rattle)
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(800, t);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.8, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        noise.start(t);
        noise.stop(t + 0.2);

        // 2. Tonal Body Component
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);

        oscGain.gain.setValueAtTime(0.6, t);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

        osc.connect(oscGain);
        oscGain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.15);
    }

    /**
     * Synthesizes a crisp Hi-Hat using high-pass filtered white noise.
     */
    playHiHat(time) {
        this.init();
        const t = time || this.ctx.currentTime;

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(6500, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06); // Ultra short decay

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(t);
        noise.stop(t + 0.07);
    }

    /**
     * Synthesizes a short melodic pluck for sequencer melodies.
     */
    playSynthPluck(time, freq = 440) {
        this.init();
        const t = time || this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = this.waveform;
        osc.frequency.setValueAtTime(freq, t);

        // Filter envelope (cutoff sweep for pluck sound)
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3500, t);
        filter.frequency.exponentialRampToValueAtTime(400, t + 0.2);

        // Gain envelope
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.26);
    }

    // ==========================================
    // Interactive Polyphonic Piano Synthesizer
    // ==========================================

    /**
     * Triggers a continuous note from the piano keyboard (with ADSR Attack).
     */
    startNote(freq) {
        this.init();
        if (this.activeNotes.has(freq)) return; // Note already sounding

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = this.waveform;
        osc.frequency.setValueAtTime(freq, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(4500, t);

        // ADSR Attack Phase: 0 -> Max over attack time
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.4, t + this.attack);
        // ADSR Decay to Sustain Phase
        gain.gain.linearRampToValueAtTime(0.4 * this.sustain, t + this.attack + this.decay);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        this.activeNotes.set(freq, { osc, gain, filter });
    }

    /**
     * Releases a piano note with ADSR Release phase.
     */
    stopNote(freq) {
        if (!this.ctx || !this.activeNotes.has(freq)) return;

        const t = this.ctx.currentTime;
        const note = this.activeNotes.get(freq);
        this.activeNotes.delete(freq);

        // ADSR Release Phase: Current Gain -> 0.0001
        note.gain.gain.cancelScheduledValues(t);
        note.gain.gain.setValueAtTime(note.gain.gain.value, t);
        note.gain.gain.exponentialRampToValueAtTime(0.0001, t + this.release);

        note.osc.stop(t + this.release + 0.05);
    }

    // ==========================================
    // 16-Step Lookahead Sequencer Clock
    // ==========================================

    /**
     * Advances the sequencer by 1/16th note using exact audio time.
     */
    nextStep() {
        // Seconds per 16th note = (60 / BPM) / 4
        const secondsPerBeat = 60.0 / this.bpm;
        const secondsPer16th = secondsPerBeat / 4.0;

        this.nextNoteTime += secondsPer16th;
        this.currentStep = (this.currentStep + 1) % 16;
    }

    /**
     * Schedules notes that fall within the lookahead window.
     */
    scheduleStep(stepIndex, time) {
        // Trigger step callback for UI playhead scanning
        if (this.onStepChange) {
            const delayMs = Math.max(0, (time - this.ctx.currentTime) * 1000);
            setTimeout(() => {
                if (this.isPlaying && this.onStepChange) {
                    this.onStepChange(stepIndex);
                }
            }, delayMs);
        }

        // Trigger active drum instruments on this step
        if (this.grid.kick[stepIndex]) this.playKick(time);
        if (this.grid.snare[stepIndex]) this.playSnare(time);
        if (this.grid.hihat[stepIndex]) this.playHiHat(time);
        if (this.grid.synth[stepIndex]) {
            const freq = this.synthFrequencies[stepIndex] || 440;
            this.playSynthPluck(time, freq);
        }
    }

    /**
     * The core lookahead loop: checks every 25ms and schedules notes ahead in time.
     */
    schedulerLoop() {
        while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleStep(this.currentStep, this.nextNoteTime);
            this.nextStep();
        }
    }

    startSequencer() {
        this.init();
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.currentStep = 0;
        this.nextNoteTime = this.ctx.currentTime + 0.05;

        this.timerId = setInterval(() => this.schedulerLoop(), this.lookaheadInterval);
    }

    stopSequencer() {
        this.isPlaying = false;
        clearInterval(this.timerId);
        this.timerId = null;
        this.currentStep = 0;
        if (this.onStepChange) {
            this.onStepChange(-1); // -1 clears the active playhead column
        }
    }

    setBpm(newBpm) {
        this.bpm = Math.max(40, Math.min(240, Number(newBpm) || 120));
    }

    setMasterVolume(val) {
        this.init();
        const volume = Math.max(0, Math.min(1, Number(val) || 0));
        this.masterGain.gain.setValueAtTime(volume, this.ctx.currentTime);
    }
}

// Universal window exposure
window.AudioEngine = AudioEngine;

// ==========================================================
// Web Audio Studio - UI Controller & Real-Time Canvas Oscilloscope
// ==========================================================

const engine = new window.AudioEngine();

// --- Musical Notes Definition (C4 to D5) ---
const PIANO_NOTES = [
    { note: 'C4', freq: 261.63, isBlack: false, key: 'A' },
    { note: 'C#4', freq: 277.18, isBlack: true, key: 'W', offset: 32 },
    { note: 'D4', freq: 293.66, isBlack: false, key: 'S' },
    { note: 'D#4', freq: 311.13, isBlack: true, key: 'E', offset: 80 },
    { note: 'E4', freq: 329.63, isBlack: false, key: 'D' },
    { note: 'F4', freq: 349.23, isBlack: false, key: 'F' },
    { note: 'F#4', freq: 369.99, isBlack: true, key: 'T', offset: 176 },
    { note: 'G4', freq: 392.00, isBlack: false, key: 'G' },
    { note: 'G#4', freq: 415.30, isBlack: true, key: 'Y', offset: 224 },
    { note: 'A4', freq: 440.00, isBlack: false, key: 'H' },
    { note: 'A#4', freq: 466.16, isBlack: true, key: 'U', offset: 272 },
    { note: 'B4', freq: 493.88, isBlack: false, key: 'J' },
    { note: 'C5', freq: 523.25, isBlack: false, key: 'K' },
    { note: 'D5', freq: 587.33, isBlack: false, key: 'L' }
];

// Map of pressed computer keys to note elements
const keyMap = new Map();

// --- Genre Presets ---
const PRESETS = {
    synthwave: {
        bpm: 118,
        waveform: 'sawtooth',
        grid: {
            kick:  [true,  false, false, false, true,  false, false, false, true,  false, false, false, true,  false, false, false],
            snare: [false, false, false, false, true,  false, false, false, false, false, false, false, true,  false, false, false],
            hihat: [true,  false, true,  false, true,  false, true,  false, true,  false, true,  false, true,  false, true,  true],
            synth: [true,  false, true,  true,  false, true,  false, true,  true,  false, true,  false, false, true,  true,  false]
        }
    },
    house: {
        bpm: 124,
        waveform: 'square',
        grid: {
            kick:  [true,  false, false, false, true,  false, false, false, true,  false, false, false, true,  false, false, false],
            snare: [false, false, false, false, true,  false, false, false, false, false, false, false, true,  false, false, false],
            hihat: [false, false, true,  false, false, false, true,  false, false, false, true,  false, false, false, true,  false],
            synth: [false, false, false, true,  false, false, false, true,  false, false, false, true,  false, false, true,  false]
        }
    },
    hiphop: {
        bpm: 92,
        waveform: 'triangle',
        grid: {
            kick:  [true,  false, false, false, false, false, true,  false, false, true,  false, false, false, false, false, false],
            snare: [false, false, false, false, true,  false, false, false, false, false, false, false, true,  false, false, false],
            hihat: [true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true],
            synth: [true,  false, false, true,  false, false, false, false, true,  false, false, true,  false, false, false, false]
        }
    },
    blank: {
        bpm: 120,
        waveform: 'sine',
        grid: {
            kick:  Array(16).fill(false),
            snare: Array(16).fill(false),
            hihat: Array(16).fill(false),
            synth: Array(16).fill(false)
        }
    }
};

// --- DOM References ---
const btnPlay = document.getElementById('btnPlay');
const playIcon = document.getElementById('playIcon');
const playText = document.getElementById('playText');
const bpmSlider = document.getElementById('bpmSlider');
const bpmVal = document.getElementById('bpmVal');
const volumeSlider = document.getElementById('volumeSlider');
const presetSelect = document.getElementById('presetSelect');
const btnClearGrid = document.getElementById('btnClearGrid');

const stepNumbersHeader = document.getElementById('stepNumbersHeader');
const pianoKeyboard = document.getElementById('pianoKeyboard');
const canvas = document.getElementById('oscilloscope');
const ctx = canvas.getContext('2d');

let visualizerMode = 'waveform'; // 'waveform' | 'frequency'

// ==========================================
// 1. Build the 16-Step Sequencer Matrix
// ==========================================

function initSequencerUI() {
    // 1. Generate Step Numbers Header
    stepNumbersHeader.innerHTML = '';
    for (let i = 0; i < 16; i++) {
        const numEl = document.createElement('div');
        numEl.className = `step-num ${i % 4 === 0 ? 'beat-marker' : ''}`;
        numEl.textContent = i + 1;
        numEl.dataset.step = i;
        stepNumbersHeader.appendChild(numEl);
    }

    // 2. Generate Pads for each Track
    const tracks = ['kick', 'snare', 'hihat', 'synth'];
    tracks.forEach(trackName => {
        const padsContainer = document.querySelector(`.track-pads[data-track="${trackName}"]`);
        padsContainer.innerHTML = '';

        for (let i = 0; i < 16; i++) {
            const pad = document.createElement('button');
            pad.className = `seq-pad ${i % 4 === 0 ? 'beat-start' : ''}`;
            pad.dataset.track = trackName;
            pad.dataset.step = i;
            pad.setAttribute('aria-label', `${trackName} step ${i + 1}`);

            pad.addEventListener('click', () => {
                engine.init();
                const isActive = !engine.grid[trackName][i];
                engine.grid[trackName][i] = isActive;
                pad.classList.toggle('active', isActive);
            });

            padsContainer.appendChild(pad);
        }
    });

    // 3. Playhead animation callback from AudioEngine
    engine.onStepChange = (activeStepIndex) => {
        // Update header numbers
        document.querySelectorAll('.step-num').forEach(el => {
            el.classList.toggle('active-head', Number(el.dataset.step) === activeStepIndex);
        });

        // Update all pads in that column
        document.querySelectorAll('.seq-pad').forEach(pad => {
            pad.classList.toggle('head-active', Number(pad.dataset.step) === activeStepIndex);
        });
    };

    // 4. Track Preview Buttons
    document.querySelectorAll('.btn-track-preview').forEach(btn => {
        btn.addEventListener('click', () => {
            engine.init();
            const sound = btn.dataset.sound;
            if (sound === 'kick') engine.playKick();
            else if (sound === 'snare') engine.playSnare();
            else if (sound === 'hihat') engine.playHiHat();
            else if (sound === 'synth') engine.playSynthPluck(null, 440);
        });
    });
}

function loadPreset(presetName) {
    const preset = PRESETS[presetName] || PRESETS.synthwave;

    // Apply BPM
    engine.setBpm(preset.bpm);
    bpmSlider.value = preset.bpm;
    bpmVal.textContent = preset.bpm;

    // Apply Waveform
    setWaveform(preset.waveform);

    // Apply Grid
    ['kick', 'snare', 'hihat', 'synth'].forEach(track => {
        engine.grid[track] = [...preset.grid[track]];
        const pads = document.querySelectorAll(`.track-pads[data-track="${track}"] .seq-pad`);
        pads.forEach((pad, i) => {
            pad.classList.toggle('active', Boolean(preset.grid[track][i]));
        });
    });
}

// ==========================================
// 2. Build Interactive Piano Keyboard
// ==========================================

function initPianoUI() {
    pianoKeyboard.innerHTML = '';

    PIANO_NOTES.forEach(item => {
        const keyEl = document.createElement('div');
        keyEl.className = item.isBlack ? 'key-black' : 'key-white';
        keyEl.dataset.freq = item.freq;
        keyEl.dataset.note = item.note;
        keyEl.dataset.key = item.key;

        if (item.isBlack && item.offset != null) {
            keyEl.style.left = `${item.offset}px`;
        }

        keyEl.innerHTML = `
            <span class="key-note">${item.note}</span>
            <span class="key-badge">${item.key}</span>
        `;

        // Mouse & Touch interaction
        const triggerNoteStart = (e) => {
            e.preventDefault();
            engine.startNote(item.freq);
            keyEl.classList.add('active');
        };

        const triggerNoteStop = (e) => {
            e.preventDefault();
            engine.stopNote(item.freq);
            keyEl.classList.remove('active');
        };

        keyEl.addEventListener('mousedown', triggerNoteStart);
        keyEl.addEventListener('mouseup', triggerNoteStop);
        keyEl.addEventListener('mouseleave', triggerNoteStop);

        keyEl.addEventListener('touchstart', triggerNoteStart, { passive: false });
        keyEl.addEventListener('touchend', triggerNoteStop, { passive: false });

        pianoKeyboard.appendChild(keyEl);
        keyMap.set(item.key.toUpperCase(), { keyEl, freq: item.freq });
    });

    // Computer Keyboard Event Listeners
    window.addEventListener('keydown', (e) => {
        // Prevent key repeating and typing in inputs
        if (e.repeat || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

        const keyChar = e.key.toUpperCase();
        if (keyMap.has(keyChar)) {
            const { keyEl, freq } = keyMap.get(keyChar);
            engine.startNote(freq);
            keyEl.classList.add('active');
        }

        // Spacebar to toggle playback
        if (e.code === 'Space' && e.target.tagName !== 'BUTTON') {
            e.preventDefault();
            togglePlayback();
        }
    });

    window.addEventListener('keyup', (e) => {
        const keyChar = e.key.toUpperCase();
        if (keyMap.has(keyChar)) {
            const { keyEl, freq } = keyMap.get(keyChar);
            engine.stopNote(freq);
            keyEl.classList.remove('active');
        }
    });
}

// ==========================================
// 3. Real-Time Oscilloscope Visualizer Loop
// ==========================================

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth * window.devicePixelRatio || 600;
    canvas.height = canvas.parentElement.clientHeight * window.devicePixelRatio || 120;
}
window.addEventListener('resize', resizeCanvas);

function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, w, h);

    if (!engine.analyser) {
        // Idle line
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
        ctx.lineWidth = 2 * window.devicePixelRatio;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
        return;
    }

    if (visualizerMode === 'waveform') {
        const bufferLength = engine.analyser.fftSize;
        const dataArray = new Uint8Array(bufferLength);
        engine.analyser.getByteTimeDomainData(dataArray);

        // Gradient glow line
        const gradient = ctx.createLinearGradient(0, 0, w, 0);
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(0.5, '#8b5cf6');
        gradient.addColorStop(1, '#ec4899');

        ctx.lineWidth = 2.5 * window.devicePixelRatio;
        ctx.strokeStyle = gradient;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.beginPath();

        const sliceWidth = w / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0; // 0 to 2
            const y = (v * h) / 2;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);

            x += sliceWidth;
        }

        ctx.lineTo(w, h / 2);
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
    } else {
        // Frequency Spectrum Mode
        const bufferLength = engine.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        engine.analyser.getByteFrequencyData(dataArray);

        const barCount = 64;
        const barWidth = (w / barCount);
        const step = Math.floor(bufferLength / barCount);

        for (let i = 0; i < barCount; i++) {
            const barHeight = (dataArray[i * step] / 255) * h * 0.9;
            const x = i * barWidth;
            const y = h - barHeight;

            const hue = 180 + (i / barCount) * 120; // Cyan to Purple
            ctx.fillStyle = `hsl(${hue}, 85%, 60%)`;
            ctx.fillRect(x, y, barWidth - 2, barHeight);
        }
    }
}

// ==========================================
// 4. UI Controls & Parameter Wireup
// ==========================================

function togglePlayback() {
    engine.init();
    if (engine.isPlaying) {
        engine.stopSequencer();
        btnPlay.classList.remove('playing');
        playIcon.textContent = '▶';
        playText.textContent = 'Play';
    } else {
        engine.startSequencer();
        btnPlay.classList.add('playing');
        playIcon.textContent = '⏸';
        playText.textContent = 'Pause';
    }
}

function setWaveform(wave) {
    engine.waveform = wave;
    document.querySelectorAll('.btn-wave').forEach(b => {
        b.classList.toggle('active', b.dataset.wave === wave);
    });
}

// Wire Transport
btnPlay.addEventListener('click', togglePlayback);

bpmSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    bpmVal.textContent = val;
    engine.setBpm(val);
});

volumeSlider.addEventListener('input', (e) => {
    engine.setMasterVolume(e.target.value);
});

presetSelect.addEventListener('change', (e) => {
    loadPreset(e.target.value);
});

btnClearGrid.addEventListener('click', () => {
    loadPreset('blank');
    presetSelect.value = 'blank';
});

// Waveform Picker
document.querySelectorAll('.btn-wave').forEach(btn => {
    btn.addEventListener('click', () => {
        setWaveform(btn.dataset.wave);
    });
});

// Visualizer Mode Switch
document.querySelectorAll('.btn-viz-mode').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-viz-mode').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        visualizerMode = btn.dataset.mode;
    });
});

// ADSR Sliders
document.getElementById('attackSlider').addEventListener('input', (e) => {
    engine.attack = parseFloat(e.target.value);
    document.getElementById('attackVal').textContent = `${engine.attack}s`;
});
document.getElementById('decaySlider').addEventListener('input', (e) => {
    engine.decay = parseFloat(e.target.value);
    document.getElementById('decayVal').textContent = `${engine.decay}s`;
});
document.getElementById('sustainSlider').addEventListener('input', (e) => {
    engine.sustain = parseFloat(e.target.value);
    document.getElementById('sustainVal').textContent = `${Math.round(engine.sustain * 100)}%`;
});
document.getElementById('releaseSlider').addEventListener('input', (e) => {
    engine.release = parseFloat(e.target.value);
    document.getElementById('releaseVal').textContent = `${engine.release}s`;
});

// ==========================================
// 5. Initialize & Launch Studio
// ==========================================

resizeCanvas();
initSequencerUI();
initPianoUI();
loadPreset('synthwave');
drawVisualizer();

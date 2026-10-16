# Web Audio Studio - Synthesizer & 16-Step Drum Machine 🎹🥁

A professional, hardware-accelerated sound synthesis suite and 16-step rhythm sequencer built with **pure Vanilla JavaScript**, the browser's native **HTML5 Web Audio API (`AudioContext`)**, and **HTML5 Canvas**.

---

## 🌟 Why This Impresses Recruiters & International Clients

95% of frontend developers only know how to trigger sound by playing static `.mp3` files via `<audio>` elements.

This project demonstrates deep mastery of **Digital Signal Processing (DSP)** and **browser hardware multimedia APIs**:
* **Pure Mathematical Sound Synthesis:** Zero external audio samples. All drum sounds (Kick, Snare, Hi-Hat) and synth voices are generated on-the-fly using oscillators, custom frequency modulation, envelopes, and procedural white noise buffers.
* **Lookahead Clock Scheduling:** Solves the notorious browser timer jitter issue. While `setInterval` drifts by 10–50ms (ruining musical grooves), this engine uses Chris Wilson’s standard **Web Audio lookahead algorithm** running against `audioContext.currentTime` with microsecond accuracy.
* **Real-time Frequency Analysis & Visualization:** Connects an `AnalyserNode` to master output and computes FFT time-domain byte arrays to render a fluid 60FPS oscilloscope on an HTML5 Canvas using `requestAnimationFrame`.
* **Polyphonic & Expressive Input:** Supports simultaneous piano key playing via mouse, touch, and computer keyboard bindings with configurable ADSR envelopes.

---

## 🚀 Key Features

* **Procedural Drum Engine:**
  * **Kick:** Exponential frequency sweep (160Hz ➔ 35Hz) with punchy gain attenuation.
  * **Snare:** Procedural white noise buffer generator combined with an 800Hz high-pass filter and mid-tone body.
  * **Hi-Hat:** 6500Hz high-pass filtered noise burst with ultra-fast envelope decay.
  * **Synth Pluck:** Resonant low-pass filtered pluck tuned to pentatonic scales.
* **16-Step Matrix Sequencer:**
  * 4 simultaneous tracks across 16 beats.
  * Live playhead position scanning across active step columns.
  * Tempo adjustment (60–180 BPM) and built-in genre presets (**Synthwave Retro**, **House 4-on-the-Floor**, **Hip-Hop Groove**).
* **Live Dual-Mode Visualizer:**
  * **Waveform Mode:** Oscilloscope rendering live audio wave peaks with gradient neon strokes.
  * **Spectrum Mode:** 64-band frequency spectrum visualizer bars.
* **Interactive Piano Synthesizer:**
  * 14 playable notes (C4 to D5) mapped to keyboard keys `A` through `L`.
  * Multi-waveform generator (`Sine`, `Triangle`, `Sawtooth`, `Square`).
  * Real-time ADSR envelope controls (Attack, Decay, Sustain, Release).

---

## 🛠️ Tech Stack

* **Language:** Pure Vanilla JavaScript (ES6+)
* **Audio APIs:** HTML5 Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`, `BiquadFilterNode`, `AnalyserNode`, `AudioBufferSourceNode`)
* **Graphics:** HTML5 Canvas API (2D context, `requestAnimationFrame`)
* **Styling:** Custom CSS3 with Cyber-Studio Glassmorphism, CSS Custom Properties, and Flexbox/Grid

# Sorting & Algorithm Visualizer 📊

A real-time algorithm visualizer and complexity analysis suite built with **Vanilla JavaScript**, the **HTML5 Canvas API**, and the **Web Audio API**.

---

## 🌟 Why This Impresses Recruiters & International Clients

Most frontend developers build sorting visualizers with DOM `<div>` bars that suffer from layout thrashing and DOM reflow penalties at large array sizes.

This project demonstrates deep computational engineering:
1. **60FPS Hardware-Accelerated Canvas Rendering:** Uses raw `HTML5 Canvas 2D Context` with High-DPR scaling (`window.devicePixelRatio`) to draw hundreds of array bars without triggering browser DOM layout recalculations.
2. **Audio-Frequency Synthesis (Web Audio DSP):** Uses the browser's native `AudioContext` to synthesize real-time triangle-wave micro-tones directly mapped to element values ($150\text{Hz} - 850\text{Hz}$) with logarithmic exponential gain decay envelopes.
3. **Real-Time Telemetry Instrumentation:** Live instrumentation measures exact **Comparisons**, **Array Accesses / Swaps**, and **Execution Latency** in seconds.
4. **Dynamic Big-O Complexity Profiling:** Instant visual readout of Best, Average, and Worst-case Time Complexities alongside Auxiliary Space and Stability classifications.

---

## 🧮 Algorithm Suite & Complexity Analysis

| Algorithm | Best Time | Average Time | Worst Time | Space Complexity | Stability | Method |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Quick Sort** | $O(n \log n)$ | $O(n \log n)$ | $O(n^2)$ | $O(\log n)$ | ❌ Unstable | In-place Partitioning (Lomuto) |
| **Merge Sort** | $O(n \log n)$ | $O(n \log n)$ | $O(n \log n)$ | $O(n)$ | ✅ Stable | Divide and Conquer |
| **Insertion Sort** | $O(n)$ | $O(n^2)$ | $O(n^2)$ | $O(1)$ | ✅ Stable | Incremental Insertion |
| **Selection Sort** | $O(n^2)$ | $O(n^2)$ | $O(n^2)$ | $O(1)$ | ❌ Unstable | Minimum Selection |
| **Bubble Sort** | $O(n)$ | $O(n^2)$ | $O(n^2)$ | $O(1)$ | ✅ Stable | Adjacent Exchange |

---

## 🛠️ Tech Stack & Key Files

* **[`index.html`](./index.html):** Responsive studio layout, telemetry dashboard, and high-DPI canvas element.
* **[`app.js`](./app.js):** Canvas rendering loop, async sorting algorithms, and Web Audio oscillator tone synthesizer.
* **[`styles.css`](./styles.css):** Cyber-slate glassmorphic theme with glowing status chips.

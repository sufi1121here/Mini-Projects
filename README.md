# Web Platform & Architecture Lab ⚡

While I build large-scale applications using modern frameworks like React and Next.js, this repository serves as my **engineering lab for core web platform fundamentals and browser architecture**. 

Here, I focus on building robust, high-performance applications using **pure Vanilla JavaScript, HTML5, and CSS3**—without relying on heavy frameworks. By building complex features from scratch, I demonstrate a deep understanding of browser APIs, algorithms, state management, and software architecture.

## Core Philosophy & Tech Stack
*   **Vanilla JavaScript (ES6+):** Writing clean, object-oriented, and functional code for advanced logic (e.g., custom parsers, state management).
*   **HTML5 & CSS3:** Emphasizing semantic markup, accessibility (a11y), responsive design, and modern CSS architecture without utility libraries.
*   **Engineering Standards:** Integrating modern tooling like Vite, unit testing (Vitest/Jest), and CI/CD pipelines to ensure code quality even in small projects.

## Key Competencies Demonstrated
International clients and recruiters look for robust engineering beyond just "making it work". This repository showcases:
*   **Web Accessibility (a11y):** Semantic HTML, ARIA roles, and keyboard navigation to meet global accessibility standards (WCAG).
*   **Web Performance:** Optimized DOM manipulation, understanding of the critical rendering path, minimizing repaints/reflows, and using `requestAnimationFrame`.
*   **Modern Browser APIs:** Utilizing LocalStorage, Intersection Observer, Canvas API, and Web Workers.
*   **Security Best Practices:** Avoiding XSS vulnerabilities by sanitizing inputs and completely avoiding dangerous functions like `eval()` (as seen in the Calculator refactor).
*   **Advanced CSS Architecture:** Using CSS Custom Properties (variables) for dark/light theming, CSS Grid/Flexbox, and responsive mobile-first design.

## Showcase Projects

1. **[Simple Calculator](./Simple-Calculator/)**
   * **Core Focus:** Security, Lexical Tokenization & Compiler Precedence Parsing.
   * **Highlights:** Built with a regex lexical tokenizer and two-pass operator precedence parser, completely eliminating security risks associated with `eval()`. Features a live AST DevTools inspector with real-time token stream badges, step-by-step operator precedence execution tracing, precision float normalization, and physical keyboard support.

2. **[Reactive Mini-Framework](./Reactive-Mini-Framework/)**
   * **Core Focus:** Frontend Framework Architecture & Internal Mechanisms.
   * **Highlights:** A custom Virtual DOM library built from scratch (`h()` virtual node creation, recursive tree diffing, and in-place DOM patching), coupled with a reactive `useState()` hook. Eliminates naive `innerHTML = ''` wipes in favor of true node-level DOM reconciliation, featuring a live DevTools VNode inspector panel displaying active in-memory tree nodes, real DOM patch counts, and reconciliation latency telemetry.

3. **[Sorting Algorithm Visualizer](./Sorting-Visualizer/)**
   * **Core Focus:** Algorithmic Complexity, Hardware-Accelerated Rendering & Audio DSP.
   * **Highlights:** High-performance 60FPS visualizer utilizing the HTML5 Canvas API and Web Audio API tone synthesis. Features real-time animated step-throughs of Quick Sort, Merge Sort, Insertion Sort, Selection Sort, and Bubble Sort with live comparison counters, array mutation tracking, and dynamic Big-O complexity profiling.

4. **[Offline Notes App](./Offline-Notes-App/)**
   * **Core Focus:** Client-Side Persistence & Offline-First Engineering.
   * **Highlights:** Powered by native browser **IndexedDB** for asynchronous, transactional data storage. Features a live custom Markdown parser with split-view editing, debounced auto-saving (450ms), tag indexing and filtering, pinning, and JSON/Markdown backup and restore.

5. **[Interactive Kanban Board](./Kanban-Board/)**
   * **Core Focus:** Native Drag and Drop Physics & Multi-Dimensional State Synchronization.
   * **Highlights:** Built with native HTML5 Drag and Drop events (`dragstart`, `dragover`, `drop`) without third-party libraries. Features real-time viewport bounding calculations (`getBoundingClientRect`) to determine card insertion indices, priority tagging, and localStorage persistence.

6. **[Web Audio Studio](./Web-Audio-Synth/)**
   * **Core Focus:** Digital Signal Processing (DSP) & Real-Time Audio Clock Synchronization.
   * **Highlights:** Built with the HTML5 Web Audio API (`AudioContext`). Features procedural mathematical drum synthesis (zero external MP3s), Chris Wilson's lookahead clock scheduler for drift-free rhythm sequencing, an interactive piano synthesizer with ADSR envelopes, and a real-time Canvas oscilloscope.




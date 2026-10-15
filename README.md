# Advanced Mini-Projects Playground

While I build large-scale applications using modern frameworks like React and Next.js, this repository serves as my **engineering playground for core web fundamentals**. 

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
   * **Core Focus:** Security & Mathematical Parsing.
   * **Highlights:** Built with an AST-like expression tokenizer and recursive-descent/shunting-yard parser, completely eliminating security risks associated with `eval()`. Features keyboard accessibility and a sleek dark theme.

2. **[Reactive Mini-Framework](./Reactive-Mini-Framework/)**
   * **Core Focus:** Frontend Framework Architecture & Internal Mechanisms.
   * **Highlights:** A custom Virtual DOM library built from scratch (`h()` virtual node creation, reconciliation diffing, DOM patching), coupled with a reactive `useState()` hook. Demonstrates deep understanding of React/Vue internals.

3. **[Sorting Algorithm Visualizer](./Sorting-Visualizer/)**
   * **Core Focus:** Algorithmic Complexity & Hardware-Accelerated Rendering.
   * **Highlights:** High-performance 60FPS visualizer utilizing the HTML5 Canvas API rather than sluggish DOM nodes. Features real-time animated step-throughs of Bubble Sort, Insertion Sort, and Quick Sort with dynamic speed and array size controls.

4. **[Offline Notes App](./Offline-Notes-App/)**
   * **Core Focus:** Client-Side Persistence & Offline-First Engineering.
   * **Highlights:** Powered by native browser **IndexedDB** for asynchronous, transactional data storage. Features a live custom Markdown parser with split-view editing, debounced auto-saving (450ms), tag indexing and filtering, pinning, and JSON/Markdown backup and restore.

5. **[Interactive Kanban Board](./Kanban-Board/)**
   * **Core Focus:** Native Drag and Drop Physics & Multi-Dimensional State Synchronization.
   * **Highlights:** Built with native HTML5 Drag and Drop events (`dragstart`, `dragover`, `drop`) without third-party libraries. Features real-time viewport bounding calculations (`getBoundingClientRect`) to determine card insertion indices, priority tagging, and localStorage persistence.



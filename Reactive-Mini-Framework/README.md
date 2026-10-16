# Reactive Mini-Framework ⚡

A custom Virtual DOM implementation, reconciliation renderer, and reactive state management engine built from scratch using **pure Vanilla JavaScript**. Includes a real-time **Virtual DOM DevTools Inspector** showing the in-memory VNode tree and DOM patch metrics.

---

## 🌟 Why This Impresses Recruiters & International Clients

Most frontend developers know how to use React, but very few understand **how React actually works under the hood**.

This project proves you understand the internal architecture of modern UI frameworks:
* **The Virtual DOM Concept (`h()`):** Functions as the JSX/compiler target. Converts simple JavaScript invocations into a lightweight in-memory tree of virtual nodes (`{ type, props, children }`).
* **The Reconciliation & DOM Patcher (`render()`):** Recursively traverses the VNode tree, instantiates real HTML DOM elements, registers event handlers with proper closures, and appends them to the root container.
* **Closure-Based Reactivity (`useState()`):** Implements an internal component instance cursor that maintains state variables across render cycles and triggers automatic re-renders on mutation.
* **Live VDOM DevTools Inspector:** Displays real-time telemetry including render cycles, active VNodes count, DOM patch latency in milliseconds, and a syntax-highlighted in-memory VNode JSON tree.

---

## 🚀 Key Modules

* **[`framework.js`](./framework.js):**
  * `h(type, props, ...children)`: VNode factory function.
  * `render(vnode, container)`: Recursive Virtual DOM ➔ Real DOM compiler.
  * `useState(initialValue)`: State hook with functional update support (`setState(prev => prev + 1)`).
  * `mount(Component, container, onUpdate)`: Application lifecycle coordinator with render telemetry hooks.
* **[`app.js`](./app.js):**
  * Sample reactive application demonstrating stateful list operations (adding, toggling, deleting tasks).
  * Real-time VDOM tree serializer and syntax highlighter for the inspector panel.
* **[`styles.css`](./styles.css):**
  * Dark glassmorphic developer studio layout with responsive split-screen viewing.

---

## 🛠️ Tech Stack

* **Language:** Pure Vanilla JavaScript (ES6+ Modules)
* **Architecture:** Virtual DOM, Unidirectional Data Flow, Reactive Hooks
* **Styling:** Custom CSS3 with CSS Custom Properties and Glassmorphism

# Reactive Mini-Framework ⚡

A custom Virtual DOM implementation, reconciliation renderer, and reactive state management engine built from scratch using **pure Vanilla JavaScript**. Includes a real-time **Virtual DOM DevTools Inspector** showing the in-memory VNode tree and DOM patch metrics.

---

## 🌟 Why This Impresses Recruiters & International Clients

Most frontend developers know how to use React, but very few understand **how React actually works under the hood**.

This project proves you understand the internal architecture of modern UI frameworks:
* **The Virtual DOM Concept (`h()`):** Functions as the JSX/compiler target. Converts simple JavaScript invocations into a lightweight in-memory tree of virtual nodes (`{ type, props, children }`).
* **True Recursive Tree Diffing (`diff()`):** Replaces naive `innerHTML = ''` DOM recreation with an in-place tree diffing algorithm. It recursively compares `oldVNode` vs `newVNode`, updates text nodes directly via `nodeValue`, patches mutated attributes, and adds/removes elements at exact child indices.
* **Fine-Grained Prop & Event Patcher (`patchProps()`):** Diffs previous properties against incoming properties, manages DOM listener closures, and maintains controlled input values/focus.
* **Closure-Based Reactivity (`useState()`):** Implements an internal component instance cursor that maintains state variables across render cycles and triggers automatic re-renders on mutation.
* **Live VDOM DevTools Inspector:** Displays real-time telemetry including render cycles, active VNodes count, DOM patch latency, exact real DOM mutation count, and a syntax-highlighted in-memory VNode JSON tree.

---

## 🚀 Key Modules

* **[`framework.js`](./framework.js):**
  * `h(type, props, ...children)`: VNode factory function.
  * `createRealNode(vnode)`: Real HTML DOM node generator.
  * `patchProps(element, oldProps, newProps)`: In-place attribute and event patcher.
  * `diff(parent, oldVNode, newVNode, index)`: Recursive tree reconciliation engine.
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

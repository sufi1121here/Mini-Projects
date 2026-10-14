# Offline Notes App 💾

A production-grade, offline-first Markdown notes application powered by **pure Vanilla JavaScript** and the browser's native **IndexedDB API**.

---

## 🌟 Why This Impresses Recruiters & International Clients

Most frontend developers rely on `localStorage` for simple persistence. However, `localStorage` has critical flaws:
* It is **synchronous and blocks the main thread**, causing UI jank when handling large payloads.
* It is **capped at ~5MB**.
* It can only store serialized string values.

This project showcases mastery over **IndexedDB**, the standard enterprise-grade client-side database:
* **Transactional integrity:** Uses `readonly` and `readwrite` transactions to guarantee data consistency.
* **Asynchronous performance:** Zero UI freezing while querying or saving large note collections.
* **Indexes & Querying:** Demonstrates object stores and indexed queries by timestamp, tags, and pinned state.
* **Resilient Offline Architecture:** Works completely independent of internet connection.

---

## 🚀 Key Features

* **IndexedDB Engine (`db.js`):** Lightweight, promise-based wrapper around `IDBDatabase` and `IDBTransaction`.
* **Live Markdown Parser:** Custom, lightweight, and XSS-safe markdown renderer supporting headings, lists, task checklists (`- [ ]`), code blocks, blockquotes, and links.
* **Debounced Auto-Save:** Commits edits 450ms after typing pauses, with a live visual save indicator.
* **Multi-View Workspace:** Toggle between Editor Only, Split Screen, and Live Preview modes.
* **Categorization & Filtering:** Tag system (`#ideas`, `#work`, etc.) with dynamic filter pills and instant full-text search.
* **Pinning & Reordering:** Pin critical notes to the top of your list.
* **Data Portability:** Export notes as individual `.md` files, or backup and restore your entire collection as `.json`.
* **Network Status Sensing:** Uses `navigator.onLine` and event listeners to show real-time connectivity status.

---

## 🛠️ Tech Stack

* **Language:** Vanilla JavaScript (ES6+)
* **Database:** Native HTML5 IndexedDB API
* **Styling:** Custom CSS3 with Glassmorphism, CSS Custom Properties, and responsive flex/grid
* **Markup:** Semantic HTML5 with accessibility roles

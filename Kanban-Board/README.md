# Interactive Kanban Studio 📋

A high-performance, interactive Kanban board built with **pure Vanilla JavaScript**, demonstrating mastery over the browser's native **HTML5 Drag and Drop API (`DragEvent`)**, DOM geometry calculations, and state synchronization.

---

## 🌟 Why This Impresses Recruiters & International Clients

Most junior and mid-level frontend developers rely heavily on bulky external npm libraries like `react-beautiful-dnd` or `sortablejs` just to achieve basic drag-and-drop.

This project implements the drag-and-drop physics and list-reordering engine **entirely from scratch using native Web APIs**:
* **Native HTML5 Drag & Drop Lifecycle:** Complete orchestration of `dragstart`, `dragover`, `dragleave`, `drop`, and `dragend` events.
* **Viewport Geometry Math (`getDragAfterElement`):** Uses `element.getBoundingClientRect()` and `e.clientY` to calculate exact vertical offsets and render real-time insertion indicator lines.
* **Complex Multi-Dimensional State Management:** Seamlessly reorganizes tasks within the same column or transfers them across columns while maintaining index integrity.
* **Zero Dependencies:** Pure HTML5, CSS3, and ES6+ JavaScript.

---

## 🚀 Key Features

* **Multi-Column Workflow:** 4 standard Kanban lifecycle columns: **To Do**, **In Progress**, **Review**, and **Done**.
* **Real-time Drag Feedback:** 
  * Dragging card opacity and rotation physics.
  * Glowing dynamic insertion line indicating exact drop position.
  * Frosted column container highlights on hover.
* **Task Management (CRUD):** Add, edit, label, prioritize (`Low`, `Medium`, `High`), and delete tasks via an accessible modal dialog.
* **Column Stats & Metrics:** Live counters per column, total board tasks, and completion metrics.
* **Data Persistence:** Automatic synchronization to `localStorage` with initial engineering-themed sample data.
* **Clean Actions:** One-click "Clear Done" and "Reset Board" shortcuts.

---

## 🛠️ Tech Stack

* **Language:** Pure Vanilla JavaScript (ES6+)
* **APIs:** HTML5 Drag and Drop API (`DragEvent`, `DataTransfer`), Web Storage API (`localStorage`)
* **Styling:** Custom CSS3 with CSS Custom Properties, Glassmorphism, and Flexbox/Grid
* **Markup:** Semantic HTML5 with ARIA roles

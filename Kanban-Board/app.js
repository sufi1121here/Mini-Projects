// ==========================================================
// Interactive Kanban Studio - Pure Vanilla JS Engine
// Demonstrates HTML5 Drag and Drop API & Dynamic DOM Physics
// ==========================================================

const STORAGE_KEY = 'kanban_board_tasks_v1';

// --- Default Sample Data (High-tech Engineering Tasks) ---
const DEFAULT_TASKS = [
    {
        id: 'task-1',
        title: 'Replace eval() with AST parser',
        description: 'Prevent code injection vulnerabilities in mathematical expression evaluator.',
        priority: 'high',
        column: 'done',
        tags: ['security', 'algorithms'],
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
        id: 'task-2',
        title: 'Virtual DOM Diffing & Reconciliation',
        description: 'Implement recursive tree comparison with key-based element preservation.',
        priority: 'high',
        column: 'done',
        tags: ['architecture', 'vdom'],
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
        id: 'task-3',
        title: 'Hardware-accelerated Canvas 60FPS',
        description: 'Optimize sorting visualizer redraw loop with requestAnimationFrame and double buffering.',
        priority: 'medium',
        column: 'review',
        tags: ['canvas', 'performance'],
        createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
        id: 'task-4',
        title: 'Transactional IndexedDB client store',
        description: 'Wrap IndexedDB transactions in clean ES6 Promises with fallback window exposure.',
        priority: 'medium',
        column: 'in-progress',
        tags: ['storage', 'offline-first'],
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
        id: 'task-5',
        title: 'HTML5 Drag & Drop physics engine',
        description: 'Calculate vertical bounding rect offsets to determine realtime card insertion index.',
        priority: 'high',
        column: 'in-progress',
        tags: ['drag-and-drop', 'physics'],
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
        id: 'task-6',
        title: 'Synthesizer Web Audio API nodes',
        description: 'Schedule oscillator waveforms and frequency envelopes with lookahead scheduler.',
        priority: 'low',
        column: 'todo',
        tags: ['web-audio', 'dsp'],
        createdAt: new Date().toISOString()
    },
    {
        id: 'task-7',
        title: 'WCAG 2.1 AAA Accessibility audit',
        description: 'Add ARIA live regions, focus trapping in modal dialogs, and keyboard navigation.',
        priority: 'medium',
        column: 'todo',
        tags: ['a11y', 'compliance'],
        createdAt: new Date().toISOString()
    }
];

// --- Application State ---
let tasks = [];
let draggingCardId = null;

// --- DOM Elements ---
const boardColumnsEl = document.getElementById('boardColumns');
const containers = document.querySelectorAll('.cards-container');
const metricTotalEl = document.getElementById('metricTotal');
const metricDoneEl = document.getElementById('metricDone');

const taskModalEl = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const modalTitle = document.getElementById('modalTitle');
const taskIdInput = document.getElementById('taskId');
const taskColumnInput = document.getElementById('taskColumn');
const taskTitleInput = document.getElementById('taskTitleInput');
const taskDescInput = document.getElementById('taskDescInput');
const taskPriorityInput = document.getElementById('taskPriorityInput');
const taskColumnSelect = document.getElementById('taskColumnSelect');
const taskTagsInput = document.getElementById('taskTagsInput');

const btnOpenAddModal = document.getElementById('btnOpenAddModal');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnCancelModal = document.getElementById('btnCancelModal');
const btnClearDone = document.getElementById('btnClearDone');
const btnResetBoard = document.getElementById('btnResetBoard');

// ==========================================
// 1. Persistence & Data Operations
// ==========================================

function loadTasks() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            tasks = JSON.parse(stored);
        } else {
            tasks = [...DEFAULT_TASKS];
            saveTasks();
        }
    } catch (e) {
        console.error('Failed to load tasks from localStorage:', e);
        tasks = [...DEFAULT_TASKS];
    }
}

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
        console.error('Failed to save tasks to localStorage:', e);
    }
}

// ==========================================
// 2. Rendering the Board & Metrics
// ==========================================

function renderBoard() {
    const columns = ['todo', 'in-progress', 'review', 'done'];

    columns.forEach(colId => {
        const container = document.querySelector(`.cards-container[data-column-id="${colId}"]`);
        const countBadge = document.getElementById(`count-${colId}`);
        const colTasks = tasks.filter(t => t.column === colId);

        if (countBadge) {
            countBadge.textContent = colTasks.length;
        }

        container.innerHTML = '';

        if (colTasks.length === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'empty-placeholder';
            emptyEl.textContent = 'Drop tasks here';
            container.appendChild(emptyEl);
        } else {
            colTasks.forEach(task => {
                const cardEl = createCardElement(task);
                container.appendChild(cardEl);
            });
        }
    });

    // Update Header Metrics
    metricTotalEl.textContent = tasks.length;
    metricDoneEl.textContent = tasks.filter(t => t.column === 'done').length;
}

function createCardElement(task) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.setAttribute('draggable', 'true');
    card.setAttribute('role', 'listitem');
    card.dataset.id = task.id;

    // Tags HTML
    const tagsHtml = (task.tags || []).map(tag => 
        `<span class="card-tag">#${escapeHTML(tag)}</span>`
    ).join('');

    const formattedDate = formatDate(task.createdAt);

    card.innerHTML = `
        <div class="card-top">
            <span class="card-priority priority-${task.priority}">${task.priority}</span>
            <div class="card-actions">
                <button class="card-btn btn-edit" title="Edit task" aria-label="Edit task">✏️</button>
                <button class="card-btn btn-delete" title="Delete task" aria-label="Delete task">🗑️</button>
            </div>
        </div>
        <h4 class="card-title">${escapeHTML(task.title)}</h4>
        ${task.description ? `<p class="card-desc">${escapeHTML(task.description)}</p>` : ''}
        <div class="card-footer">
            <div class="card-tags">${tagsHtml}</div>
            <span class="card-date">${formattedDate}</span>
        </div>
    `;

    // Card Action Events
    card.querySelector('.btn-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(task.id);
    });

    card.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(task.id);
    });

    // --- HTML5 Drag Events on Card ---
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);

    return card;
}

function escapeHTML(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function formatDate(isoStr) {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ==========================================
// 3. HTML5 Drag and Drop Engine
// ==========================================

function handleDragStart(e) {
    draggingCardId = this.dataset.id;
    this.classList.add('is-dragging');

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggingCardId);

    // Subtle async delay so drag ghost looks normal before opacity reduction
    setTimeout(() => {
        if (this) this.style.opacity = '0.35';
    }, 0);
}

function handleDragEnd() {
    this.classList.remove('is-dragging');
    this.style.opacity = '';
    draggingCardId = null;

    // Remove all drop highlights and indicators
    document.querySelectorAll('.column').forEach(col => col.classList.remove('drag-over-column'));
    removeDropIndicator();
}

/**
 * Calculates which sibling element is directly after the mouse position (clientY).
 * Core algorithm for fluid list reordering!
 * @param {HTMLElement} container - The column card container
 * @param {number} y - Mouse clientY
 * @returns {HTMLElement|null} The closest element below the cursor
 */
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.kanban-card:not(.is-dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        // Offset: Distance between cursor and center of the child card
        const offset = y - box.top - box.height / 2;

        // If offset < 0, mouse is above the center of this child
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Indicator element to show insertion line
let dropIndicator = null;
function getOrCreateDropIndicator() {
    if (!dropIndicator) {
        dropIndicator = document.createElement('div');
        dropIndicator.className = 'drop-indicator';
    }
    return dropIndicator;
}

function removeDropIndicator() {
    if (dropIndicator && dropIndicator.parentNode) {
        dropIndicator.parentNode.removeChild(dropIndicator);
    }
}

// Attach Drag & Drop Listeners to all column containers
containers.forEach(container => {
    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const column = container.closest('.column');
        if (column) column.classList.add('drag-over-column');

        // Remove empty placeholder when hovering with a card
        const placeholder = container.querySelector('.empty-placeholder');
        if (placeholder) placeholder.style.display = 'none';

        const afterElement = getDragAfterElement(container, e.clientY);
        const indicator = getOrCreateDropIndicator();

        if (afterElement == null) {
            container.appendChild(indicator);
        } else {
            container.insertBefore(indicator, afterElement);
        }
    });

    container.addEventListener('dragleave', (e) => {
        // Only trigger if leaving the container itself, not child elements
        if (!container.contains(e.relatedTarget)) {
            const column = container.closest('.column');
            if (column) column.classList.remove('drag-over-column');
            removeDropIndicator();

            const placeholder = container.querySelector('.empty-placeholder');
            if (placeholder) placeholder.style.display = 'flex';
        }
    });

    container.addEventListener('drop', (e) => {
        e.preventDefault();
        const column = container.closest('.column');
        if (column) column.classList.remove('drag-over-column');

        const cardId = e.dataTransfer.getData('text/plain') || draggingCardId;
        if (!cardId) return;

        const targetColumnId = container.dataset.columnId;
        const afterElement = getDragAfterElement(container, e.clientY);

        moveTask(cardId, targetColumnId, afterElement ? afterElement.dataset.id : null);
        removeDropIndicator();
    });
});

/**
 * Updates the state when a task is moved to a new column or reordered.
 */
function moveTask(taskId, targetColumnId, afterTaskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    // Extract task
    const [task] = tasks.splice(taskIndex, 1);
    task.column = targetColumnId;

    if (afterTaskId) {
        const afterIndex = tasks.findIndex(t => t.id === afterTaskId);
        if (afterIndex !== -1) {
            tasks.splice(afterIndex, 0, task);
        } else {
            tasks.push(task);
        }
    } else {
        // Insert at the end of the column group
        const lastColIndex = tasks.map(t => t.column).lastIndexOf(targetColumnId);
        if (lastColIndex !== -1) {
            tasks.splice(lastColIndex + 1, 0, task);
        } else {
            tasks.push(task);
        }
    }

    saveTasks();
    renderBoard();
}

// ==========================================
// 4. Modal & Task CRUD Operations
// ==========================================

function openCreateModal(column = 'todo') {
    modalTitle.textContent = 'Create New Task';
    taskIdInput.value = '';
    taskColumnInput.value = column;
    taskColumnSelect.value = column;
    taskTitleInput.value = '';
    taskDescInput.value = '';
    taskPriorityInput.value = 'medium';
    taskTagsInput.value = '';

    taskModalEl.style.display = 'flex';
    taskTitleInput.focus();
}

function openEditModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    modalTitle.textContent = 'Edit Task';
    taskIdInput.value = task.id;
    taskColumnInput.value = task.column;
    taskColumnSelect.value = task.column;
    taskTitleInput.value = task.title;
    taskDescInput.value = task.description || '';
    taskPriorityInput.value = task.priority || 'medium';
    taskTagsInput.value = (task.tags || []).join(', ');

    taskModalEl.style.display = 'flex';
    taskTitleInput.focus();
}

function closeModal() {
    taskModalEl.style.display = 'none';
}

function handleFormSubmit(e) {
    e.preventDefault();

    const title = taskTitleInput.value.trim();
    if (!title) return;

    const id = taskIdInput.value;
    const column = taskColumnSelect.value;
    const description = taskDescInput.value.trim();
    const priority = taskPriorityInput.value;
    const rawTags = taskTagsInput.value
        .split(',')
        .map(t => t.trim().replace(/^#/, ''))
        .filter(Boolean);

    if (id) {
        // Update existing task
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.title = title;
            task.description = description;
            task.priority = priority;
            task.column = column;
            task.tags = Array.from(new Set(rawTags));
        }
    } else {
        // Create new task
        const newTask = {
            id: 'task-' + Date.now(),
            title: title,
            description: description,
            priority: priority,
            column: column,
            tags: Array.from(new Set(rawTags)),
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
    }

    saveTasks();
    renderBoard();
    closeModal();
}

function deleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (confirm(`Delete "${task.title}"?`)) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderBoard();
    }
}

function clearDoneTasks() {
    const doneCount = tasks.filter(t => t.column === 'done').length;
    if (doneCount === 0) {
        alert('There are no tasks in the Done column to clear.');
        return;
    }

    if (confirm(`Clear all ${doneCount} completed task(s) from the board?`)) {
        tasks = tasks.filter(t => t.column !== 'done');
        saveTasks();
        renderBoard();
    }
}

function resetBoard() {
    if (confirm('Reset the board to default engineering sample tasks?')) {
        tasks = [...DEFAULT_TASKS];
        saveTasks();
        renderBoard();
    }
}

// ==========================================
// 5. Global Event Listeners & Boot
// ==========================================

btnOpenAddModal.addEventListener('click', () => openCreateModal('todo'));
btnCloseModal.addEventListener('click', closeModal);
btnCancelModal.addEventListener('click', closeModal);
taskForm.addEventListener('submit', handleFormSubmit);

btnClearDone.addEventListener('click', clearDoneTasks);
btnResetBoard.addEventListener('click', resetBoard);

// Column "+" quick add buttons
document.querySelectorAll('.btn-col-add').forEach(btn => {
    btn.addEventListener('click', () => {
        const col = btn.dataset.column;
        openCreateModal(col);
    });
});

// Close modal when clicking outside
taskModalEl.addEventListener('click', (e) => {
    if (e.target === taskModalEl) closeModal();
});

// Keyboard shortcut: Escape to close modal
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && taskModalEl.style.display === 'flex') {
        closeModal();
    }
});

// Boot application
loadTasks();
renderBoard();

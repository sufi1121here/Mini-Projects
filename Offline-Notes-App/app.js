// ==========================================================
// Offline Notes App - Client Architecture & Logic
// Powered by IndexedDB and Custom Markdown Engine
// ==========================================================

// Ensure NotesDB is available
const db = window.NotesDB;

// --- Application State ---
let notes = [];
let currentNoteId = null;
let activeTag = 'ALL';
let searchQuery = '';
let currentViewMode = 'edit'; // 'edit' | 'split' | 'preview'
let autoSaveTimer = null;

// --- DOM References ---
const notesListEl = document.getElementById('notesList');
const notesCountEl = document.getElementById('notesCount');
const tagFiltersEl = document.getElementById('tagFilters');
const searchInput = document.getElementById('searchInput');
const btnClearSearch = document.getElementById('btnClearSearch');

const emptyStateEl = document.getElementById('emptyState');
const noteWorkspaceEl = document.getElementById('noteWorkspace');
const editorContainer = document.getElementById('editorContainer');

const noteTitleInput = document.getElementById('noteTitle');
const noteTagsInput = document.getElementById('noteTags');
const noteContentInput = document.getElementById('noteContent');
const markdownPreview = document.getElementById('markdownPreview');
const btnTogglePin = document.getElementById('btnTogglePin');

const saveStatusEl = document.getElementById('saveStatus');
const lastEditedText = document.getElementById('lastEditedText');
const wordCountEl = document.getElementById('wordCount');
const charCountEl = document.getElementById('charCount');
const readTimeEl = document.getElementById('readTime');

const networkStatusEl = document.getElementById('networkStatus');
const networkTextEl = document.getElementById('networkText');

const btnNewNote = document.getElementById('btnNewNote');
const btnEmptyNewNote = document.getElementById('btnEmptyNewNote');
const btnDeleteNote = document.getElementById('btnDeleteNote');
const btnDownloadMd = document.getElementById('btnDownloadMd');
const btnExportAll = document.getElementById('btnExportAll');
const btnImport = document.getElementById('btnImport');
const fileImport = document.getElementById('fileImport');
const viewButtons = document.querySelectorAll('.btn-view');

// ==========================================
// 1. Markdown Parsing Engine (Vanilla JS)
// ==========================================

function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function parseMarkdown(md) {
    if (!md) return '<p class="text-muted"><em>Nothing to preview...</em></p>';

    let html = escapeHTML(md);

    // Code blocks with syntax box
    html = html.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/gim, (match, lang, code) => {
        return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headings (# to ####)
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Horizontal Rules
    html = html.replace(/^(?:---|\*\*\*|___)$/gim, '<hr>');

    // Blockquotes
    html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Checklists (- [ ] or - [x])
    html = html.replace(/^- \[x\] (.*$)/gim, '<li class="checklist-item done"><input type="checkbox" checked disabled> <span>$1</span></li>');
    html = html.replace(/^- \[ \] (.*$)/gim, '<li class="checklist-item"><input type="checkbox" disabled> <span>$1</span></li>');

    // Bold & Italics
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Unordered lists (- or *)
    html = html.replace(/^[*-] (.*$)/gim, '<li>$1</li>');

    // Group adjacent <li> into <ul>
    html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, ''); // Merge consecutive <ul> tags

    // Paragraphs (lines separated by double newline)
    const lines = html.split(/\n\n+/);
    html = lines.map(block => {
        const trimmed = block.trim();
        if (/^<(h[1-4]|pre|ul|ol|blockquote|hr)/i.test(trimmed)) {
            return trimmed;
        }
        return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');

    return html;
}

// ==========================================
// 2. Metrics & Status Counters
// ==========================================

function updateMetrics(content = '') {
    const text = content.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = content.length;
    const minutes = Math.ceil(words / 200);

    wordCountEl.textContent = `${words} word${words === 1 ? '' : 's'}`;
    charCountEl.textContent = `${chars} character${chars === 1 ? '' : 's'}`;
    readTimeEl.textContent = `${minutes} min read`;
}

function setSaveStatus(state, message) {
    if (state === 'saving') {
        saveStatusEl.className = 'save-status saving';
        saveStatusEl.innerHTML = '<span class="save-icon">⏳</span><span class="save-text">Saving...</span>';
    } else {
        saveStatusEl.className = 'save-status';
        saveStatusEl.innerHTML = `<span class="save-icon">✓</span><span class="save-text">${message || 'Saved'}</span>`;
    }
}

// ==========================================
// 3. UI Rendering: Sidebar & Tags
// ==========================================

function renderTagFilters() {
    // Extract all unique tags
    const allTags = new Set();
    notes.forEach(note => {
        if (Array.isArray(note.tags)) {
            note.tags.forEach(t => allTags.add(t.toLowerCase()));
        }
    });

    tagFiltersEl.innerHTML = '';

    // 'All' button
    const allBtn = document.createElement('button');
    allBtn.className = `tag-pill ${activeTag === 'ALL' ? 'active' : ''}`;
    allBtn.textContent = `All (${notes.length})`;
    allBtn.addEventListener('click', () => {
        activeTag = 'ALL';
        renderTagFilters();
        renderNotesList();
    });
    tagFiltersEl.appendChild(allBtn);

    // Tag pills
    allTags.forEach(tag => {
        const count = notes.filter(n => n.tags && n.tags.map(t => t.toLowerCase()).includes(tag)).length;
        const btn = document.createElement('button');
        btn.className = `tag-pill ${activeTag === tag ? 'active' : ''}`;
        btn.textContent = `#${tag} (${count})`;
        btn.addEventListener('click', () => {
            activeTag = tag;
            renderTagFilters();
            renderNotesList();
        });
        tagFiltersEl.appendChild(btn);
    });
}

function getFilteredNotes() {
    return notes.filter(note => {
        // Tag matching
        if (activeTag !== 'ALL') {
            const hasTag = note.tags && note.tags.some(t => t.toLowerCase() === activeTag);
            if (!hasTag) return false;
        }

        // Search query matching
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const inTitle = (note.title || '').toLowerCase().includes(query);
            const inContent = (note.content || '').toLowerCase().includes(query);
            const inTags = (note.tags || []).some(t => t.toLowerCase().includes(query));
            if (!inTitle && !inContent && !inTags) return false;
        }

        return true;
    });
}

function renderNotesList() {
    const filteredNotes = getFilteredNotes();
    notesCountEl.textContent = `${filteredNotes.length} note${filteredNotes.length === 1 ? '' : 's'}`;

    notesListEl.innerHTML = '';

    if (filteredNotes.length === 0) {
        notesListEl.innerHTML = `
            <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); font-size: 0.85rem;">
                No matching notes found.
            </div>
        `;
        return;
    }

    filteredNotes.forEach(note => {
        const item = document.createElement('div');
        item.className = `note-item ${note.id === currentNoteId ? 'active' : ''}`;
        item.setAttribute('role', 'listitem');
        item.dataset.id = note.id;

        const date = new Date(note.updatedAt || note.createdAt || Date.now());
        const timeAgo = formatTimeAgo(date);

        // Tags HTML
        const tagsHtml = (note.tags || []).slice(0, 3).map(tag => 
            `<span class="badge-tag">#${escapeHTML(tag)}</span>`
        ).join('');

        const previewSnippet = (note.content || '').replace(/[#*`_>~-]/g, '').trim() || 'No additional text...';

        item.innerHTML = `
            <div class="note-item-header">
                <span class="note-item-title">${escapeHTML(note.title || 'Untitled Note')}</span>
                ${note.pinned ? '<span class="note-item-pin" title="Pinned">📌</span>' : ''}
            </div>
            <div class="note-item-preview">${escapeHTML(previewSnippet)}</div>
            <div class="note-item-footer">
                <span>${timeAgo}</span>
                <div class="note-item-tags">${tagsHtml}</div>
            </div>
        `;

        item.addEventListener('click', () => selectNote(note.id));
        notesListEl.appendChild(item);
    });
}

function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ==========================================
// 4. Note Workspace & Editor Operations
// ==========================================

async function selectNote(id) {
    currentNoteId = id;
    const note = notes.find(n => n.id === id);

    if (!note) {
        showEmptyState();
        return;
    }

    // Hide empty state, show workspace
    emptyStateEl.style.display = 'none';
    noteWorkspaceEl.style.display = 'flex';

    // Populate fields
    noteTitleInput.value = note.title || '';
    noteTagsInput.value = (note.tags || []).join(', ');
    noteContentInput.value = note.content || '';

    // Update Pin toggle button state
    btnTogglePin.classList.toggle('active', Boolean(note.pinned));
    btnTogglePin.title = note.pinned ? 'Unpin note' : 'Pin note to top';

    // Update Markdown Preview
    markdownPreview.innerHTML = parseMarkdown(note.content);

    // Update Metrics
    updateMetrics(note.content);

    // Update status bar
    const date = new Date(note.updatedAt || Date.now());
    lastEditedText.textContent = `Updated ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    setSaveStatus('saved', 'Ready');

    // Update active highlight in sidebar list
    renderNotesList();
}

function showEmptyState() {
    currentNoteId = null;
    emptyStateEl.style.display = 'flex';
    noteWorkspaceEl.style.display = 'none';
    renderNotesList();
}

// ==========================================
// 5. Debounced Auto-Save
// ==========================================

function triggerAutoSave() {
    if (!currentNoteId) return;

    setSaveStatus('saving');

    // Live update preview while typing
    markdownPreview.innerHTML = parseMarkdown(noteContentInput.value);
    updateMetrics(noteContentInput.value);

    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(async () => {
        await commitSave();
    }, 450); // 450ms debounce
}

async function commitSave() {
    if (!currentNoteId) return;

    const existing = notes.find(n => n.id === currentNoteId);
    if (!existing) return;

    const rawTags = noteTagsInput.value
        .split(',')
        .map(t => t.trim().replace(/^#/, ''))
        .filter(Boolean);

    const updatedNote = {
        ...existing,
        title: noteTitleInput.value.trim() || 'Untitled Note',
        content: noteContentInput.value,
        tags: Array.from(new Set(rawTags)), // deduplicate
        updatedAt: new Date().toISOString()
    };

    try {
        const saved = await db.saveNote(updatedNote);

        // Update in-memory notes array
        const index = notes.findIndex(n => n.id === currentNoteId);
        if (index !== -1) {
            notes[index] = saved;
        }

        // Re-sort: Pinned first, then newest updatedAt
        notes.sort((a, b) => {
            if (b.pinned !== a.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });

        renderNotesList();
        renderTagFilters();

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setSaveStatus('saved', `Saved at ${time}`);
        lastEditedText.textContent = `Updated just now`;
    } catch (err) {
        console.error('Failed to auto-save note:', err);
        setSaveStatus('error', 'Save error');
    }
}

// ==========================================
// 6. Note Actions: Create, Delete, Pin, Export
// ==========================================

async function createNewNote() {
    const newNote = {
        title: '',
        content: '',
        tags: activeTag !== 'ALL' ? [activeTag] : [],
        pinned: false
    };

    const saved = await db.saveNote(newNote);
    notes.unshift(saved);
    renderTagFilters();
    await selectNote(saved.id);
    noteTitleInput.focus();
}

async function deleteCurrentNote() {
    if (!currentNoteId) return;

    const note = notes.find(n => n.id === currentNoteId);
    const title = note ? note.title : 'this note';

    if (confirm(`Are you sure you want to delete "${title}"?`)) {
        await db.deleteNote(currentNoteId);
        notes = notes.filter(n => n.id !== currentNoteId);
        renderTagFilters();

        if (notes.length > 0) {
            await selectNote(notes[0].id);
        } else {
            showEmptyState();
        }
    }
}

async function togglePinCurrentNote() {
    if (!currentNoteId) return;

    const note = notes.find(n => n.id === currentNoteId);
    if (!note) return;

    note.pinned = !note.pinned;
    await db.saveNote(note);

    btnTogglePin.classList.toggle('active', Boolean(note.pinned));
    btnTogglePin.title = note.pinned ? 'Unpin note' : 'Pin note to top';

    // Re-sort list
    notes.sort((a, b) => {
        if (b.pinned !== a.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
        return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    renderNotesList();
}

function exportCurrentNoteAsMd() {
    if (!currentNoteId) return;
    const note = notes.find(n => n.id === currentNoteId);
    if (!note) return;

    const title = (note.title || 'untitled').replace(/[/\\?%*:|"<>]/g, '-');
    const content = `# ${note.title || 'Untitled'}\n\n${note.content || ''}`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.md`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportAllNotesAsJson() {
    if (notes.length === 0) {
        alert('No notes to export.');
        return;
    }

    const backupData = {
        exportedAt: new Date().toISOString(),
        version: 1,
        totalNotes: notes.length,
        notes: notes
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `notes_backup_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function handleImportFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const notesToImport = Array.isArray(data) ? data : (data.notes || []);

            if (!Array.isArray(notesToImport) || notesToImport.length === 0) {
                alert('No valid notes found in this JSON file.');
                return;
            }

            const count = await db.importNotes(notesToImport);
            alert(`Successfully imported ${count} notes into IndexedDB!`);

            // Reload notes
            notes = await db.getAllNotes();
            renderTagFilters();
            if (notes.length > 0) {
                await selectNote(notes[0].id);
            }
        } catch (err) {
            alert('Failed to parse JSON backup file. Error: ' + err.message);
        } finally {
            fileImport.value = '';
        }
    };
    reader.readAsText(file);
}

// ==========================================
// 7. View Mode Controller
// ==========================================

function setViewMode(mode) {
    currentViewMode = mode;
    editorContainer.className = `editor-container mode-${mode}`;

    viewButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    if (mode === 'preview' || mode === 'split') {
        markdownPreview.innerHTML = parseMarkdown(noteContentInput.value);
    }
}

// ==========================================
// 8. Network Status Monitoring
// ==========================================

function updateNetworkStatus() {
    if (navigator.onLine) {
        networkStatusEl.className = 'status-badge status-online';
        networkTextEl.textContent = 'Online';
    } else {
        networkStatusEl.className = 'status-badge status-offline';
        networkTextEl.textContent = 'Offline (Storage Active)';
    }
}

// ==========================================
// 9. Initial Seed: Welcome Note
// ==========================================

const WELCOME_NOTE = {
    title: '👋 Welcome to Offline Notes!',
    tags: ['welcome', 'indexeddb', 'markdown'],
    pinned: true,
    content: `## What makes this app special?

This application is built as an **offline-first, transactional system** using the browser's native **IndexedDB API**.

Unlike \`localStorage\` (which is synchronous, block-rendering, and limited to ~5MB of raw strings), **IndexedDB** is an asynchronous, transactional NoSQL database capable of storing hundreds of megabytes of structured data directly inside your browser.

---

### 🚀 Key Features

- [x] **Pure IndexedDB Engine:** Full transactional persistence without external dependencies.
- [x] **Live Markdown Preview:** Supports headings, bold/italics, code blocks, and checklists.
- [x] **Auto-Save with Debounce:** Commits edits 450ms after typing pauses.
- [x] **Tag System:** Categorize notes with \`#tags\` and filter them dynamically.
- [x] **Pinning:** Keep important notes stuck to the top of your list.
- [x] **Backup & Restore:** Full JSON export/import and single-note \`.md\` export.
- [x] **True Offline Support:** Disconnect from Wi-Fi and keep writing seamlessly!

---

### 📝 Markdown Cheatsheet

\`\`\`javascript
// Example Code Block
function greetUser(name) {
    console.log(\`Hello, \${name}! Your data is saved locally.\`);
}
\`\`\`

> *"Web applications should work reliably regardless of network connectivity."* — Modern Web Principles

Feel free to edit this note, create new ones, or test the search bar in the left sidebar!
`
};

// ==========================================
// 10. Boot & Event Listeners
// ==========================================

async function initApp() {
    try {
        await db.initDB();
        notes = await db.getAllNotes();

        // Seed with welcome note on fresh install
        if (notes.length === 0) {
            const welcome = await db.saveNote(WELCOME_NOTE);
            notes = [welcome];
        }

        renderTagFilters();

        if (notes.length > 0) {
            await selectNote(notes[0].id);
        } else {
            showEmptyState();
        }

        // Network listeners
        updateNetworkStatus();
        window.addEventListener('online', updateNetworkStatus);
        window.addEventListener('offline', updateNetworkStatus);

    } catch (err) {
        console.error('Failed to initialize Offline Notes App:', err);
    }
}

// --- Wire Event Handlers ---

// Auto-save triggers
noteTitleInput.addEventListener('input', triggerAutoSave);
noteTagsInput.addEventListener('input', triggerAutoSave);
noteContentInput.addEventListener('input', triggerAutoSave);

// Handle Tab key inside editor to indent instead of losing focus
noteContentInput.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = noteContentInput.selectionStart;
        const end = noteContentInput.selectionEnd;
        const val = noteContentInput.value;
        noteContentInput.value = val.substring(0, start) + '  ' + val.substring(end);
        noteContentInput.selectionStart = noteContentInput.selectionEnd = start + 2;
        triggerAutoSave();
    }
});

// Creation & deletion
btnNewNote.addEventListener('click', createNewNote);
btnEmptyNewNote.addEventListener('click', createNewNote);
btnDeleteNote.addEventListener('click', deleteCurrentNote);
btnTogglePin.addEventListener('click', togglePinCurrentNote);

// Export & Import
btnDownloadMd.addEventListener('click', exportCurrentNoteAsMd);
btnExportAll.addEventListener('click', exportAllNotesAsJson);
btnImport.addEventListener('click', () => fileImport.click());
fileImport.addEventListener('change', handleImportFile);

// Search
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    btnClearSearch.style.display = searchQuery ? 'block' : 'none';
    renderNotesList();
});

btnClearSearch.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    btnClearSearch.style.display = 'none';
    renderNotesList();
});

// View switchers
viewButtons.forEach(btn => {
    btn.addEventListener('click', () => setViewMode(btn.dataset.mode));
});

// Keyboard shortcut: Ctrl+S / Cmd+S manual save
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        commitSave();
    }
});

// Launch!
initApp();

// ==========================================
// Offline Notes App - IndexedDB Storage Engine
// Transactional, asynchronous browser database wrapper
// ==========================================

const DB_NAME = 'OfflineNotesDB';
const DB_VERSION = 1;
const STORE_NAME = 'notes';

let dbInstance = null;

/**
 * Initializes and opens the IndexedDB database.
 * Sets up the object store and indexes if not already created.
 * @returns {Promise<IDBDatabase>}
 */
function initDB() {
    if (dbInstance) {
        return Promise.resolve(dbInstance);
    }

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('updatedAt', 'updatedAt', { unique: false });
                store.createIndex('pinned', 'pinned', { unique: false });
                store.createIndex('createdAt', 'createdAt', { unique: false });
            }
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            resolve(dbInstance);
        };

        request.onerror = (event) => {
            console.error('IndexedDB Error:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Helper to run a transaction on the notes store.
 * @param {IDBTransactionMode} mode - 'readonly' or 'readwrite'
 * @returns {Promise<{store: IDBObjectStore, transaction: IDBTransaction}>}
 */
async function getStore(mode = 'readonly') {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    return { store, transaction };
}

/**
 * Fetches all notes sorted by pinned status, then by latest update.
 * @returns {Promise<Array<Object>>}
 */
async function getAllNotes() {
    const { store } = await getStore('readonly');

    return new Promise((resolve, reject) => {
        const request = store.getAll();

        request.onsuccess = () => {
            const notes = request.result || [];
            // Sort: Pinned first, then newest updatedAt first
            notes.sort((a, b) => {
                if (b.pinned !== a.pinned) {
                    return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
                }
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            });
            resolve(notes);
        };

        request.onerror = () => reject(request.error);
    });
}

/**
 * Fetches a single note by its ID.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
async function getNoteById(id) {
    const { store } = await getStore('readonly');

    return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Saves or updates a note in IndexedDB.
 * @param {Object} note
 * @returns {Promise<Object>}
 */
async function saveNote(note) {
    const { store, transaction } = await getStore('readwrite');

    const now = new Date().toISOString();
    const noteToSave = {
        id: note.id || 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        title: note.title ? note.title.trim() : 'Untitled Note',
        content: note.content || '',
        tags: Array.isArray(note.tags) ? note.tags : [],
        pinned: Boolean(note.pinned),
        createdAt: note.createdAt || now,
        updatedAt: now
    };

    return new Promise((resolve, reject) => {
        const request = store.put(noteToSave);
        request.onsuccess = () => resolve(noteToSave);
        request.onerror = () => reject(request.error);
        transaction.onerror = () => reject(transaction.error);
    });
}

/**
 * Deletes a note by its ID.
 * @param {string} id
 * @returns {Promise<boolean>}
 */
async function deleteNote(id) {
    const { store, transaction } = await getStore('readwrite');

    return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
        transaction.onerror = () => reject(transaction.error);
    });
}

/**
 * Bulk imports an array of notes into IndexedDB.
 * @param {Array<Object>} notes
 * @returns {Promise<number>} count of imported notes
 */
async function importNotes(notes) {
    if (!Array.isArray(notes) || notes.length === 0) return 0;
    const { store, transaction } = await getStore('readwrite');

    let count = 0;
    return new Promise((resolve, reject) => {
        for (const note of notes) {
            if (note && note.title) {
                store.put({
                    id: note.id || 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                    title: note.title.trim(),
                    content: note.content || '',
                    tags: Array.isArray(note.tags) ? note.tags : [],
                    pinned: Boolean(note.pinned),
                    createdAt: note.createdAt || new Date().toISOString(),
                    updatedAt: note.updatedAt || new Date().toISOString()
                });
                count++;
            }
        }
        transaction.oncomplete = () => resolve(count);
        transaction.onerror = () => reject(transaction.error);
    });
}

// Expose on window for universal script loading
window.NotesDB = {
    initDB,
    getAllNotes,
    getNoteById,
    saveNote,
    deleteNote,
    importNotes
};

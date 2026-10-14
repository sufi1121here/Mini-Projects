// ==========================================
// Sorting Visualizer Engine (Vanilla JS)
// Demonstrates Canvas API and async/await animation
// ==========================================

// --- State & DOM Nodes ---
const canvas = document.getElementById('sortingCanvas');
const ctx = canvas.getContext('2d');

const btnGenerate = document.getElementById('btnGenerate');
const btnSort = document.getElementById('btnSort');
const inputSize = document.getElementById('arraySize');
const inputSpeed = document.getElementById('speed');
const selectAlgo = document.getElementById('algorithm');

let array = [];
let isSorting = false;

// --- Canvas Setup ---
function resizeCanvas() {
    // Make canvas physical pixels match CSS pixels to prevent blur
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    drawArray(); // Redraw if resized
}
window.addEventListener('resize', resizeCanvas);

// --- Array Generation ---
function generateArray() {
    if (isSorting) return;
    const size = parseInt(inputSize.value);
    array = [];
    for (let i = 0; i < size; i++) {
        // Values from 10 to 100 (as a percentage of canvas height)
        array.push(Math.floor(Math.random() * 90) + 10);
    }
    drawArray();
}

// --- Renderer (Canvas API) ---
// We pass active indices (currently being compared) and sorted indices to color them
function drawArray(activeIndices = [], sortedIndices = []) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = canvas.width / array.length;
    
    for (let i = 0; i < array.length; i++) {
        // Calculate height based on percentage of canvas height
        const barHeight = (array[i] / 100) * (canvas.height * 0.9);
        const x = i * barWidth;
        const y = canvas.height - barHeight;
        
        // Colors
        if (sortedIndices.includes(i)) {
            ctx.fillStyle = '#10b981'; // Green (Sorted)
        } else if (activeIndices.includes(i)) {
            ctx.fillStyle = '#ef4444'; // Red (Active/Comparing)
        } else {
            ctx.fillStyle = '#3b82f6'; // Blue (Default)
        }
        
        // Draw Bar (x, y, width, height)
        // Leave a 1px gap between bars if they are thick enough
        const gap = barWidth > 3 ? 1 : 0;
        ctx.fillRect(x, y, barWidth - gap, barHeight);
    }
}

// --- Animation Controller ---
// A Promise that resolves after X milliseconds, allowing the browser to paint
const sleep = () => {
    // Invert speed logic so slider right = fast, left = slow
    const speed = 101 - parseInt(inputSpeed.value);
    return new Promise(resolve => setTimeout(resolve, speed));
};

// --- Algorithms ---

async function bubbleSort() {
    let n = array.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (!isSorting) return; // Allow aborting
            
            drawArray([j, j + 1]);
            await sleep();
            
            if (array[j] > array[j + 1]) {
                // Swap
                let temp = array[j];
                array[j] = array[j + 1];
                array[j + 1] = temp;
                drawArray([j, j + 1]);
                await sleep();
            }
        }
    }
}

async function insertionSort() {
    for (let i = 1; i < array.length; i++) {
        let key = array[i];
        let j = i - 1;
        
        while (j >= 0 && array[j] > key) {
            if (!isSorting) return;
            drawArray([j, j + 1]);
            await sleep();
            
            array[j + 1] = array[j];
            j = j - 1;
            
            drawArray([j + 1, i]);
            await sleep();
        }
        array[j + 1] = key;
    }
}

async function quickSort(start, end) {
    if (start >= end || !isSorting) return;
    
    let index = await partition(start, end);
    await quickSort(start, index - 1);
    await quickSort(index + 1, end);
}

async function partition(start, end) {
    let pivotValue = array[end];
    let pivotIndex = start;
    
    for (let i = start; i < end; i++) {
        if (!isSorting) return;
        drawArray([i, pivotIndex, end]);
        await sleep();
        
        if (array[i] < pivotValue) {
            // Swap
            let temp = array[i];
            array[i] = array[pivotIndex];
            array[pivotIndex] = temp;
            pivotIndex++;
            drawArray([i, pivotIndex]);
            await sleep();
        }
    }
    
    // Swap pivot to final place
    let temp = array[pivotIndex];
    array[pivotIndex] = array[end];
    array[end] = temp;
    return pivotIndex;
}

// --- Main Controller ---
async function startSorting() {
    if (isSorting) return;
    isSorting = true;
    
    // Disable controls during sort
    btnSort.disabled = true;
    btnGenerate.disabled = true;
    inputSize.disabled = true;
    selectAlgo.disabled = true;
    
    const algo = selectAlgo.value;
    
    if (algo === 'bubble') await bubbleSort();
    else if (algo === 'insertion') await insertionSort();
    else if (algo === 'quick') await quickSort(0, array.length - 1);
    
    // Final green sweep to show completion
    if (isSorting) {
        let sorted = [];
        for (let i = 0; i < array.length; i++) {
            sorted.push(i);
            drawArray([], sorted);
            await sleep();
        }
    }
    
    isSorting = false;
    btnSort.disabled = false;
    btnGenerate.disabled = false;
    inputSize.disabled = false;
    selectAlgo.disabled = false;
}

// --- Initialization ---
btnGenerate.addEventListener('click', generateArray);
btnSort.addEventListener('click', startSorting);
inputSize.addEventListener('input', generateArray);

// Initialize canvas and array on boot
setTimeout(() => {
    resizeCanvas();
    generateArray();
}, 100);

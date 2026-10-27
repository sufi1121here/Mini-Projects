// ============================================================================
// Sorting & Algorithm Visualizer Engine
// Features: 60FPS Canvas, Web Audio Tone DSP, Live Telemetry & Big-O Metrics
// ============================================================================

// --- DOM References ---
const canvas = document.getElementById('sortingCanvas');
const ctx = canvas.getContext('2d');

const btnGenerate = document.getElementById('btnGenerate');
const btnSort = document.getElementById('btnSort');
const btnReset = document.getElementById('btnReset');
const btnSound = document.getElementById('btnSound');

const inputSize = document.getElementById('arraySize');
const inputSpeed = document.getElementById('speed');
const selectAlgo = document.getElementById('algorithm');

const lblSize = document.getElementById('lblSize');
const lblSpeed = document.getElementById('lblSpeed');

const metricComparisons = document.getElementById('metricComparisons');
const metricSwaps = document.getElementById('metricSwaps');
const metricTime = document.getElementById('metricTime');
const metricPhase = document.getElementById('metricPhase');
const phaseDot = document.getElementById('phaseDot');

const valBest = document.getElementById('valBest');
const valAvg = document.getElementById('valAvg');
const valWorst = document.getElementById('valWorst');
const valSpace = document.getElementById('valSpace');
const valStability = document.getElementById('valStability');

// --- Big-O Complexity Metadata ---
const ALGO_METADATA = {
    quick: {
        name: 'Quick Sort',
        best: 'O(n log n)',
        avg: 'O(n log n)',
        worst: 'O(n²)',
        space: 'O(log n)',
        stability: 'Unstable'
    },
    merge: {
        name: 'Merge Sort',
        best: 'O(n log n)',
        avg: 'O(n log n)',
        worst: 'O(n log n)',
        space: 'O(n)',
        stability: 'Stable'
    },
    insertion: {
        name: 'Insertion Sort',
        best: 'O(n)',
        avg: 'O(n²)',
        worst: 'O(n²)',
        space: 'O(1)',
        stability: 'Stable'
    },
    selection: {
        name: 'Selection Sort',
        best: 'O(n²)',
        avg: 'O(n²)',
        worst: 'O(n²)',
        space: 'O(1)',
        stability: 'Unstable'
    },
    bubble: {
        name: 'Bubble Sort',
        best: 'O(n)',
        avg: 'O(n²)',
        worst: 'O(n²)',
        space: 'O(1)',
        stability: 'Stable'
    }
};

// --- Live Phase Tracer Helper ---
function setPhase(text, state = 'working') {
    if (metricPhase) metricPhase.textContent = text;
    if (phaseDot) {
        phaseDot.className = 'phase-dot' + (state ? ' ' + state : '');
    }
}

// --- Application State ---
let array = [];
let isSorting = false;
let stopRequested = false;
let comparisons = 0;
let swaps = 0;
let startTime = 0;
let timerInterval = null;

// --- Web Audio API DSP Synthesis ---
let audioCtx = null;
let soundEnabled = true;

function initAudio() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playTone(val, duration = 0.035) {
    if (!soundEnabled || !audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        // Map bar height (10-100) to pitch (150Hz - 850Hz)
        const freq = 150 + (val / 100) * 700;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        const now = audioCtx.currentTime;
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + duration);
    } catch {
        // Silently handle any audio policy hiccups
    }
}

// --- Canvas High-DPI Setup ---
function resizeCanvas() {
    const parent = canvas.parentElement;
    if (!parent) return;
    const dpr = window.devicePixelRatio || 1;
    const width = parent.clientWidth;
    const height = parent.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    drawArray();
}
window.addEventListener('resize', resizeCanvas);

// --- Array Generation ---
function generateArray() {
    if (isSorting) return;
    const size = parseInt(inputSize.value, 10);
    lblSize.textContent = size;
    array = [];
    for (let i = 0; i < size; i++) {
        // Integer values from 10 to 100
        array.push(Math.floor(Math.random() * 90) + 10);
    }
    resetMetrics();
    setPhase(`Generated ${size} random elements • Ready to sort`, '');
    drawArray();
}

function resetMetrics() {
    comparisons = 0;
    swaps = 0;
    metricComparisons.textContent = '0';
    metricSwaps.textContent = '0';
    metricTime.textContent = '0.00s';
    if (timerInterval) clearInterval(timerInterval);
}

// --- Dynamic Big-O Complexity Display ---
function updateComplexityCard() {
    const algo = selectAlgo.value;
    const meta = ALGO_METADATA[algo];
    if (meta) {
        valBest.textContent = meta.best;
        valAvg.textContent = meta.avg;
        valWorst.textContent = meta.worst;
        valSpace.textContent = meta.space;
        valStability.textContent = meta.stability;
        if (meta.stability === 'Stable') {
            valStability.className = 'pill-val text-emerald';
        } else {
            valStability.className = 'pill-val text-amber';
        }
        if (!isSorting) {
            setPhase(`Selected ${meta.name} • Click Start Sorting to begin`, '');
        }
    }
}
selectAlgo.addEventListener('change', updateComplexityCard);

// --- Canvas Renderer ---
function drawArray(activeIndices = [], sortedIndices = [], pivotIndex = -1) {
    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight;

    ctx.clearRect(0, 0, width, height);

    if (array.length === 0) return;

    const barWidth = width / array.length;
    const gap = barWidth > 4 ? 1.5 : 0.5;

    for (let i = 0; i < array.length; i++) {
        const barHeight = (array[i] / 100) * (height * 0.88);
        const x = i * barWidth;
        const y = height - barHeight;
        const w = Math.max(1, barWidth - gap);

        // Pick color based on element role
        if (sortedIndices.includes(i)) {
            // Emerald (Sorted)
            const grad = ctx.createLinearGradient(x, y, x, height);
            grad.addColorStop(0, '#34d399');
            grad.addColorStop(1, '#059669');
            ctx.fillStyle = grad;
        } else if (i === pivotIndex) {
            // Amber (Pivot)
            const grad = ctx.createLinearGradient(x, y, x, height);
            grad.addColorStop(0, '#fbbf24');
            grad.addColorStop(1, '#d97706');
            ctx.fillStyle = grad;
        } else if (activeIndices.includes(i)) {
            // Rose (Comparing / Active)
            const grad = ctx.createLinearGradient(x, y, x, height);
            grad.addColorStop(0, '#f43f5e');
            grad.addColorStop(1, '#be123c');
            ctx.fillStyle = grad;
        } else {
            // Default Cyan / Purple gradient
            const grad = ctx.createLinearGradient(x, y, x, height);
            grad.addColorStop(0, '#38bdf8');
            grad.addColorStop(1, '#6366f1');
            ctx.fillStyle = grad;
        }

        // Draw rounded top bar
        if (w > 4 && barHeight > 4) {
            ctx.beginPath();
            ctx.roundRect(x, y, w, barHeight, [4, 4, 0, 0]);
            ctx.fill();
        } else {
            ctx.fillRect(x, y, w, barHeight);
        }
    }
}

// --- Animation Speed Delay ---
function delay() {
    if (stopRequested) return Promise.resolve();
    const speed = parseInt(inputSpeed.value, 10);
    // Exponential ease: fast at high values, deliberate at low values
    const ms = Math.max(2, Math.floor(180 * Math.pow((101 - speed) / 100, 2)));
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper comparison tracker
function compare(i, j) {
    comparisons++;
    metricComparisons.textContent = comparisons.toLocaleString();
    playTone(array[i]);
    return array[i] - array[j];
}

// Helper swap tracker
function swap(i, j) {
    swaps++;
    metricSwaps.textContent = swaps.toLocaleString();
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
    playTone(array[j]);
}

// --- Sorting Algorithms ---

// 1. Bubble Sort
async function bubbleSort() {
    const n = array.length;
    for (let i = 0; i < n - 1; i++) {
        let swapped = false;
        setPhase(`Pass ${i + 1}/${n - 1} • Comparing adjacent pairs`);
        for (let j = 0; j < n - i - 1; j++) {
            if (stopRequested) return;

            drawArray([j, j + 1]);
            await delay();

            if (compare(j, j + 1) > 0) {
                setPhase(`Pass ${i + 1} • Swapping [${j}] (${array[j]}) > [${j + 1}] (${array[j + 1]})`);
                swap(j, j + 1);
                swapped = true;
                drawArray([j, j + 1]);
                await delay();
            }
        }
        if (!swapped) {
            setPhase(`Zero inversions remaining after pass ${i + 1}!`);
            break;
        }
    }
}

// 2. Selection Sort
async function selectionSort() {
    const n = array.length;
    for (let i = 0; i < n - 1; i++) {
        let minIdx = i;
        setPhase(`Pass ${i + 1}/${n - 1} • Finding minimum in range [${i}..${n - 1}]`);
        for (let j = i + 1; j < n; j++) {
            if (stopRequested) return;

            drawArray([j, minIdx], [], i);
            await delay();

            if (compare(j, minIdx) < 0) {
                minIdx = j;
                setPhase(`Pass ${i + 1} • Found candidate min: ${array[minIdx]} at index ${minIdx}`);
            }
        }
        if (minIdx !== i) {
            setPhase(`Pass ${i + 1} • Placing minimum ${array[minIdx]} into sorted index ${i}`);
            swap(i, minIdx);
            drawArray([i, minIdx]);
            await delay();
        }
    }
}

// 3. Insertion Sort
async function insertionSort() {
    const n = array.length;
    for (let i = 1; i < n; i++) {
        let j = i;
        setPhase(`Item ${i + 1}/${n} • Inserting key ${array[i]} into sorted sub-array`);
        while (j > 0 && compare(j - 1, j) > 0) {
            if (stopRequested) return;

            drawArray([j, j - 1]);
            await delay();

            setPhase(`Shifting ${array[j - 1]} right to make room for ${array[j]}`);
            swap(j, j - 1);
            j--;

            drawArray([j, j + 1]);
            await delay();
        }
    }
}

// 4. Merge Sort
async function mergeSort() {
    await mergeSortRecursive(0, array.length - 1);
}

async function mergeSortRecursive(left, right) {
    if (left >= right || stopRequested) return;
    const mid = Math.floor((left + right) / 2);
    setPhase(`Dividing partition [${left}..${right}] at mid index ${mid}`);

    await mergeSortRecursive(left, mid);
    await mergeSortRecursive(mid + 1, right);
    await merge(left, mid, right);
}

async function merge(left, mid, right) {
    if (stopRequested) return;
    setPhase(`Merging partitions [${left}..${mid}] and [${mid + 1}..${right}]`);

    const temp = [];
    let i = left;
    let j = mid + 1;

    while (i <= mid && j <= right) {
        if (stopRequested) return;

        drawArray([i, j]);
        await delay();

        if (compare(i, j) <= 0) {
            temp.push(array[i++]);
        } else {
            temp.push(array[j++]);
        }
        swaps++;
        metricSwaps.textContent = swaps.toLocaleString();
    }

    while (i <= mid) {
        if (stopRequested) return;
        temp.push(array[i++]);
        swaps++;
        metricSwaps.textContent = swaps.toLocaleString();
    }

    while (j <= right) {
        if (stopRequested) return;
        temp.push(array[j++]);
        swaps++;
        metricSwaps.textContent = swaps.toLocaleString();
    }

    setPhase(`Writing merged sorted range [${left}..${right}] back to memory`);
    // Write back to main array
    for (let k = 0; k < temp.length; k++) {
        if (stopRequested) return;
        array[left + k] = temp[k];
        playTone(temp[k]);
        drawArray([left + k]);
        await delay();
    }
}

// 5. Quick Sort (Lomuto Partition)
async function quickSort() {
    await quickSortRecursive(0, array.length - 1);
}

async function quickSortRecursive(start, end) {
    if (start >= end || stopRequested) return;
    setPhase(`Partitioning subarray [${start}..${end}]`);
    const pivotIdx = await partition(start, end);
    await quickSortRecursive(start, pivotIdx - 1);
    await quickSortRecursive(pivotIdx + 1, end);
}

async function partition(start, end) {
    const pivotVal = array[end];
    let pIndex = start;
    setPhase(`Subarray [${start}..${end}] • Pivot: ${pivotVal} (index ${end})`);

    for (let i = start; i < end; i++) {
        if (stopRequested) return pIndex;

        drawArray([i, pIndex], [], end);
        await delay();

        comparisons++;
        metricComparisons.textContent = comparisons.toLocaleString();
        playTone(array[i]);

        if (array[i] < pivotVal) {
            setPhase(`Pivot ${pivotVal}: Swapping [${i}] (${array[i]}) < pivot to index ${pIndex}`);
            swap(i, pIndex);
            pIndex++;
            drawArray([i, pIndex], [], end);
            await delay();
        }
    }

    setPhase(`Placing pivot ${pivotVal} into final partitioned index ${pIndex}`);
    swap(pIndex, end);
    drawArray([pIndex, end]);
    await delay();
    return pIndex;
}

// --- Main Sorting Controller ---
async function startSorting() {
    if (isSorting) return;
    initAudio();

    isSorting = true;
    stopRequested = false;

    btnSort.disabled = true;
    btnGenerate.disabled = true;
    inputSize.disabled = true;
    selectAlgo.disabled = true;
    btnReset.disabled = false;

    resetMetrics();
    startTime = performance.now();
    timerInterval = setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1000;
        metricTime.textContent = elapsed.toFixed(2) + 's';
    }, 50);

    const algo = selectAlgo.value;
    const algoName = ALGO_METADATA[algo]?.name || algo;
    setPhase(`Executing ${algoName}...`, 'working');

    if (algo === 'quick') await quickSort();
    else if (algo === 'merge') await mergeSort();
    else if (algo === 'insertion') await insertionSort();
    else if (algo === 'selection') await selectionSort();
    else if (algo === 'bubble') await bubbleSort();

    clearInterval(timerInterval);
    const totalElapsed = (performance.now() - startTime) / 1000;
    metricTime.textContent = totalElapsed.toFixed(2) + 's';

    // Victory sweep: Green scan across sorted array with arpeggio sound
    if (!stopRequested) {
        setPhase(`Verification sweep • Finalizing sorted array...`, 'active');
        const sorted = [];
        for (let i = 0; i < array.length; i++) {
            sorted.push(i);
            playTone(array[i], 0.05);
            drawArray([], sorted);
            await new Promise(r => setTimeout(r, Math.max(5, 500 / array.length)));
        }
        setPhase(`Sorted in ${totalElapsed.toFixed(2)}s • 0 Inversions Remaining 🎉`, 'active');
    }

    isSorting = false;
    btnSort.disabled = false;
    btnGenerate.disabled = false;
    inputSize.disabled = false;
    selectAlgo.disabled = false;
    btnReset.disabled = true;
}

function stopSorting() {
    if (!isSorting) return;
    stopRequested = true;
    clearInterval(timerInterval);
    isSorting = false;

    btnSort.disabled = false;
    btnGenerate.disabled = false;
    inputSize.disabled = false;
    selectAlgo.disabled = false;
    btnReset.disabled = true;

    setPhase('Sorting halted by user', 'stopped');
    drawArray();
}

// --- Event Listeners ---
btnGenerate.addEventListener('click', () => {
    initAudio();
    generateArray();
});

btnSort.addEventListener('click', startSorting);
btnReset.addEventListener('click', stopSorting);

btnSound.addEventListener('click', () => {
    initAudio();
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
        btnSound.textContent = '🔊 Audio: ON';
        btnSound.classList.add('active');
    } else {
        btnSound.textContent = '🔇 Audio: Muted';
        btnSound.classList.remove('active');
    }
});

inputSize.addEventListener('input', () => {
    lblSize.textContent = inputSize.value;
    generateArray();
});

inputSpeed.addEventListener('input', () => {
    lblSpeed.textContent = inputSpeed.value + '%';
});

// Initialize on boot
updateComplexityCard();
setTimeout(() => {
    resizeCanvas();
    generateArray();
}, 80);

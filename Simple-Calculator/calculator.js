// ============================================================================
// Secure Mathematical AST Parser & Tokenizer Engine
// Features: Two-pass precedence parser, XSS-immune lexer, live DevTools trace
// Zero eval() used anywhere.
// ============================================================================

let displayValue = "";
let lastExpression = "";

// Web Audio API Micro-Click Feedback
let audioCtx = null;
function playKeyClick() {
    try {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) audioCtx = new AudioContextClass();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        if (audioCtx) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.02);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.02);
        }
    } catch {
        // Silently ignore audio restrictions
    }
}

// 1. Lexical Tokenizer
function tokenize(expr) {
    if (!expr || !expr.trim()) return [];
    // Match numbers (including decimals) or standard operators
    const regex = /(\d+\.?\d*)|([+\-*/])/g;
    const tokens = [];
    let match;
    while ((match = regex.exec(expr)) !== null) {
        if (match[1] !== undefined) {
            tokens.push({ type: 'NUMBER', value: match[1] });
        } else if (match[2] !== undefined) {
            tokens.push({ type: 'OPERATOR', value: match[2] });
        }
    }
    return tokens;
}

// 2. Token Stream Visualizer
function updateTokenStream(expr) {
    const tokens = tokenize(expr);
    const tokenChips = document.getElementById("tokenChips");
    const metricTokens = document.getElementById("metricTokens");

    if (metricTokens) {
        metricTokens.textContent = tokens.length;
    }

    if (!tokenChips) return;

    if (tokens.length === 0) {
        tokenChips.innerHTML = '<span class="token-placeholder">// Enter an expression on the keypad to inspect tokens</span>';
        return;
    }

    tokenChips.innerHTML = "";
    tokens.forEach((tok) => {
        const chip = document.createElement("span");
        chip.className = `token-chip ${tok.type === 'NUMBER' ? 'token-chip-number' : 'token-chip-operator'}`;
        chip.innerHTML = `<span class="token-type-tag">${tok.type}</span><strong>${tok.value}</strong>`;
        tokenChips.appendChild(chip);
    });
}

// 3. Parser & Precedence Evaluator with Step-by-Step Execution Trace
function evaluateWithTrace(expr) {
    const tokens = tokenize(expr);
    if (tokens.length === 0) {
        return { error: 'Empty expression' };
    }

    const trace = [];
    trace.push({
        step: '01. Lexical Tokenization',
        detail: `Extracted ${tokens.length} atomic tokens from raw input string.`
    });

    // Pass 1: High Precedence (* and /)
    const pass1Tokens = [];
    let pass1Count = 0;

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.type === 'OPERATOR' && (token.value === '*' || token.value === '/')) {
            const leftVal = parseFloat(pass1Tokens.pop());
            const rightToken = tokens[++i];
            if (!rightToken || rightToken.type !== 'NUMBER') {
                return { error: `Syntax Error: missing operand after '${token.value}'` };
            }
            const rightVal = parseFloat(rightToken.value);
            let subResult;
            if (token.value === '*') {
                subResult = leftVal * rightVal;
            } else {
                if (rightVal === 0) {
                    return { error: 'Division by zero is undefined' };
                }
                subResult = leftVal / rightVal;
            }
            pass1Tokens.push(subResult);
            pass1Count++;
            trace.push({
                step: '02. Pass 1 (High)',
                detail: `Resolved [${leftVal} ${token.value} ${rightVal}] ➔ ${subResult}`
            });
        } else {
            pass1Tokens.push(token.value);
        }
    }

    if (pass1Count === 0) {
        trace.push({
            step: '02. Pass 1 (High)',
            detail: 'No multiplication or division operators present in token stream.'
        });
    }

    // Pass 2: Low Precedence (+ and -)
    let result = parseFloat(pass1Tokens[0]);
    let pass2Count = 0;

    for (let i = 1; i < pass1Tokens.length; i += 2) {
        const op = pass1Tokens[i];
        const nextVal = parseFloat(pass1Tokens[i + 1]);
        if (isNaN(nextVal)) {
            return { error: 'Syntax Error: incomplete arithmetic expression' };
        }
        const prev = result;
        if (op === '+') result += nextVal;
        if (op === '-') result -= nextVal;
        pass2Count++;
        trace.push({
            step: '03. Pass 2 (Low)',
            detail: `Resolved [${prev} ${op} ${nextVal}] ➔ ${result}`
        });
    }

    if (pass2Count === 0 && pass1Count === 0) {
        trace.push({
            step: '03. Pass 2 (Low)',
            detail: `Single atomic scalar value evaluated: ${result}`
        });
    }

    // Float precision rounding (prevents IEEE-754 issues like 0.1 + 0.2 = 0.30000000000000004)
    const rounded = Math.round(result * 100000000) / 100000000;
    trace.push({
        step: '04. IEEE-754 Normalizer',
        detail: `Sanitized 8-digit precision float: ${rounded}`,
        isFinal: true
    });

    return { result: rounded, trace, tokens };
}

// 4. UI Actions
function appendToDisplay(value) {
    playKeyClick();
    const isOp = ['+', '-', '*', '/'].includes(value);

    // Prevent consecutive operators (replace previous operator)
    if (isOp && displayValue.length > 0) {
        const lastChar = displayValue.slice(-1);
        if (['+', '-', '*', '/'].includes(lastChar)) {
            displayValue = displayValue.slice(0, -1) + value;
            document.getElementById("display").value = displayValue;
            updateTokenStream(displayValue);
            return;
        }
    }

    // Prevent starting with multiply or divide
    if (isOp && displayValue === '' && (value === '*' || value === '/')) {
        return;
    }

    displayValue += value;
    document.getElementById("display").value = displayValue;
    updateTokenStream(displayValue);
}

function clearDisplay() {
    playKeyClick();
    displayValue = "";
    document.getElementById("display").value = "";
    const subDisplay = document.getElementById("subDisplay");
    if (subDisplay) subDisplay.textContent = "Cleared";
    updateTokenStream("");

    const traceConsole = document.getElementById("executionTrace");
    if (traceConsole) {
        traceConsole.innerHTML = '<div class="trace-entry text-muted">// Evaluator cleared. Enter a new expression...</div>';
    }
}

function backspace() {
    playKeyClick();
    displayValue = displayValue.slice(0, -1);
    document.getElementById("display").value = displayValue;
    updateTokenStream(displayValue);
}

function calculateResult() {
    playKeyClick();
    if (!displayValue.trim()) return;

    const subDisplay = document.getElementById("subDisplay");
    const traceConsole = document.getElementById("executionTrace");

    const evaluation = evaluateWithTrace(displayValue);

    if (evaluation.error) {
        document.getElementById("display").value = "Error";
        if (subDisplay) subDisplay.textContent = evaluation.error;
        if (traceConsole) {
            traceConsole.innerHTML = `<div class="trace-line"><span class="trace-step text-amber">Parser Alert:</span> <span class="trace-detail">${evaluation.error}</span></div>`;
        }
        displayValue = "";
        return;
    }

    // Success
    lastExpression = displayValue;
    if (subDisplay) subDisplay.textContent = `${lastExpression} =`;

    displayValue = evaluation.result.toString();
    document.getElementById("display").value = displayValue;
    updateTokenStream(displayValue);

    // Render Trace
    if (traceConsole && evaluation.trace) {
        traceConsole.innerHTML = "";
        evaluation.trace.forEach(item => {
            const row = document.createElement("div");
            row.className = `trace-line ${item.isFinal ? 'trace-result-line' : ''}`;
            row.innerHTML = `<span class="trace-step">${item.step}:</span> <span class="trace-detail">${item.detail}</span>`;
            traceConsole.appendChild(row);
        });
    }
}

// 5. Physical Keyboard Event Listener
window.addEventListener("keydown", (e) => {
    // Numbers
    if ((e.key >= '0' && e.key <= '9') || e.key === '.') {
        appendToDisplay(e.key);
    }
    // Operators
    else if (['+', '-', '*', '/'].includes(e.key)) {
        appendToDisplay(e.key);
    }
    // Evaluate
    else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        calculateResult();
    }
    // Backspace
    else if (e.key === 'Backspace') {
        backspace();
    }
    // Clear
    else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        clearDisplay();
    }
});

// Initialize on page load
updateTokenStream("");

// 6. View Mode Controller (Classic UI vs Studio AST UI)
function setViewMode(mode) {
    const isClassic = mode === 'classic';
    document.body.classList.toggle('mode-classic', isClassic);
    document.body.classList.toggle('mode-studio', !isClassic);

    const btnClassic = document.getElementById('btnModeClassic');
    const btnStudio = document.getElementById('btnModeStudio');

    if (btnClassic) btnClassic.classList.toggle('active', isClassic);
    if (btnStudio) btnStudio.classList.toggle('active', !isClassic);

    try {
        localStorage.setItem('calculator_ui_mode', mode);
    } catch {
        // Silently handle storage exceptions
    }
}

window.setViewMode = setViewMode;

// Boot with saved mode or default to studio
try {
    const savedUIMode = localStorage.getItem('calculator_ui_mode') || 'studio';
    setViewMode(savedUIMode);
} catch {
    setViewMode('studio');
}


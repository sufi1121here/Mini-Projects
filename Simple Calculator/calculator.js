let displayValue = "";

function appendToDisplay(value) {
    displayValue += value;
    document.getElementById("display").value = displayValue;
}

function clearDisplay() {
    displayValue = "";
    document.getElementById("display").value = displayValue;
}

function safeEvaluate(expr) {
    // Basic parser for +, -, *, /
    // This removes all whitespace and matches numbers and operators
    const tokens = expr.match(/\d+\.?\d*|[-+*/]/g);
    if (!tokens) return "Error";

    // 1. Process multiplication and division
    let parsedTokens = [];
    for (let i = 0; i < tokens.length; i++) {
        let token = tokens[i];
        if (token === '*' || token === '/') {
            let prev = parseFloat(parsedTokens.pop());
            let next = parseFloat(tokens[++i]);
            if (token === '*') parsedTokens.push(prev * next);
            if (token === '/') parsedTokens.push(prev / next);
        } else {
            parsedTokens.push(token);
        }
    }

    // 2. Process addition and subtraction
    let result = parseFloat(parsedTokens[0]);
    for (let i = 1; i < parsedTokens.length; i += 2) {
        let operator = parsedTokens[i];
        let next = parseFloat(parsedTokens[i + 1]);
        if (operator === '+') result += next;
        if (operator === '-') result -= next;
    }

    // Return rounded result to avoid deep floating point errors (e.g., 0.1 + 0.2)
    return Math.round(result * 100000000) / 100000000;
}

function calculateResult() {
    try {
        //displayValue = eval(displayValue).toString();  avoid this to prevent XSS 
        // attacks eval() is dangerous because it can execute any code.
        const result = safeEvaluate(displayValue);
        if (isNaN(result) || !isFinite(result)) throw new Error("Invalid calculation");
        displayValue = result.toString();
        document.getElementById("display").value = displayValue;
    } catch (error) {
        document.getElementById("display").value = "Error";
        displayValue = ""; // reset on error
    }
}

function backspace() {
    displayValue = displayValue.slice(0, -1);
    document.getElementById("display").value = displayValue;
}

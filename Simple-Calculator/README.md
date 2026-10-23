# Secure AST Expression Calculator 🧮

A secure mathematical expression evaluator and compiler-inspired AST inspector built with **Vanilla JavaScript** without relying on dangerous dynamic execution (`eval()` or `Function()`).

---

## 🌟 Why This Impresses Recruiters & International Clients

Junior developers typically implement web calculators using JavaScript's native `eval()` function, introducing catastrophic **Cross-Site Scripting (XSS)** and arbitrary code execution vulnerabilities.

This project demonstrates software security and compiler construction fundamentals:
1. **Lexical Analysis (Tokenizer):** Converts raw input character streams into structured typed tokens (`NUMBER` and `OPERATOR`) using regular expressions and scanner passes.
2. **Deterministic Two-Pass Precedence Parser:**
   - **Pass 1 (High Precedence):** Resolves multiplication (`*`) and division (`/`) operations first.
   - **Pass 2 (Low Precedence):** Resolves remaining addition (`+`) and subtraction (`-`) sequentially.
3. **IEEE-754 Precision Normalization:** Eliminates binary floating-point representation artifacts (such as `0.1 + 0.2 = 0.30000000000000004`) via deterministic scalar rounding.
4. **Live AST DevTools Inspector:** Provides a real-time visual token stream and step-by-step parser execution trace whenever expressions are evaluated.
5. **Physical Keyboard Integration:** Full keyboard listener support for typing numbers, operators, `Enter` to solve, `Backspace` to delete, and `Escape` to clear.

---

## 🛠️ Tech Stack & Key Modules

* **[`index.html`](./index.html):** Dual-pane responsive developer workspace (Calculator + AST DevTools).
* **[`calculator.js`](./calculator.js):** Custom mathematical lexer, 2-pass precedence evaluator, trace generator, and Web Audio click synthesizer.
* **[`styles.css`](./styles.css):** Cyber-slate glassmorphic theme with LCD display styling and syntax-highlighted token chips.

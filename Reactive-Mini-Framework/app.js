import { h, render, useState, mount } from './framework.js';

function App() {
    // 1. Reactive State Hook
    const [tasks, setTasks] = useState([
        { id: 1, text: "Learn Virtual DOM", completed: true },
        { id: 2, text: "Build a mini-framework", completed: false }
    ]);
    const [inputValue, setInputValue] = useState("");

    // 2. Event Handlers
    const handleAdd = () => {
        if (!inputValue.trim()) return;
        
        const newTask = {
            id: Date.now(),
            text: inputValue.trim(),
            completed: false
        };
        
        setTasks([...tasks, newTask]);
        setInputValue("");
    };

    const handleToggle = (id) => {
        const updatedTasks = tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        setTasks(updatedTasks);
    };

    const handleDelete = (id) => {
        setTasks(tasks.filter(task => task.id !== id));
    };

    // 3. Render Virtual DOM
    return h('div', { className: 'app-container' },
        h('header', { className: 'header' },
            h('h1', null, 'Reactive Tasks'),
            h('p', null, 'Powered by a custom Virtual DOM')
        ),
        
        h('div', { className: 'input-group' },
            h('input', {
                type: 'text',
                placeholder: 'Add a new task...',
                value: inputValue,
                onInput: (e) => setInputValue(e.target.value),
                onKeyDown: (e) => e.key === 'Enter' && handleAdd()
            }),
            h('button', { onClick: handleAdd }, 'Add')
        ),
        
        h('ul', { className: 'task-list' },
            tasks.length === 0 
                ? h('div', { className: 'empty-state' }, 'No tasks remaining! 🎉')
                : tasks.map(task => 
                    h('li', { className: 'task-item', key: task.id },
                        h('span', { 
                            className: `task-text ${task.completed ? 'completed' : ''}` 
                        }, task.text),
                        h('div', { className: 'task-actions' },
                            h('button', { 
                                className: 'btn-toggle', 
                                onClick: () => handleToggle(task.id) 
                            }, task.completed ? 'Undo' : 'Done'),
                            h('button', { 
                                className: 'btn-delete', 
                                onClick: () => handleDelete(task.id) 
                            }, 'Delete')
                        )
                    )
                )
        )
    );
}

// 4. Virtual DOM Tree Serialization & Syntax Highlighter for DevTools
function countVNodes(vnode) {
    if (!vnode || typeof vnode !== 'object') return 1;
    let count = 1;
    if (Array.isArray(vnode.children)) {
        vnode.children.forEach(child => {
            count += countVNodes(child);
        });
    }
    return count;
}

function cleanVNodeForDisplay(vnode) {
    if (typeof vnode === 'string' || typeof vnode === 'number') {
        return vnode;
    }
    if (!vnode) return null;

    // Filter props to display event listeners cleanly
    const cleanProps = {};
    for (let k in vnode.props) {
        if (!k.startsWith('on')) {
            cleanProps[k] = vnode.props[k];
        } else {
            cleanProps[k] = `[Function: ${k}]`;
        }
    }

    const cleanChildren = (vnode.children || []).map(cleanVNodeForDisplay);

    return {
        type: vnode.type,
        props: cleanProps,
        children: cleanChildren
    };
}

function syntaxHighlightJSON(json) {
    return json
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'vdom-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'vdom-key';
                } else if (/^"(div|header|h1|p|ul|li|span|button|input)"/i.test(match)) {
                    cls = 'vdom-type';
                } else {
                    cls = 'vdom-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'vdom-boolean';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
}

function updateVdomInspector({ vnode, renderCount, renderTime }) {
    const metricRenders = document.getElementById('metricRenders');
    const metricNodes = document.getElementById('metricNodes');
    const metricTime = document.getElementById('metricTime');
    const vdomCode = document.getElementById('vdomCode');

    if (metricRenders) metricRenders.textContent = renderCount;
    if (metricTime) metricTime.textContent = `${renderTime}ms`;
    if (metricNodes) metricNodes.textContent = countVNodes(vnode);

    if (vdomCode) {
        const cleanTree = cleanVNodeForDisplay(vnode);
        const jsonStr = JSON.stringify(cleanTree, null, 2);
        vdomCode.innerHTML = syntaxHighlightJSON(jsonStr);
    }
}

// 5. Mount the App to the Real DOM with live Inspector Telemetry
const rootContainer = document.getElementById('app');
mount(App, rootContainer, updateVdomInspector);


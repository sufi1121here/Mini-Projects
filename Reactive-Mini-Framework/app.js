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

// 4. Mount the App to the Real DOM
const rootContainer = document.getElementById('app');
mount(App, rootContainer);

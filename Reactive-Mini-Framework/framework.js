/**
 * core framework logic
 * Demonstrates deep understanding of Virtual DOM and Reactivity
 */

// 1. Virtual DOM Creator (JSX replacement)
export function h(type, props, ...children) {
    return { type, props: props || {}, children: children.flat() };
}

// 2. The Renderer (Converts VDOM to actual DOM)
export function render(vnode, container) {
    // Handle text nodes
    if (typeof vnode === 'string' || typeof vnode === 'number') {
        container.appendChild(document.createTextNode(String(vnode)));
        return;
    }
    
    // Ignore null/booleans
    if (vnode === null || typeof vnode === 'boolean') return;

    // Create the HTML element
    const element = document.createElement(vnode.type);

    // Attach properties and event listeners
    for (let key in vnode.props) {
        if (key.startsWith('on')) {
            // e.g. onClick -> click
            const eventName = key.slice(2).toLowerCase();
            element.addEventListener(eventName, vnode.props[key]);
        } else if (key === 'className') {
            element.className = vnode.props[key];
        } else if (key === 'style') {
            Object.assign(element.style, vnode.props[key]);
        } else {
            element.setAttribute(key, vnode.props[key]);
        }
    }

    // Recursively render children
    vnode.children.forEach(child => {
        render(child, element);
    });

    container.appendChild(element);
}

// 3. State Management (Reactivity System)
let currentComponent = null;
let stateCursor = 0;

export function useState(initialValue) {
    const component = currentComponent;
    const cursor = stateCursor;
    
    // Initialize state if it doesn't exist
    if (component.states[cursor] === undefined) {
        component.states[cursor] = initialValue;
    }
    
    // The setter function that triggers a re-render
    const setState = (newValue) => {
        // Support functional updates e.g. setState(prev => prev + 1)
        if (typeof newValue === 'function') {
            component.states[cursor] = newValue(component.states[cursor]);
        } else {
            component.states[cursor] = newValue;
        }
        component.update(); // Trigger reactivity!
    };
    
    stateCursor++;
    return [component.states[cursor], setState];
}

// 4. The Mounter (Initializes the app loop)
export function mount(Component, container) {
    const componentInstance = {
        states: [],
        update: () => {
            // 1. Clear existing DOM (In a real framework, we'd diff here)
            container.innerHTML = '';
            
            // 2. Setup context for useState
            currentComponent = componentInstance;
            stateCursor = 0;
            
            // 3. Get the new Virtual DOM from the component
            const vnode = Component();
            
            // 4. Render it to the screen
            render(vnode, container);
        }
    };
    
    // Initial render
    componentInstance.update();
}

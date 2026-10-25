/**
 * Reactive Mini-Framework Core Engine
 * Implements real-time Virtual DOM creation, recursive tree diffing,
 * in-place DOM patching, and closure-based reactive state.
 *
 * Demonstrates deep frontend framework architecture (like React/Preact internals)
 * without third-party dependencies.
 */

// 1. Virtual DOM Node Factory (JSX / Compiler Target)
export function h(type, props, ...children) {
    return {
        type,
        props: props || {},
        children: children.flat().filter(c => c !== null && c !== undefined && c !== false)
    };
}

// 2. The Renderer (Mounts a VNode tree to a container)
export function render(vnode, container) {
    container.innerHTML = '';
    const element = createRealNode(vnode);
    container.appendChild(element);
    return element;
}

// 3. Real DOM Node Creator
export function createRealNode(vnode) {
    // Text / Primitive Nodes
    if (typeof vnode === 'string' || typeof vnode === 'number') {
        return document.createTextNode(String(vnode));
    }

    if (!vnode || typeof vnode !== 'object') {
        return document.createTextNode('');
    }

    // Element Nodes
    const element = document.createElement(vnode.type);

    // Apply attributes, styles, and event listeners
    patchProps(element, {}, vnode.props);

    // Recursively append children
    (vnode.children || []).forEach(child => {
        element.appendChild(createRealNode(child));
    });

    return element;
}

// 3. Fine-Grained Attribute & Event Patcher
export function patchProps(element, oldProps = {}, newProps = {}) {
    let patchesCount = 0;

    // Remove obsolete props
    for (let key in oldProps) {
        if (!(key in newProps)) {
            if (key.startsWith('on')) {
                const eventName = key.slice(2).toLowerCase();
                if (element._listeners && element._listeners[eventName]) {
                    element.removeEventListener(eventName, element._listeners[eventName]);
                    delete element._listeners[eventName];
                }
            } else if (key === 'className') {
                element.className = '';
            } else if (key === 'style') {
                element.removeAttribute('style');
            } else if (key !== 'key') {
                element.removeAttribute(key);
            }
            patchesCount++;
        }
    }

    // Set new or updated props
    for (let key in newProps) {
        const oldVal = oldProps[key];
        const newVal = newProps[key];

        if (oldVal !== newVal) {
            if (key.startsWith('on')) {
                // Event listener update (managed via internal element closure map)
                const eventName = key.slice(2).toLowerCase();
                element._listeners = element._listeners || {};
                if (element._listeners[eventName]) {
                    element.removeEventListener(eventName, element._listeners[eventName]);
                }
                element._listeners[eventName] = newVal;
                element.addEventListener(eventName, newVal);
            } else if (key === 'className') {
                element.className = newVal || '';
            } else if (key === 'value' && ('value' in element)) {
                // Ensure controlled inputs don't lose value or caret focus
                if (element.value !== newVal) {
                    element.value = newVal;
                }
            } else if (key === 'checked' && ('checked' in element)) {
                element.checked = !!newVal;
            } else if (key === 'style') {
                Object.assign(element.style, newVal);
            } else if (key !== 'key') {
                element.setAttribute(key, newVal);
            }
            patchesCount++;
        }
    }

    return patchesCount;
}

// 4. Recursive Tree Reconciliation & Patching (The Core Diff Engine)
export function diff(parent, oldVNode, newVNode, index = 0) {
    let patchCount = 0;

    // Case 1: Node added (oldVNode was non-existent)
    if (oldVNode === undefined || oldVNode === null) {
        const newRealNode = createRealNode(newVNode);
        parent.appendChild(newRealNode);
        return 1;
    }

    // Case 2: Node removed (newVNode is non-existent)
    if (newVNode === undefined || newVNode === null) {
        const target = parent.childNodes[index];
        if (target) {
            parent.removeChild(target);
            return 1;
        }
        return 0;
    }

    // Case 3: Text / Primitive node comparison
    const isOldPrimitive = typeof oldVNode === 'string' || typeof oldVNode === 'number';
    const isNewPrimitive = typeof newVNode === 'string' || typeof newVNode === 'number';

    if (isOldPrimitive || isNewPrimitive) {
        if (String(oldVNode) !== String(newVNode)) {
            const target = parent.childNodes[index];
            if (target && target.nodeType === Node.TEXT_NODE) {
                target.nodeValue = String(newVNode);
                return 1;
            } else if (target) {
                parent.replaceChild(createRealNode(newVNode), target);
                return 1;
            }
        }
        return 0;
    }

    // Case 4: Element Tag Changed (e.g. <div> replaced by <span> or <ul>)
    if (oldVNode.type !== newVNode.type) {
        const target = parent.childNodes[index];
        if (target) {
            parent.replaceChild(createRealNode(newVNode), target);
            return 1;
        }
    }

    // Case 5: Same element tag! Retain real DOM element in memory and patch props + children
    const targetElement = parent.childNodes[index];
    if (!targetElement) return 0;

    // 5a. Patch attributes & event listeners
    patchCount += patchProps(targetElement, oldVNode.props, newVNode.props);

    // 5b. Recursively reconcile children
    const oldChildren = oldVNode.children || [];
    const newChildren = newVNode.children || [];
    const maxLen = Math.max(oldChildren.length, newChildren.length);

    for (let i = 0; i < maxLen; i++) {
        patchCount += diff(targetElement, oldChildren[i], newChildren[i], i);
    }

    return patchCount;
}

// 5. Reactive State Management (useState Hook with component cursor)
let currentComponent = null;
let stateCursor = 0;

export function useState(initialValue) {
    const component = currentComponent;
    const cursor = stateCursor;

    if (component.states[cursor] === undefined) {
        component.states[cursor] = initialValue;
    }

    const setState = (newValue) => {
        if (typeof newValue === 'function') {
            component.states[cursor] = newValue(component.states[cursor]);
        } else {
            component.states[cursor] = newValue;
        }
        component.update(); // Trigger fine-grained in-place reconciliation!
    };

    stateCursor++;
    return [component.states[cursor], setState];
}

// 6. Application Lifecycle Mounter & Reconciliation Coordinator
export function mount(Component, container, onUpdate) {
    let renderCount = 0;
    let oldVNode = null;

    const componentInstance = {
        states: [],
        update: () => {
            renderCount++;
            const t0 = performance.now();

            // Setup component hook context
            currentComponent = componentInstance;
            stateCursor = 0;

            // Generate new Virtual DOM tree from reactive component
            const newVNode = Component();

            let patchCount = 0;

            if (!oldVNode) {
                // Initial Mount: Build initial DOM tree
                container.innerHTML = '';
                const realRoot = createRealNode(newVNode);
                container.appendChild(realRoot);
                patchCount = 1;
            } else {
                // Subsequent Updates: True in-place Virtual DOM diffing!
                // Zero innerHTML wiping. Only mutated nodes are touched.
                patchCount = diff(container, oldVNode, newVNode, 0);
            }

            oldVNode = newVNode;
            const renderTime = (performance.now() - t0).toFixed(2);

            if (typeof onUpdate === 'function') {
                onUpdate({ vnode: newVNode, renderCount, renderTime, patchCount });
            }
        }
    };

    // Initial boot
    componentInstance.update();
}

let socket;

export const initSocket = () => {
    socket = io();
    // new stuff
    socket.emit('route_opened', {
        route: currentRoute,
        tabId
    });
    // end new stuff
    return socket;
};

// new stuff start
const generateTabId = () => {
    // Use randomUUID if available
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }
    // Fallback for non-secure contexts or older browsers
    const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    return template.replace(/[xy]/g, (char) => {
        const r = Math.random() * 16 | 0;
        const v = char === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const tabId = generateTabId();
let currentRoute = window.location.pathname;
console.log(tabId);
console.log(currentRoute);


// If your SPA changes routes without reload:
window.addEventListener('popstate', () => {
    currentRoute = window.location.pathname;
    socket.emit('route_opened', {
        route: currentRoute,
        tabId
    });
});

// Optional: detect closing
window.addEventListener('beforeunload', () => {
    socket.emit('route_closed', {
        route: currentRoute,
        tabId
    });
});

// new stuff end

export const getSocket = () => socket;

// public/js/socket-presence.js
let socket;
export async function initPresence() {
    return new Promise(async (resolve) => {
        const res = await fetch('/dev-token');
        const { token } = await res.json();

        let userId = localStorage.getItem("userId");
        if (!userId) {
            userId = "testplayer-" + Date.now();
            localStorage.setItem("userId", userId);
        }

        const tabId = crypto.randomUUID ? crypto.randomUUID() : 'tab-' + Math.random().toString(36).substr(2, 9);
        const route = window.location.pathname;

        const socket = io({
            query: { role: 'player', id: userId, route, tabId },
            auth: { token }
        });

        socket.on('connect', () => {
            console.log(`✅ Connected as ${userId} with tabId: ${tabId}`);
        });

        // 👇 short-circuit for fake players
        if (window.location.search.includes("fake=true")) {
            console.log("🧪 Fake player detected — bypassing duplicate check");
            resolve({ socket, allowed: true });
            return; // stop here, don't set up duplicate logic
        }

        socket.on('duplicate_open', (data) => {
            window.__preventAppInit = true;
            console.log("duplicate detected");
//            alert('You already have this game open in another window/tab, please close this tab and return to the original');
            window.renderTemplate('insertion', 'game.duplicate', {}, () => {

            })
            resolve({ socket, allowed: false });
        });

        // 👇 fallback: if no duplicate event after 300ms, allow
        setTimeout(() => {
            if (!window.__preventAppInit) {
                resolve({ socket, allowed: true });
            }
        }, 300);
    });
}

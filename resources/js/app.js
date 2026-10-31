import Alpine from 'alpinejs';
import L from 'leaflet';

window.Alpine = Alpine;

Alpine.data('share', (url) => ({
    copied: false,
    async copy() {
        try {
            await navigator.clipboard.writeText(url);
            this.copied = true;
            setTimeout(() => (this.copied = false), 1800);
        } catch {
            window.prompt('Copy this link', url);
        }
    },
}));

Alpine.start();

const DIFFICULTY_COLOR = { mudah: '#1c6640', sedang: '#b8860b', berat: '#d45c1a', ekstrem: '#6b2fa0' };

function pin(trail, size = 14) {
    const ring = trail.permit ? 'box-shadow:0 0 0 2px #fff,0 0 0 4px #d45c1a;' : 'box-shadow:0 0 0 2px #fff;';
    return L.divIcon({
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
        html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:50%;background:${DIFFICULTY_COLOR[trail.difficulty] || '#555'};${ring}"></span>`,
    });
}

function tiles(map) {
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
}

const overview = document.getElementById('trail-map');
if (overview) {
    const trails = JSON.parse(overview.dataset.trails);
    const t = JSON.parse(overview.dataset.i18n);
    const map = L.map(overview, { scrollWheelZoom: false }).setView([-7.3, 110], 6);
    tiles(map);

    const bounds = [];
    trails.forEach((trail) => {
        bounds.push([trail.lat, trail.lng]);
        L.marker([trail.lat, trail.lng], { icon: pin(trail) })
            .addTo(map)
            .bindPopup(
                `<div style="font-family:Nunito,sans-serif;min-width:180px">
                    <div style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:700;line-height:1.1">${trail.name}</div>
                    <div style="font-size:12px;color:#5c5347">${trail.regency}, ${trail.province}</div>
                    <div style="font-size:12px;margin-top:4px"><b>${trail.elevation.toLocaleString('id-ID')} m</b> · ${trail.label} · ±${trail.hours} ${t.hours}${trail.permit ? ` · <span style="color:#d45c1a;font-weight:700">${t.permit}</span>` : ''}</div>
                    <a href="${trail.url}" style="display:inline-block;margin-top:8px;background:#1c6640;color:#fff;border-radius:999px;padding:5px 12px;font-size:12px;font-weight:700;text-decoration:none">${t.open} →</a>
                </div>`,
            );
    });
    if (bounds.length) map.fitBounds(bounds, { padding: [24, 24] });
}

const mini = document.getElementById('trail-mini-map');
if (mini) {
    const trail = JSON.parse(mini.dataset.trail);
    const map = L.map(mini, { scrollWheelZoom: false, dragging: false, zoomControl: false, attributionControl: false }).setView([trail.lat, trail.lng], 11);
    tiles(map);
    L.marker([trail.lat, trail.lng], { icon: pin(trail, 18) }).addTo(map);
}

// ---------------------------------------------------------------------------
// PWA: service worker, offline banner, queued check-in, install prompt
// ---------------------------------------------------------------------------

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

const QUEUE_KEY = 'arda.pendingCheckin';
const csrf = document.querySelector('meta[name="csrf-token"]')?.content;

function readQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || 'null'); } catch { return null; }
}

function renderNet() {
    const banner = document.getElementById('net-banner');
    if (!banner) return;
    const pending = readQueue();
    banner.hidden = navigator.onLine && !pending;
    banner.querySelector('[data-offline]').hidden = navigator.onLine;
    banner.querySelector('[data-pending]').hidden = !pending;
}

async function flushQueue() {
    const pending = readQueue();
    if (!pending || !navigator.onLine || !csrf) return;
    try {
        const body = new URLSearchParams({ ...pending.fields, _token: csrf });
        const res = await fetch(pending.action, { method: 'POST', body, credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' }, redirect: 'follow' });
        if (res.ok || res.redirected || res.status === 302) {
            localStorage.removeItem(QUEUE_KEY);
            renderNet();
            if (location.pathname === '/check-in') location.reload();
        } else if (res.status === 422) {
            localStorage.removeItem(QUEUE_KEY);
            renderNet();
        }
    } catch { /* still offline; try again on next online event */ }
}

const checkinForm = document.getElementById('checkin-form');
if (checkinForm) {
    checkinForm.addEventListener('submit', (e) => {
        if (navigator.onLine) return;
        e.preventDefault();
        const fields = Object.fromEntries(new FormData(checkinForm).entries());
        delete fields._token;
        fields.checkin_at = new Date().toISOString();
        try { localStorage.setItem(QUEUE_KEY, JSON.stringify({ action: checkinForm.action, fields })); } catch {}
        renderNet();
        const note = document.createElement('p');
        note.className = 'rounded-xl bg-canopy-light text-canopy px-4 py-3 text-sm font-semibold';
        note.textContent = checkinForm.dataset.queuedMsg;
        checkinForm.replaceWith(note);
    });
}

window.addEventListener('online', () => { renderNet(); flushQueue(); });
window.addEventListener('offline', renderNet);
renderNet();
flushQueue();

let installEvent = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installEvent = e;
    const btn = document.getElementById('install-app');
    if (btn) btn.hidden = false;
});
document.getElementById('install-app')?.addEventListener('click', async () => {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    installEvent = null;
    document.getElementById('install-app').hidden = true;
});



function ensureAnomalyContainer() {
    let c = document.getElementById('anomaly-container');
    if (c) return c;
    c = document.createElement('div');
    c.id = 'anomaly-container';
    Object.assign(c.style, {
        position: 'fixed',
        right: '12px',
        top: '12px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none'
    });
    document.body.appendChild(c);
    return c;
}
function playPing() {
    try {
        // короткий «бип» (base64, очень маленький WAV)
        const a = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
        a.volume = 0.6;
        a.play().catch(() => {/* игнор */ });
    } catch (e) { /* игнор */ }
}



/**
 * Показывает алерт об аномалии.
 * @param {{value:number, z:number, id?:number}} param0
 */
export function showAnomaly({ value, z, id }) {
    const container = ensureAnomalyContainer();

    const el = document.createElement('div');
    el.textContent = `ANOMALY ${Math.round(value)} (z=${Number(z).toFixed(2)})`;
    el.title = id ? `id: ${id}` : '';
    Object.assign(el.style, {
        pointerEvents: 'auto',
        background: 'linear-gradient(90deg,#ffef9a,#ffd166)',
        color: '#1a1a1a',
        padding: '8px 12px',
        borderRadius: '8px',
        boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
        fontWeight: 700,
        fontFamily: 'sans-serif',
        transform: 'translateY(-6px)',
        opacity: '0',
        transition: 'transform .18s ease, opacity .18s ease'
    });

    container.prepend(el); // newest сверху

    // плавный вход
    requestAnimationFrame(() => {
        el.style.transform = 'translateY(0)';
        el.style.opacity = '1';
    });

    playPing();

    // удаление через 3.5s с анимацией
    setTimeout(() => {
        el.style.transform = 'translateY(-6px)';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 220);
    }, 3500);
}
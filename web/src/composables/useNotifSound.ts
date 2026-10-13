// Tono corto de notificación generado con Web Audio API.
// No requiere archivo de audio ni internet.
let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx || ctx.state === 'closed') ctx = new AudioContext();
  return ctx;
}

export function playNotifSound() {
  try {
    const ac = getCtx();
    // Chrome suspende el AudioContext hasta el primer gesto del usuario
    if (ac.state === 'suspended') { ac.resume().catch(() => {}); return; }
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'sine';
    // Dos notas: Do5 → Mi5 (acorde ascendente, breve)
    osc.frequency.setValueAtTime(1047, now);
    osc.frequency.setValueAtTime(1319, now + 0.12);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.start(now);
    osc.stop(now + 0.45);
  } catch { /* sin permisos de audio: silencioso */ }
}

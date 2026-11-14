'use strict';

// ---------- utilidades ----------
const $ = (s, el = document) => el.querySelector(s);
const store = {
  get(k, d) {
    try {
      const v = localStorage.getItem('resenha.' + k);
      return v == null ? d : JSON.parse(v);
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem('resenha.' + k, JSON.stringify(v));
    } catch {}
  },
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const COLORS = ['#5865f2', '#3ba55c', '#faa61a', '#ed4245', '#eb459e', '#9b59b6', '#1abc9c', '#e67e22', '#3498db'];
function color(s) {
  let h = 0;
  for (const ch of String(s)) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
}
function initials(s) {
  const w = String(s).trim().split(/\s+/).filter(Boolean);
  if (!w.length) return '?';
  return (w.length > 1 ? [...w[0]][0] + [...w[1]][0] : [...w[0]].slice(0, 2).join('')).toUpperCase();
}
const avatar = (name, size, extra = '') =>
  `<div class="avatar av${size} ${extra}" style="background:${color(name)}">${esc([...String(name)][0] || '?')}</div>`;
const hhmm = (ts) => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
function when(ts) {
  const d = new Date(ts);
  const today = new Date().toDateString() === d.toDateString();
  return today ? `Hoje às ${hhmm(ts)}` : `${d.toLocaleDateString('pt-BR')} ${hhmm(ts)}`;
}
const fmt = (t) => esc(t).replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)"'\]]/g, (u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`);
function newCode() {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  const r = crypto.getRandomValues(new Uint8Array(8));
  return [...r].map((x) => abc[x % abc.length]).join('');
}
function parseInvite(v) {
  const s = String(v).trim().toLowerCase();
  const m = s.match(/#([a-z0-9]{4,16})\s*$/) || s.match(/^([a-z0-9]{4,16})$/);
  return m ? m[1] : null;
}
let toastTimer;
function toast(text) {
  const t = $('#toast');
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

const ICONS = {
  hash: '<line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/>',
  volume: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
  micOff: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/><path d="m2 2 20 20"/>',
  head: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  headOff: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/><path d="m2 2 20 20"/>',
  screen: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="m9 10 3-3 3 3M12 7v6"/>',
  hangup: '<path d="M2.2 13.6c-.4-.4-.4-1 0-1.4C5 9.4 8.4 8 12 8s7 1.4 9.8 4.2c.4.4.4 1 0 1.4l-2 2c-.4.4-1 .4-1.4.1-.8-.6-1.6-1-2.5-1.4-.4-.2-.6-.5-.6-.9V11c-2.1-.6-4.5-.6-6.6 0v2.4c0 .4-.2.7-.6.9-.9.4-1.7.8-2.5 1.4-.4.3-1 .3-1.4-.1z" fill="currentColor" stroke="none"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  invite: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  expand: '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>',
  signal: '<path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/>',
  arrowIn: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowOut: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
};
const icon = (n, s = 20) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

// ---------- estado ----------
const S = {
  me: null,
  name: store.get('name', ''),
  groups: store.get('groups', []), // [{ code, title }]
  rooms: new Map(), // código -> { title, members: Map, messages: [], unread }
  current: store.get('current', null),
  view: 'chat', // 'chat' | 'voice'
  online: false,
  ice: [{ urls: 'stun:stun.l.google.com:19302' }],
};
// chamada de voz
const V = {
  room: null,
  joining: false,
  mic: null,
  screen: null,
  muted: store.get('muted', false),
  deafened: false,
  prevMuted: false,
  peers: new Map(), // id -> { pc, polite, makingOffer, ignoreOffer, audios: Map, screenId, screenSenders }
  meters: new Map(), // id -> { an, buf, src, on }
  videos: new Map(), // chave -> { el, peer }
  focus: null,
  ctx: null,
};

function room(code) {
  let r = S.rooms.get(code);
  if (!r) {
    const g = S.groups.find((x) => x.code === code);
    S.rooms.set(code, (r = { title: g ? g.title : code, members: new Map(), messages: [], unread: 0 }));
  }
  return r;
}
const saveGroups = () => store.set('groups', S.groups);
function addGroup(code, title) {
  let g = S.groups.find((x) => x.code === code);
  if (!g) {
    g = { code, title: title || code };
    S.groups.push(g);
    saveGroups();
  }
  room(code);
  send({ t: 'join', room: code, title: g.title });
}

// ---------- conexão com o servidor ----------
let ws;
let retry = 0;
function connect() {
  ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
  ws.onopen = () => {
    retry = 0;
    ws.send(JSON.stringify({ t: 'hello', name: S.name }));
  };
  ws.onmessage = (e) => {
    let m;
    try {
      m = JSON.parse(e.data);
    } catch {
      return;
    }
    handle(m);
  };
  ws.onclose = () => {
    S.online = false;
    S.me = null;
    leaveVoice(false);
    S.rooms.forEach((r) => r.members.clear());
    render();
    setTimeout(connect, Math.min(10000, 800 * 2 ** retry++));
  };
}
function send(m) {
  if (ws && ws.readyState === 1 && (S.me || m.t === 'hello')) ws.send(JSON.stringify(m));
}

function sys(code, text, out = false) {
  const r = S.rooms.get(code);
  if (!r) return;
  pushMsg(r, { sys: true, out, text, ts: Date.now() });
  if (code === S.current) renderMessages();
}
function pushMsg(r, m) {
  r.messages.push(m);
  if (r.messages.length > 500) r.messages.splice(0, r.messages.length - 500);
}

function handle(m) {
  switch (m.t) {
    case 'welcome':
      S.me = m.id;
      S.online = true;
      S.groups.forEach((g) => send({ t: 'join', room: g.code, title: g.title }));
      render();
      break;
    case 'joined': {
      if (!S.groups.some((g) => g.code === m.room)) break;
      const r = room(m.room);
      r.title = m.title;
      r.members = new Map(m.members.map((x) => [x.id, x]));
      const g = S.groups.find((x) => x.code === m.room);
      if (g.title !== m.title) {
        g.title = m.title;
        saveGroups();
      }
      render();
      break;
    }
    case 'member': {
      const r = S.rooms.get(m.room);
      if (!r) break;
      const old = r.members.get(m.member.id);
      r.members.set(m.member.id, m.member);
      if (m.joined) sys(m.room, `${m.member.name} ficou online`);
      if (V.room === m.room && m.member.id !== S.me) {
        const was = !!(old && old.voice);
        if (!was && m.member.voice) tone('join');
        if (was && !m.member.voice) {
          closePeer(m.member.id);
          tone('leave');
        }
        if (old && old.sharing && !m.member.sharing) dropVideos(m.member.id);
      }
      render();
      break;
    }
    case 'member-leave': {
      const r = S.rooms.get(m.room);
      if (!r) break;
      const old = r.members.get(m.id);
      r.members.delete(m.id);
      if (V.room === m.room && old && old.voice) {
        closePeer(m.id);
        tone('leave');
      }
      if (old) sys(m.room, `${old.name} saiu`, true);
      render();
      break;
    }
    case 'msg': {
      const r = S.rooms.get(m.room);
      if (!r) break;
      pushMsg(r, { from: m.from, name: m.name, text: m.text, ts: m.ts });
      const seen = m.room === S.current && S.view === 'chat' && !document.hidden;
      if (!seen && m.from !== S.me) r.unread++;
      if (m.room === S.current) renderMessages(m.from === S.me);
      renderGroups();
      renderSidebar();
      updateTitle();
      break;
    }
    case 'voice-peers':
      if (V.room === m.room) m.peers.forEach((id) => createPeer(id, true));
      break;
    case 'signal':
      onSignal(m.from, m.data || {});
      break;
    case 'error':
      toast(m.text);
      break;
  }
}

// ---------- chamada (WebRTC em malha, "perfect negotiation") ----------
const sig = (to, data) => send({ t: 'signal', to, data });

function createPeer(id, initiator) {
  if (V.peers.has(id)) return V.peers.get(id);
  const pc = new RTCPeerConnection({ iceServers: S.ice });
  const p = { id, pc, polite: S.me > id, makingOffer: false, ignoreOffer: false, audios: new Map(), screenId: null, screenSenders: [] };
  V.peers.set(id, p);

  const mic = V.mic.getAudioTracks();
  mic.forEach((t) => pc.addTrack(t, V.mic));
  if (!mic.length && initiator) pc.addTransceiver('audio', { direction: 'recvonly' });
  if (V.screen) addScreen(p);

  pc.onnegotiationneeded = async () => {
    try {
      p.makingOffer = true;
      await pc.setLocalDescription();
      sig(id, { sdp: pc.localDescription });
    } catch (e) {
      console.error(e);
    } finally {
      p.makingOffer = false;
    }
  };
  pc.onicecandidate = ({ candidate }) => candidate && sig(id, { ice: candidate });
  pc.ontrack = ({ track, streams }) => onTrack(p, track, streams[0] || new MediaStream([track]));
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'failed') pc.restartIce();
    renderSidebar();
  };
  return p;
}

async function onSignal(from, data) {
  if (!V.room) return;
  const p = createPeer(from, false);
  const pc = p.pc;
  try {
    if (data.screen) {
      p.screenId = data.screen;
    } else if (data.sdp) {
      const collision = data.sdp.type === 'offer' && (p.makingOffer || pc.signalingState !== 'stable');
      p.ignoreOffer = !p.polite && collision;
      if (p.ignoreOffer) return;
      await pc.setRemoteDescription(data.sdp);
      if (data.sdp.type === 'offer') {
        await pc.setLocalDescription();
        sig(from, { sdp: pc.localDescription });
      }
    } else if (data.ice) {
      try {
        await pc.addIceCandidate(data.ice);
      } catch (e) {
        if (!p.ignoreOffer) throw e;
      }
    }
  } catch (e) {
    console.error(e);
  }
}

function onTrack(p, track, stream) {
  if (track.kind === 'audio') {
    if (!p.audios.has(stream.id)) {
      const a = new Audio();
      a.autoplay = true;
      a.srcObject = stream;
      a.muted = V.deafened;
      a.play().catch(() => {});
      p.audios.set(stream.id, a);
      if (stream.id !== p.screenId) watchLevel(p.id, stream);
    }
  } else {
    const key = `${p.id}:${stream.id}`;
    if (!V.videos.has(key)) {
      V.videos.set(key, { el: videoEl(stream), peer: p.id });
      if (!V.focus) V.focus = key;
      renderStage();
    }
    const drop = () => {
      if (!stream.getVideoTracks().some((t) => t.readyState === 'live')) dropVideo(key);
    };
    track.addEventListener('ended', drop);
    stream.addEventListener('removetrack', drop);
  }
}

function videoEl(stream) {
  const v = document.createElement('video');
  v.autoplay = true;
  v.playsInline = true;
  v.muted = true; // o som vai pelos elementos de áudio
  v.srcObject = stream;
  return v;
}
function dropVideo(key) {
  const v = V.videos.get(key);
  if (!v) return;
  v.el.srcObject = null;
  V.videos.delete(key);
  if (V.focus === key) V.focus = V.videos.keys().next().value || null;
  renderStage();
}
function dropVideos(peerId) {
  [...V.videos.keys()].filter((k) => k.startsWith(peerId + ':')).forEach(dropVideo);
}

function closePeer(id) {
  const p = V.peers.get(id);
  if (!p) return;
  p.pc.close();
  p.audios.forEach((a) => {
    a.pause();
    a.srcObject = null;
  });
  V.peers.delete(id);
  const m = V.meters.get(id);
  if (m) {
    m.src.disconnect();
    V.meters.delete(id);
  }
  dropVideos(id);
  renderSidebar();
}

function addScreen(p) {
  sig(p.id, { screen: V.screen.id });
  p.screenSenders = V.screen.getTracks().map((t) => p.pc.addTrack(t, V.screen));
}

async function joinVoice(code) {
  S.view = 'voice';
  if (V.room === code || V.joining) return render();
  if (!S.online) return toast('Sem conexão com o servidor.');
  if (V.room) leaveVoice();
  V.joining = true;
  render();
  try {
    V.ctx = V.ctx || new AudioContext();
    V.ctx.resume();
  } catch {}
  try {
    V.mic = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
  } catch {
    V.mic = new MediaStream();
    toast('Sem acesso ao microfone: você entrou só ouvindo.');
  }
  V.joining = false;
  if (!S.online) {
    V.mic.getTracks().forEach((t) => t.stop());
    V.mic = null;
    return render();
  }
  V.room = code;
  if (V.mic.getAudioTracks().length) watchLevel(S.me, V.mic);
  V.mic.getAudioTracks().forEach((t) => (t.enabled = !V.muted));
  send({ t: 'voice-join', room: code });
  sendState();
  tone('join');
  render();
}

function leaveVoice(notify = true) {
  if (!V.room) return;
  if (V.screen) V.screen.getTracks().forEach((t) => t.stop());
  V.screen = null;
  [...V.peers.keys()].forEach(closePeer);
  if (V.mic) V.mic.getTracks().forEach((t) => t.stop());
  V.mic = null;
  V.meters.forEach((m) => m.src.disconnect());
  V.meters.clear();
  V.videos.forEach((v) => (v.el.srcObject = null));
  V.videos.clear();
  V.focus = null;
  V.room = null;
  if (notify) {
    send({ t: 'voice-leave' });
    tone('leave');
  }
  render();
}

async function toggleShare() {
  if (!V.room) return;
  if (V.screen) return stopShare();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    return toast('Este navegador não compartilha tela. Use o Chrome ou o Edge no computador.');
  }
  let s;
  try {
    s = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 30, max: 60 } }, audio: true });
  } catch {
    return;
  }
  if (!V.room) return s.getTracks().forEach((t) => t.stop());
  V.screen = s;
  s.getVideoTracks()[0].addEventListener('ended', stopShare);
  V.videos.set('me', { el: videoEl(s), peer: S.me });
  if (!V.focus) V.focus = 'me';
  V.peers.forEach(addScreen);
  sendState();
  S.view = 'voice';
  render();
}
function stopShare() {
  if (!V.screen) return;
  V.screen.getTracks().forEach((t) => t.stop());
  V.peers.forEach((p) => {
    p.screenSenders.forEach((s) => {
      try {
        p.pc.removeTrack(s);
      } catch {}
    });
    p.screenSenders = [];
  });
  V.screen = null;
  dropVideo('me');
  sendState();
  render();
}

function sendState() {
  send({ t: 'state', muted: V.muted, deafened: V.deafened, sharing: !!V.screen });
}
function applyAudio() {
  store.set('muted', V.muted);
  if (V.mic) V.mic.getAudioTracks().forEach((t) => (t.enabled = !V.muted));
  V.peers.forEach((p) => p.audios.forEach((a) => (a.muted = V.deafened)));
  sendState();
  renderSidebar();
  renderStage();
  renderMembers();
}
function toggleMute() {
  if (V.deafened) {
    V.deafened = false;
    V.muted = false;
  } else V.muted = !V.muted;
  applyAudio();
}
function toggleDeafen() {
  V.deafened = !V.deafened;
  if (V.deafened) {
    V.prevMuted = V.muted;
    V.muted = true;
  } else V.muted = V.prevMuted;
  applyAudio();
}

// indicador de quem está falando
function watchLevel(id, stream) {
  if (!V.ctx || V.meters.has(id)) return;
  try {
    const src = V.ctx.createMediaStreamSource(stream);
    const an = V.ctx.createAnalyser();
    an.fftSize = 512;
    src.connect(an);
    V.meters.set(id, { an, src, buf: new Uint8Array(an.fftSize), on: false });
  } catch {}
}
const isSpeaking = (id) => !!(V.meters.get(id) || {}).on;
setInterval(() => {
  if (!V.room) return;
  V.meters.forEach((m, id) => {
    m.an.getByteTimeDomainData(m.buf);
    let sum = 0;
    for (const v of m.buf) sum += ((v - 128) / 128) ** 2;
    const on = Math.sqrt(sum / m.buf.length) > 0.035 && !(id === S.me && V.muted);
    if (on !== m.on) {
      m.on = on;
      document.querySelectorAll(`[data-speak="${id}"]`).forEach((el) => el.classList.toggle('speaking', on));
    }
  });
}, 100);

function tone(kind) {
  if (V.deafened) return;
  try {
    const ctx = V.ctx || (V.ctx = new AudioContext());
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const t = ctx.currentTime;
    const [a, b] = kind === 'join' ? [520, 780] : [660, 440];
    o.type = 'sine';
    o.frequency.setValueAtTime(a, t);
    o.frequency.setValueAtTime(b, t + 0.09);
    g.gain.setValueAtTime(0.07, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.3);
  } catch {}
}

// ---------- interface ----------
function render() {
  document.body.classList.toggle('offline', !S.online && !!S.name);
  renderGroups();
  renderSidebar();
  renderMain();
  renderMembers();
  updateTitle();
}

function updateTitle() {
  const n = [...S.rooms.values()].reduce((a, r) => a + r.unread, 0);
  document.title = n ? `(${n}) Resenha` : 'Resenha';
}

function renderGroups() {
  const items = S.groups
    .map((g) => {
      const r = S.rooms.get(g.code);
      const unread = r ? r.unread : 0;
      const cls = `${g.code === S.current ? 'active' : ''} ${unread ? 'unread' : ''}`;
      const badge = V.room === g.code
        ? `<span class="g-voice">${icon('volume', 11)}</span>`
        : unread && g.code !== S.current ? `<span class="g-badge">${unread > 99 ? '99+' : unread}</span>` : '';
      return `<button class="g-item ${cls}" data-code="${g.code}" title="${esc(g.title)}"><span class="g-pill"></span><span class="g-icon" style="--c:${color(g.title)}">${esc(initials(g.title))}</span>${badge}</button>`;
    })
    .join('');
  $('#groups').innerHTML =
    `<div class="g-item g-home" title="Resenha"><span class="g-icon"><img src="icon.svg" width="48" height="48" alt=""></span></div>` +
    `<div class="g-sep"></div>${items}` +
    `<button class="g-item g-add" data-act="add" title="Criar ou entrar em um grupo"><span class="g-icon">${icon('plus', 24)}</span></button>`;
}

function voiceStatus() {
  const states = [...V.peers.values()].map((p) => p.pc.connectionState);
  if (V.joining) return ['warn', 'Conectando…'];
  if (states.includes('failed')) return ['bad', 'Falha na conexão'];
  if (states.some((s) => s === 'new' || s === 'connecting')) return ['warn', 'Conectando…'];
  return ['', 'Voz conectada'];
}

function renderSidebar() {
  const r = S.current && S.rooms.get(S.current);
  const head = $('#groupHeader');
  const chans = $('#channels');
  if (!r) {
    head.innerHTML = `<span class="gh-title">Resenha</span>`;
    chans.innerHTML = `<div class="empty-side">Crie um grupo ou entre com o link que um amigo te mandou.</div>`;
  } else {
    head.innerHTML =
      `<span class="gh-title">${esc(r.title)}</span>` +
      `<button class="ib" data-act="invite" title="Convidar amigos">${icon('invite', 18)}</button>` +
      `<button class="ib" data-act="leave" title="Sair do grupo">${icon('logout', 18)}</button>`;
    const inVoice = [...r.members.values()].filter((m) => m.voice);
    const unread = r.unread && S.view !== 'chat';
    chans.innerHTML =
      `<div class="cat">Canais de texto</div>` +
      `<button class="chan ${S.view === 'chat' ? 'active' : ''} ${unread ? 'unread' : ''}" data-act="chat">${icon('hash', 20)}geral</button>` +
      `<div class="cat">Canais de voz</div>` +
      `<button class="chan ${S.view === 'voice' ? 'active' : ''}" data-act="voice">${icon('volume', 20)}Voz${inVoice.length ? `<span class="count">${inVoice.length}</span>` : ''}</button>` +
      `<div class="voice-users">${inVoice.map(voiceUser).join('')}</div>`;
  }

  const vp = $('#voicePanel');
  if (V.room) {
    const [cls, text] = voiceStatus();
    const vr = S.rooms.get(V.room);
    vp.hidden = false;
    vp.innerHTML =
      `<div class="vp-top"><div class="vp-info"><div class="vp-status ${cls}">${icon('signal', 16)}${text}</div>` +
      `<div class="vp-sub">Voz / ${esc(vr ? vr.title : '')}</div></div>` +
      `<button class="ib" data-act="hangup" title="Desconectar">${icon('hangup', 20)}</button></div>` +
      `<div class="vp-actions"><button class="vp-btn ${V.screen ? 'on' : ''}" data-act="share">${icon('screen', 18)}${V.screen ? 'Parar' : 'Tela'}</button>` +
      `<button class="vp-btn" data-act="goto-voice">${icon('users', 18)}Chamada</button></div>`;
  } else {
    vp.hidden = true;
    vp.innerHTML = '';
  }

  $('#userPanel').innerHTML =
    `<button class="up-user" data-act="rename" title="Mudar nome"><div class="avatar av32" style="background:${color(S.name)}">${esc([...S.name][0] || '?')}<span class="dot ${S.online ? 'on' : ''}"></span></div>` +
    `<div style="min-width:0"><div class="up-name">${esc(S.name)}</div><div class="up-status">${S.online ? 'Online' : 'Reconectando…'}</div></div></button>` +
    `<button class="ib ${V.muted ? 'danger' : ''}" data-act="mute" title="${V.muted ? 'Ativar microfone' : 'Silenciar microfone'}">${icon(V.muted ? 'micOff' : 'mic')}</button>` +
    `<button class="ib ${V.deafened ? 'danger' : ''}" data-act="deafen" title="${V.deafened ? 'Ativar áudio' : 'Desativar áudio'}">${icon(V.deafened ? 'headOff' : 'head')}</button>`;
}

function voiceUser(m) {
  const st = m.deafened ? icon('headOff', 14) : m.muted ? icon('micOff', 14) : '';
  return (
    `<div class="vu ${isSpeaking(m.id) ? 'speaking' : ''}" data-speak="${m.id}">${avatar(m.name, 24)}` +
    `<span class="name">${esc(m.name)}</span>${m.sharing ? '<span class="live">AO VIVO</span>' : ''}<span class="st">${st}</span></div>`
  );
}

function renderMain() {
  const r = S.current && S.rooms.get(S.current);
  $('#welcome').hidden = !!r;
  $('#chat').hidden = !r || S.view !== 'chat';
  $('#stage').hidden = !r || S.view !== 'voice';
  const menu = `<button class="ib menu-btn" data-act="menu" title="Menu">${icon('menu')}</button>`;
  const membersBtn = `<button class="ib members-btn" data-act="members" title="Membros">${icon('users')}</button>`;
  if (!r) {
    $('#mainHeader').innerHTML = `${menu}<div class="title">Resenha</div>`;
    $('#welcome').innerHTML =
      `<div class="welcome-card"><img src="icon.svg" alt=""><h1>E aí, ${esc(S.name || 'tudo certo')}!</h1>` +
      `<p>Crie um grupo e mande o link para os amigos, ou cole aqui o link que alguém te mandou.</p>` +
      `<div class="welcome-actions"><button class="btn primary" data-act="create">Criar grupo</button><button class="btn" data-act="add">Entrar com convite</button></div></div>`;
    return;
  }
  if (S.view === 'chat') {
    $('#mainHeader').innerHTML = `${menu}<div class="title">${icon('hash', 22)}geral<span class="sub">${esc(r.title)}</span></div>${membersBtn}`;
    const input = $('#input');
    input.disabled = !S.online;
    input.placeholder = S.online ? 'Conversar em #geral' : 'Sem conexão…';
    renderMessages();
  } else {
    $('#mainHeader').innerHTML = `${menu}<div class="title">${icon('volume', 22)}Voz<span class="sub">${esc(r.title)}</span></div>${membersBtn}`;
    renderStage();
  }
}

let lastRendered = null;
function renderMessages(forceBottom = false) {
  const box = $('#messages');
  const r = S.current && S.rooms.get(S.current);
  if (!r || S.view !== 'chat') return;
  const switched = lastRendered !== S.current;
  lastRendered = S.current;
  const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
  let html =
    `<div class="chat-start"><div class="chat-start-icon">${icon('hash', 40)}</div><h2>Bem-vindo a #geral!</h2>` +
    `<p>Começo do grupo ${esc(r.title)}. As mensagens não ficam salvas: quem chegar depois não vê o que foi dito antes.</p></div>`;
  let prev = null;
  for (const m of r.messages) {
    if (m.sys) {
      html += `<div class="msg-sys ${m.out ? 'out' : ''}">${icon(m.out ? 'arrowOut' : 'arrowIn', 16)}<span>${esc(m.text)}</span><span class="msg-time">${hhmm(m.ts)}</span></div>`;
      prev = null;
      continue;
    }
    if (prev && prev.from === m.from && m.ts - prev.ts < 5 * 60e3) {
      html += `<div class="msg cont"><span class="msg-htime">${hhmm(m.ts)}</span><div class="msg-text">${fmt(m.text)}</div></div>`;
    } else {
      html +=
        `<div class="msg">${avatar(m.name, 40)}<div class="msg-body"><div><span class="msg-author">${esc(m.name)}</span>` +
        `<span class="msg-time">${when(m.ts)}</span></div><div class="msg-text">${fmt(m.text)}</div></div></div>`;
    }
    prev = m;
  }
  box.innerHTML = html;
  if (forceBottom || switched || nearBottom) box.scrollTop = box.scrollHeight;
}

function renderStage() {
  const r = S.current && S.rooms.get(S.current);
  if (!r || S.view !== 'voice') return;
  const tiles = $('#tiles');
  const controls = $('#controls');
  const people = [...r.members.values()].filter((m) => m.voice);

  if (V.room !== S.current) {
    tiles.className = '';
    tiles.innerHTML =
      `<div class="stage-empty"><div class="stage-avatars">${people.map((m) => avatar(m.name, 40)).join('')}</div>` +
      `<h2>Voz</h2><p>${people.length ? `${people.length} ${people.length > 1 ? 'pessoas' : 'pessoa'} na chamada` : 'Ninguém na chamada ainda'}</p>` +
      `<button class="btn green" data-act="join" ${V.joining ? 'disabled' : ''}>${V.joining ? 'Conectando…' : 'Entrar na chamada'}</button></div>`;
    controls.innerHTML = '';
    return;
  }

  const focus = V.focus && V.videos.has(V.focus) ? V.focus : null;
  tiles.className = focus ? 'focus-mode' : '';
  tiles.innerHTML = '';
  const order = [...V.videos.keys()].sort((a, b) => (a === focus ? -1 : b === focus ? 1 : 0));
  for (const key of order) {
    const v = V.videos.get(key);
    const who = key === 'me' ? 'Sua tela' : `Tela de ${(r.members.get(v.peer) || {}).name || 'alguém'}`;
    const t = document.createElement('div');
    t.className = 'tile' + (key === focus ? ' focus' : '');
    t.dataset.key = key;
    t.innerHTML = `<div class="tile-label">${icon('screen', 14)}${esc(who)}</div><button class="tile-full" data-act="full" title="Tela cheia">${icon('expand', 18)}</button>`;
    t.prepend(v.el);
    tiles.append(t);
    v.el.play().catch(() => {});
  }
  for (const m of people) {
    const st = m.deafened ? icon('headOff', 14) : m.muted ? icon('micOff', 14) : '';
    tiles.insertAdjacentHTML(
      'beforeend',
      `<div class="tile ${isSpeaking(m.id) ? 'speaking' : ''}" data-speak="${m.id}">${avatar(m.name, 40)}` +
        `<div class="tile-label">${esc(m.name)}${m.id === S.me ? ' (você)' : ''}${st}</div></div>`,
    );
  }
  controls.innerHTML =
    `<button class="cbtn ${V.muted ? 'off' : ''}" data-act="mute" title="${V.muted ? 'Ativar microfone' : 'Silenciar'}">${icon(V.muted ? 'micOff' : 'mic', 24)}</button>` +
    `<button class="cbtn ${V.deafened ? 'off' : ''}" data-act="deafen" title="${V.deafened ? 'Ativar áudio' : 'Desativar áudio'}">${icon(V.deafened ? 'headOff' : 'head', 24)}</button>` +
    `<button class="cbtn ${V.screen ? 'on' : ''}" data-act="share" title="${V.screen ? 'Parar de compartilhar' : 'Compartilhar tela'}">${icon('screen', 24)}</button>` +
    `<button class="cbtn red" data-act="hangup" title="Sair da chamada">${icon('hangup', 26)}</button>`;
}

function renderMembers() {
  const r = S.current && S.rooms.get(S.current);
  const el = $('#members');
  el.hidden = !r;
  if (!r) {
    el.innerHTML = '';
    return;
  }
  const list = [...r.members.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  el.innerHTML =
    `<div class="cat">Online — ${list.length}</div>` +
    list
      .map(
        (m) =>
          `<div class="mem"><div class="avatar av32" style="background:${color(m.name)}">${esc([...m.name][0] || '?')}<span class="dot on"></span></div>` +
          `<span class="name">${esc(m.name)}${m.id === S.me ? ' <span class="me">(você)</span>' : ''}</span>` +
          `${m.voice ? `<span class="st" title="Na chamada">${icon('volume', 16)}</span>` : ''}</div>`,
      )
      .join('');
}

// ---------- modais ----------
function modal(html, bind, locked = false) {
  const m = $('#modal');
  m.innerHTML = `<div class="modal-card">${html}</div>`;
  m.hidden = false;
  m.dataset.locked = locked ? '1' : '';
  bind(m);
  const f = m.querySelector('input');
  if (f) f.focus();
}
function closeModal() {
  const m = $('#modal');
  m.hidden = true;
  m.innerHTML = '';
}

function askName(first) {
  modal(
    `<h2>${first ? 'Como seus amigos vão te chamar?' : 'Mudar nome'}</h2>` +
      `<p class="lead">Sem conta e sem senha. O nome fica salvo só neste navegador.</p>` +
      `<form><label for="fName">Seu nome</label><input id="fName" name="n" maxlength="32" required autocomplete="nickname" value="${esc(S.name)}">` +
      `<div class="modal-actions">${first ? '' : '<button type="button" class="btn link" data-close>Cancelar</button>'}` +
      `<button class="btn primary">${first ? 'Entrar' : 'Salvar'}</button></div></form>`,
    (m) => {
      m.querySelector('form').onsubmit = (e) => {
        e.preventDefault();
        const n = e.target.n.value.replace(/\s+/g, ' ').trim().slice(0, 32);
        if (!n) return;
        S.name = n;
        store.set('name', n);
        closeModal();
        if (first) connect();
        else send({ t: 'name', name: n });
        render();
      };
    },
    first,
  );
}

function askAdd(startWithCreate) {
  modal(
    `<h2>Criar ou entrar em um grupo</h2><p class="lead">Um grupo tem chat e canal de voz. Para falar só com um amigo, crie um grupo e mande o link para ele.</p>` +
      `<form id="fCreate"><label for="fTitle">Nome do novo grupo</label><div class="row"><input id="fTitle" name="t" maxlength="40" required placeholder="Ex.: Resenha dos amigos"><button class="btn primary">Criar</button></div></form>` +
      `<div class="or">ou</div>` +
      `<form id="fJoin"><label for="fCode">Link ou código do convite</label><div class="row"><input id="fCode" name="c" required placeholder="Cole o link aqui"><button class="btn">Entrar</button></div></form>`,
    (m) => {
      m.querySelector('#fCreate').onsubmit = (e) => {
        e.preventDefault();
        const title = e.target.t.value.replace(/\s+/g, ' ').trim().slice(0, 40);
        if (!title) return;
        const code = newCode();
        addGroup(code, title);
        select(code);
        showInvite(code);
      };
      m.querySelector('#fJoin').onsubmit = (e) => {
        e.preventDefault();
        const code = parseInvite(e.target.c.value);
        if (!code) return toast('Link ou código inválido.');
        addGroup(code, null);
        select(code);
        closeModal();
      };
    },
  );
  if (!startWithCreate) $('#fCode').focus();
}

const inviteLink = (code) => `${location.origin}${location.pathname}#${code}`;
function showInvite(code) {
  const link = inviteLink(code);
  const r = S.rooms.get(code);
  modal(
    `<h2>Convidar para ${esc(r ? r.title : 'o grupo')}</h2><p class="lead">Mande este link. Quem abrir coloca o nome e já entra no grupo.</p>` +
      `<label for="fLink">Link do convite</label><div class="row"><input id="fLink" readonly value="${esc(link)}"><button class="btn primary" data-copy>${icon('copy', 16)}Copiar</button></div>` +
      `<p class="hint">Código: <b>${code}</b></p>` +
      `<div class="modal-actions">${navigator.share ? '<button class="btn" data-share>Compartilhar…</button>' : ''}<button class="btn link" data-close>Pronto</button></div>`,
    (m) => {
      const inp = m.querySelector('#fLink');
      inp.onfocus = () => inp.select();
      m.querySelector('[data-copy]').onclick = async () => {
        try {
          await navigator.clipboard.writeText(link);
        } catch {
          inp.select();
          document.execCommand('copy');
        }
        toast('Link copiado!');
      };
      const sh = m.querySelector('[data-share]');
      if (sh) sh.onclick = () => navigator.share({ title: 'Resenha', text: 'Entra no grupo:', url: link }).catch(() => {});
    },
  );
}

function confirmLeave(code) {
  const r = S.rooms.get(code);
  modal(
    `<h2>Sair de ${esc(r ? r.title : 'grupo')}?</h2><p class="lead">O grupo some da sua lista. Para voltar, você vai precisar do link de novo.</p>` +
      `<div class="modal-actions"><button class="btn link" data-close>Cancelar</button><button class="btn danger" data-ok>Sair do grupo</button></div>`,
    (m) => {
      m.querySelector('[data-ok]').onclick = () => {
        if (V.room === code) leaveVoice();
        send({ t: 'leave', room: code });
        S.groups = S.groups.filter((g) => g.code !== code);
        saveGroups();
        S.rooms.delete(code);
        closeModal();
        select(S.groups.length ? S.groups[0].code : null);
      };
    },
  );
}

// ---------- navegação e eventos ----------
function select(code) {
  S.current = code;
  store.set('current', code);
  S.view = 'chat';
  const r = code && S.rooms.get(code);
  if (r) r.unread = 0;
  document.body.classList.remove('side-open');
  render();
  if (code) $('#input').focus({ preventScroll: true });
}
function showChat() {
  S.view = 'chat';
  const r = S.rooms.get(S.current);
  if (r) r.unread = 0;
  document.body.classList.remove('side-open');
  render();
}

const actions = {
  add: () => askAdd(false),
  create: () => askAdd(true),
  invite: () => S.current && showInvite(S.current),
  leave: () => S.current && confirmLeave(S.current),
  chat: showChat,
  voice: () => {
    document.body.classList.remove('side-open');
    if (V.room === S.current) {
      S.view = 'voice';
      render();
    } else joinVoice(S.current);
  },
  join: () => joinVoice(S.current),
  'goto-voice': () => {
    if (V.room) select(V.room);
    S.view = 'voice';
    render();
  },
  hangup: () => leaveVoice(),
  share: toggleShare,
  mute: toggleMute,
  deafen: toggleDeafen,
  rename: () => askName(false),
  menu: () => document.body.classList.toggle('side-open'),
  members: () => document.body.classList.toggle('hide-members'),
};

document.addEventListener('click', (e) => {
  const full = e.target.closest('[data-act="full"]');
  if (full) {
    const v = full.closest('.tile').querySelector('video');
    if (v && v.requestFullscreen) v.requestFullscreen().catch(() => {});
    return;
  }
  const act = e.target.closest('[data-act]');
  if (act && actions[act.dataset.act]) return actions[act.dataset.act]();
  const g = e.target.closest('[data-code]');
  if (g) return select(g.dataset.code);
  const tile = e.target.closest('.tile[data-key]');
  if (tile) {
    V.focus = V.focus === tile.dataset.key ? null : tile.dataset.key;
    return renderStage();
  }
  if (e.target.closest('[data-close]')) return closeModal();
  if (e.target.id === 'modal' && !e.target.dataset.locked) return closeModal();
  if (e.target.id === 'scrim') document.body.classList.remove('side-open');
});
document.addEventListener('dblclick', (e) => {
  const v = e.target.closest('.tile video, .tile[data-key]');
  const video = v && (v.tagName === 'VIDEO' ? v : v.querySelector('video'));
  if (video && video.requestFullscreen) video.requestFullscreen().catch(() => {});
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('#modal').hidden && !$('#modal').dataset.locked) closeModal();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden || S.view !== 'chat') return;
  const r = S.rooms.get(S.current);
  if (r && r.unread) {
    r.unread = 0;
    renderGroups();
    updateTitle();
  }
});

const input = $('#input');
function autosize() {
  input.style.height = 'auto';
  input.style.height = input.scrollHeight + 'px';
}
input.addEventListener('input', autosize);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || !S.current || !S.online) return;
    send({ t: 'msg', room: S.current, text });
    input.value = '';
    autosize();
  }
});
$('#composer').addEventListener('submit', (e) => e.preventDefault());

// ---------- início ----------
fetch('/config')
  .then((r) => r.json())
  .then((c) => (S.ice = c.iceServers))
  .catch(() => {});

(function start() {
  const invite = parseInvite(location.hash);
  if (invite) {
    if (!S.groups.some((g) => g.code === invite)) S.groups.push({ code: invite, title: invite });
    saveGroups();
    S.current = invite;
    store.set('current', invite);
    history.replaceState(null, '', location.pathname + location.search);
  }
  if (S.current && !S.groups.some((g) => g.code === S.current)) S.current = null;
  if (!S.current && S.groups.length) S.current = S.groups[0].code;
  S.groups.forEach((g) => room(g.code));
  render();
  if (!S.name) askName(true);
  else connect();
})();

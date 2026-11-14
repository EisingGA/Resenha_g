// Resenha: servidor leve que entrega o site, repassa o chat e apresenta os PCs uns aos outros (sinalização WebRTC).
// Nada é salvo: grupos e mensagens vivem só na memória enquanto alguém estiver conectado.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function iceServers() {
  const list = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] }];
  if (process.env.TURN_URL) {
    list.push({
      urls: process.env.TURN_URL.split(',').map((u) => u.trim()),
      username: process.env.TURN_USER,
      credential: process.env.TURN_PASS,
    });
  }
  return list;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/config') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    return res.end(JSON.stringify({ iceServers: iceServers() }));
  }
  if (url.pathname === '/health') {
    res.writeHead(200);
    return res.end('ok');
  }
  let rel;
  try {
    rel = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  } catch {
    res.writeHead(400);
    return res.end();
  }
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC + path.sep)) {
    res.writeHead(403);
    return res.end();
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Não encontrado');
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

// ---------- estado em memória ----------
const clients = new Map(); // id -> { ws, id, name, rooms:Set, voice, muted, deafened, sharing, tokens, last }
const rooms = new Map(); // código -> { title, members:Set<id> }

const clean = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const validCode = (c) => typeof c === 'string' && /^[a-z0-9]{4,16}$/.test(c);

function send(c, msg) {
  if (c.ws.readyState === 1) c.ws.send(JSON.stringify(msg));
}
function toRoom(code, msg, exceptId) {
  const r = rooms.get(code);
  if (!r) return;
  const data = JSON.stringify(msg);
  for (const id of r.members) {
    const c = clients.get(id);
    if (c && id !== exceptId && c.ws.readyState === 1) c.ws.send(data);
  }
}
function info(c, code) {
  const inVoice = c.voice === code;
  return { id: c.id, name: c.name, voice: inVoice, muted: c.muted, deafened: c.deafened, sharing: inVoice && c.sharing };
}
function broadcastMember(c) {
  for (const code of c.rooms) toRoom(code, { t: 'member', room: code, member: info(c, code) });
}
function voiceLeave(c) {
  if (!c.voice) return;
  c.voice = null;
  c.sharing = false;
  broadcastMember(c);
}
function leaveRoom(c, code) {
  if (!c.rooms.has(code)) return;
  if (c.voice === code) voiceLeave(c);
  c.rooms.delete(code);
  const r = rooms.get(code);
  if (!r) return;
  r.members.delete(c.id);
  if (r.members.size === 0) rooms.delete(code);
  else toRoom(code, { t: 'member-leave', room: code, id: c.id });
}
// no máximo ~5 mensagens por segundo, com rajada de 10
function allow(c) {
  const now = Date.now();
  c.tokens = Math.min(10, c.tokens + ((now - c.last) / 1000) * 5);
  c.last = now;
  if (c.tokens < 1) return false;
  c.tokens -= 1;
  return true;
}

const handlers = {
  name(c, m) {
    c.name = clean(m.name, 32) || 'Anônimo';
    broadcastMember(c);
  },
  join(c, m) {
    if (!validCode(m.room)) return send(c, { t: 'error', text: 'Código de grupo inválido.' });
    let r = rooms.get(m.room);
    if (!r) rooms.set(m.room, (r = { title: clean(m.title, 40) || m.room, members: new Set() }));
    const isNew = !r.members.has(c.id);
    r.members.add(c.id);
    c.rooms.add(m.room);
    const members = [...r.members].map((id) => info(clients.get(id), m.room));
    send(c, { t: 'joined', room: m.room, title: r.title, members });
    if (isNew) toRoom(m.room, { t: 'member', room: m.room, member: info(c, m.room), joined: true }, c.id);
  },
  leave(c, m) {
    leaveRoom(c, m.room);
  },
  msg(c, m) {
    if (!c.rooms.has(m.room)) return;
    const text = String(m.text ?? '').trim().slice(0, 2000);
    if (!text) return;
    if (!allow(c)) return send(c, { t: 'error', text: 'Calma! Você está mandando mensagens rápido demais.' });
    toRoom(m.room, { t: 'msg', room: m.room, from: c.id, name: c.name, text, ts: Date.now() });
  },
  'voice-join'(c, m) {
    if (!c.rooms.has(m.room)) return;
    if (c.voice && c.voice !== m.room) voiceLeave(c);
    c.voice = m.room;
    c.sharing = false;
    const peers = [...rooms.get(m.room).members].filter((id) => id !== c.id && clients.get(id).voice === m.room);
    send(c, { t: 'voice-peers', room: m.room, peers });
    broadcastMember(c);
  },
  'voice-leave'(c) {
    voiceLeave(c);
  },
  state(c, m) {
    c.muted = !!m.muted;
    c.deafened = !!m.deafened;
    c.sharing = !!m.sharing && !!c.voice;
    broadcastMember(c);
  },
  signal(c, m) {
    const target = clients.get(m.to);
    // só repassa entre pessoas que estão na mesma chamada
    if (!target || !c.voice || target.voice !== c.voice) return;
    send(target, { t: 'signal', from: c.id, data: m.data });
  },
};

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 256 * 1024 });

wss.on('connection', (ws) => {
  let c = null;
  ws.alive = true;
  ws.on('pong', () => (ws.alive = true));
  ws.on('message', (raw) => {
    let m;
    try {
      m = JSON.parse(raw);
    } catch {
      return;
    }
    if (!m || typeof m !== 'object') return;
    if (!c) {
      if (m.t !== 'hello') return;
      c = {
        ws,
        id: crypto.randomBytes(6).toString('hex'),
        name: clean(m.name, 32) || 'Anônimo',
        rooms: new Set(),
        voice: null,
        muted: false,
        deafened: false,
        sharing: false,
        tokens: 10,
        last: Date.now(),
      };
      clients.set(c.id, c);
      return send(c, { t: 'welcome', id: c.id });
    }
    const h = handlers[m.t];
    if (h) h(c, m);
  });
  ws.on('close', () => {
    if (!c) return;
    for (const code of [...c.rooms]) leaveRoom(c, code);
    clients.delete(c.id);
  });
});

// mantém a conexão viva atrás de proxies (Render, Fly...) e derruba quem sumiu
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.alive) {
      ws.terminate();
      continue;
    }
    ws.alive = false;
    ws.ping();
  }
}, 25000);

server.listen(PORT, () => console.log(`Resenha rodando em http://localhost:${PORT}`));

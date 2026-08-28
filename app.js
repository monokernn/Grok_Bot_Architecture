(function () {
  'use strict';

  const byId = function (id) { return document.getElementById(id); };
  const config = window.ARCHITECTURE_CONFIG || {};
  const apiBase = String(config.apiBase || '').replace(/\/$/, '');
  const stateUrl = apiBase + '/api/state';
  const TOKEN_ADDRESS = 'AP8Wnu37Gf9RHgugPKGvpHe6LcTE2yp5GDy7pL5Upump';
  const PRICE_URL = 'https://api.dexscreener.com/tokens/v1/solana/' + TOKEN_ADDRESS;
  const DEX_FALLBACK_URL = 'https://dexscreener.com/search?q=' + encodeURIComponent(TOKEN_ADDRESS);
  const MARKET_MONITOR = { x: 514, y: 10, w: 380, h: 120 };
  const pollInterval = Math.max(650, Number(config.pollIntervalMs) || 900);
  const canvas = byId('stationCanvas');
  const ctx = canvas.getContext('2d');
  const COLORS = {
    helm: '#ff6557',
    scout: '#a6df55',
    archive: '#b798ff',
    forge: '#f3ad3d',
    sentinel: '#a48cff',
    relay: '#53a9e9',
    cyan: '#52d5c9',
    acid: '#b9e65a',
    amber: '#f1bd57',
    red: '#ff6557'
  };
  const homes = {
    helm: [160, 245], scout: [500, 235], archive: [835, 245],
    forge: [165, 468], sentinel: [500, 475], relay: [835, 468]
  };
  const agents = Object.keys(homes).map(function (id) {
    return {
      id: id,
      name: id.toUpperCase(),
      role: 'Council specialist',
      color: COLORS[id],
      x: homes[id][0],
      y: homes[id][1],
      tx: homes[id][0],
      ty: homes[id][1],
      task: 'Waiting for backend state.',
      thought: 'standing by',
      state: 'ACTIVE',
      moving: false,
      speed: 0,
      initialized: false
    };
  });
  const ui = {
    backend: null,
    cycleId: null,
    selectedAgent: 'helm',
    serverOffset: 0,
    connected: false,
    lastSuccess: 0,
    lastFrame: performance.now(),
    lastEventIds: new Set(),
    links: [],
    marketHover: false
  };
  const market = {
    livePrice: null,
    liveChange24h: null,
    pairUrl: DEX_FALLBACK_URL,
    priceStatus: 'FETCHING',
    priceUpdatedAt: 0,
    pnl: 34,
    pnlVelocity: 0,
    pnlHistory: [],
    candles: [],
    trainingStep: 0,
    trainingProgress: 0,
    trainingLoss: .0824
  };

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function initializeMarketTape() {
    let value = 100;
    for (let index = 0; index < 34; index += 1) {
      const open = value;
      const close = clamp(open + (Math.random() - .48) * 7, 72, 132);
      const high = Math.max(open, close) + Math.random() * 4.5;
      const low = Math.min(open, close) - Math.random() * 4.5;
      market.candles.push({ open, high, low, close });
      value = close;
    }
    for (let index = 0; index < 40; index += 1) market.pnlHistory.push(market.pnl);
  }

  function updateMarketTape() {
    market.trainingStep += 1;
    market.trainingProgress = (market.trainingProgress + 1.7 + Math.random() * 2.8) % 100;
    market.trainingLoss = clamp(market.trainingLoss * (.987 + Math.random() * .015), .009, .12);

    const centerPull = (72 - market.pnl) * .018;
    market.pnlVelocity = market.pnlVelocity * .58 + (Math.random() - .49) * 19 + centerPull;
    market.pnl = clamp(market.pnl + market.pnlVelocity, -20, 200);
    market.pnlHistory.push(market.pnl);
    if (market.pnlHistory.length > 48) market.pnlHistory.shift();

    const previous = market.candles[market.candles.length - 1];
    const open = previous ? previous.close : 100;
    const trendPull = (104 - open) * .035;
    const close = clamp(open + (Math.random() - .49) * 8 + trendPull, 68, 138);
    const high = Math.max(open, close) + 1 + Math.random() * 5;
    const low = Math.min(open, close) - 1 - Math.random() * 5;
    market.candles.push({ open, high, low, close });
    if (market.candles.length > 38) market.candles.shift();
  }

  function formatTokenPrice(value) {
    if (!Number.isFinite(value)) return 'PRICE UNAVAILABLE';
    if (value < .000001) return '$' + value.toFixed(10);
    if (value < .001) return '$' + value.toFixed(8);
    if (value < 1) return '$' + value.toFixed(6);
    return '$' + value.toFixed(2);
  }

  async function fetchLiveTokenPrice() {
    try {
      const response = await fetch(PRICE_URL, { cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const pairs = await response.json();
      const available = Array.isArray(pairs)
        ? pairs.filter(function (pair) { return Number.isFinite(Number(pair.priceUsd)); })
        : [];
      if (!available.length) throw new Error('No priced pool');
      available.sort(function (left, right) {
        return Number(right.liquidity && right.liquidity.usd || 0) - Number(left.liquidity && left.liquidity.usd || 0);
      });
      market.livePrice = Number(available[0].priceUsd);
      market.liveChange24h = Number(available[0].priceChange && available[0].priceChange.h24);
      market.pairUrl = available[0].url || DEX_FALLBACK_URL;
      market.priceStatus = 'LIVE';
      market.priceUpdatedAt = Date.now();
    } catch (error) {
      market.priceStatus = market.livePrice === null ? 'PRICE OFFLINE' : 'STALE';
    }
  }

  function agentById(id) {
    return agents.find(function (agent) { return agent.id === id; });
  }

  function concise(text, limit) {
    const value = String(text || 'standing by').replace(/\s+/g, ' ').replace(/[.;:]$/, '').trim();
    return value.length > limit ? value.slice(0, limit - 1) + '…' : value;
  }

  function setConnection(mode, detail) {
    const root = byId('connectionState');
    root.classList.toggle('connected', mode === 'connected');
    root.classList.toggle('connection-error', mode === 'error');
    root.querySelector('b').textContent = mode === 'connected' ? 'PRIVATE BACKEND ONLINE' : mode === 'error' ? 'BACKEND RECONNECTING' : 'CONNECTING BACKEND';
    root.querySelector('small').textContent = detail || 'PUBLIC OPERATIONS FLOOR';
    byId('operationState').textContent = mode === 'connected' ? 'RUNNING' : mode === 'error' ? 'RECONNECTING' : 'LINKING';
    byId('networkState').textContent = mode === 'connected' ? 'STREAMING' : 'LINKING';
    byId('feedState').textContent = mode === 'connected' ? 'STREAMING' : 'RETRYING';
  }

  function renderRoster() {
    const root = byId('agentRoster');
    root.textContent = '';
    agents.forEach(function (agent) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'agent-row' + (ui.selectedAgent === agent.id ? ' active' : '') + ' working';
      button.style.setProperty('--agent', agent.color);
      button.setAttribute('aria-label', 'Inspect ' + agent.name);
      const avatar = document.createElement('span');
      avatar.className = 'agent-pixel';
      avatar.style.setProperty('--agent', agent.color);
      const copy = document.createElement('span');
      const name = document.createElement('b');
      name.textContent = agent.name;
      const role = document.createElement('small');
      role.textContent = agent.role;
      copy.append(name, role);
      const dot = document.createElement('i');
      dot.className = 'agent-state';
      button.append(avatar, copy, dot);
      button.addEventListener('click', function () {
        ui.selectedAgent = agent.id;
        renderRoster();
        renderInspector();
      });
      root.appendChild(button);
    });
  }

  function renderInspector() {
    const agent = agentById(ui.selectedAgent) || agents[0];
    byId('inspectorAvatar').style.setProperty('--agent', agent.color);
    byId('inspectorName').textContent = agent.name;
    byId('inspectorRole').textContent = agent.role;
    byId('inspectorTask').textContent = agent.task;
  }

  function eventTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function createFeedItem(event) {
    const agent = agentById(event.agent) || agents[0];
    const item = document.createElement('article');
    item.className = 'feed-item feed-' + event.kind;
    item.style.setProperty('--agent', agent.color);
    item.dataset.eventId = event.id;
    const marker = document.createElement('i');
    marker.className = 'feed-marker';
    const copy = document.createElement('div');
    const head = document.createElement('header');
    const label = document.createElement('b');
    label.textContent = agent.name + (event.to ? ' → ' + event.to.toUpperCase() : '');
    const time = document.createElement('time');
    time.textContent = eventTime(event.timestamp);
    head.append(label, time);
    const message = document.createElement('p');
    message.textContent = event.message;
    copy.append(head, message);
    item.append(marker, copy);
    return item;
  }

  function reconcileFeed(events, cycleChanged) {
    const root = byId('liveFeed');
    if (cycleChanged) {
      root.textContent = '';
      ui.lastEventIds.clear();
    }
    events.forEach(function (event) {
      if (ui.lastEventIds.has(event.id)) return;
      if (root.querySelector('.feed-empty')) root.textContent = '';
      root.appendChild(createFeedItem(event));
      ui.lastEventIds.add(event.id);
    });
    while (root.children.length > 28) root.firstElementChild.remove();
    if (events.length) root.scrollTop = root.scrollHeight;
  }

  function updateFromBackend(data) {
    const cycleChanged = ui.cycleId !== data.cycle.id;
    ui.backend = data;
    ui.serverOffset = data.serverTime - Date.now();
    ui.cycleId = data.cycle.id;
    ui.connected = true;
    ui.lastSuccess = Date.now();
    ui.links = Array.isArray(data.links) ? data.links : [];
    setConnection('connected', 'PUBLIC OPERATIONS FLOOR');

    data.agents.forEach(function (remote) {
      const local = agentById(remote.id);
      if (!local) return;
      local.name = remote.name;
      local.role = remote.role;
      local.color = remote.color || COLORS[remote.id];
      const remoteMoving = Boolean(remote.moving);
      const movementChanged = local.initialized && local.moving !== remoteMoving;
      const drift = Math.hypot(local.x - remote.x, local.y - remote.y);
      if (!local.initialized || movementChanged || drift > 48) {
        local.x = remote.x;
        local.y = remote.y;
        local.initialized = true;
      }
      local.tx = Number.isFinite(remote.targetX) ? remote.targetX : remote.x;
      local.ty = Number.isFinite(remote.targetY) ? remote.targetY : remote.y;
      local.moving = remoteMoving;
      local.speed = Number.isFinite(remote.speed) ? remote.speed : 0;
      local.actionEndsAt = remote.actionEndsAt;
      local.location = remote.location;
      local.task = remote.task;
      local.thought = remote.thought || concise(remote.task, 30);
      local.state = remote.state;
    });

    byId('cycleId').textContent = 'NETWORK ACTIVE';
    byId('cycleTitle').textContent = data.cycle.title;
    byId('cycleSummary').textContent = data.cycle.summary;
    byId('sourceState').textContent = 'ACTIVE';
    byId('sourceTitle').textContent = data.cycle.title;
    byId('sourceDetail').textContent = data.cycle.source;
    byId('sourceCount').textContent = String(data.metrics.sources).padStart(2, '0');
    byId('checkCount').textContent = String(data.metrics.checks).padStart(2, '0');
    byId('handoffCount').textContent = String(data.metrics.handoffs).padStart(2, '0');
    byId('confidenceValue').textContent = data.metrics.confidence + '%';

    reconcileFeed(data.events, cycleChanged);
    renderRoster();
    renderInspector();
  }

  async function pollBackend() {
    try {
      const response = await fetch(stateUrl, { cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      if (!data || !data.cycle || !Array.isArray(data.agents)) throw new Error('Invalid state document');
      updateFromBackend(data);
    } catch (error) {
      ui.connected = false;
      setConnection('error', 'RETRYING · ' + error.message);
      byId('sourceState').textContent = 'RETRYING';
    }
  }

  function line(x1, y1, x2, y2, color, width) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 1;
    ctx.stroke();
  }

  function drawWindow(x, y, w, h, time) {
    ctx.fillStyle = '#080b0e';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#292b2a';
    ctx.strokeRect(x + .5, y + .5, w, h);
    ctx.fillStyle = '#d8d8d0';
    ctx.beginPath();
    ctx.arc(x + w - 26, y + 19, 9, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 24; i += 1) {
      const bx = x + 7 + (i * 41 % (w - 14));
      const bh = 5 + (i * 13 % 26);
      const lit = Math.sin(time / 650 + i * 2.7) > .22;
      ctx.fillStyle = lit ? (i % 4 ? '#73794b' : '#a99c55') : '#333724';
      ctx.fillRect(bx, y + h - bh - 4, 4, bh);
    }
  }

  function drawMonitorFrame(x, y, w, h, title) {
    ctx.fillStyle = '#070b0b';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#343c39';
    ctx.strokeRect(x + .5, y + .5, w, h);
    ctx.fillStyle = '#7e8c82';
    ctx.font = 'bold 9px Consolas';
    ctx.fillText(title, x + 10, y + 15);
    ctx.strokeStyle = '#1f2824';
    line(x + 8, y + 18, x + w - 8, y + 18, '#1f2824', 1);
  }

  function drawTrainingMonitor(x, y, w, h, time) {
    const stages = ['MEMECOIN ENTRY POLICY', 'LIQUIDITY FILTER', 'SOCIAL SIGNAL RANKER', 'RISK EXIT MODEL'];
    const stage = stages[Math.floor(market.trainingStep / 17) % stages.length];
    drawMonitorFrame(x, y, w, h, 'MODEL TRAINING / PAPER MARKET');
    ctx.fillStyle = '#a8d965';
    ctx.font = 'bold 12px Consolas';
    ctx.fillText(stage, x + 10, y + 39);
    ctx.fillStyle = '#58635a';
    ctx.font = '8px Consolas';
    ctx.fillText('EPOCH ' + String(market.trainingStep + 1).padStart(4, '0'), x + 10, y + 57);
    ctx.fillText('LOSS ' + market.trainingLoss.toFixed(4), x + w - 82, y + 57);
    ctx.fillStyle = '#182019';
    ctx.fillRect(x + 10, y + 67, w - 20, 10);
    ctx.fillStyle = '#83bd61';
    ctx.fillRect(x + 10, y + 67, (w - 20) * market.trainingProgress / 100, 10);
    ctx.fillStyle = '#8d978c';
    ctx.font = '8px Consolas';
    ctx.fillText(Math.floor(market.trainingProgress) + '% · REPLAYING MARKET EPISODES', x + 10, y + 96);
    const pulse = 2 + Math.sin(time / 180) * 1.4;
    ctx.fillStyle = '#b9e65a';
    ctx.beginPath();
    ctx.arc(x + w - 13, y + 11, pulse, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPnlMonitor(x, y, w, h) {
    drawMonitorFrame(x, y, w, h, 'PAPER PNL / TRAINING WALLET');
    const positive = market.pnl >= 0;
    const color = positive ? '#76dda0' : '#ef746c';
    const sign = market.pnl > 0 ? '+' : '';
    ctx.fillStyle = color;
    ctx.font = 'bold 24px Consolas';
    ctx.fillText(sign + '$' + market.pnl.toFixed(2), x + 10, y + 48);
    ctx.fillStyle = '#5f6a62';
    ctx.font = '8px Consolas';
    ctx.fillText('RANGE  -$20  /  +$200', x + 10, y + 63);

    const values = market.pnlHistory;
    if (values.length < 2) return;
    const gx = x + 10, gy = y + 70, gw = w - 20, gh = h - 78;
    ctx.strokeStyle = '#1e2924';
    line(gx, gy + gh / 2, gx + gw, gy + gh / 2, '#1e2924', 1);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    values.forEach(function (value, index) {
      const px = gx + index / (values.length - 1) * gw;
      const py = gy + gh - (value + 20) / 220 * gh;
      if (index) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    });
    ctx.stroke();
  }

  function drawMarketMonitor(x, y, w, h) {
    ctx.fillStyle = ui.marketHover ? '#0a130d' : '#070b0b';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = ui.marketHover ? '#b9e65a' : '#4d624e';
    ctx.lineWidth = ui.marketHover ? 2 : 1;
    ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
    ctx.lineWidth = 1;
    ctx.fillStyle = '#d9ff83';
    ctx.font = 'bold 15px Consolas';
    ctx.fillText('$ARCHITECTURE', x + 10, y + 19);
    ctx.fillStyle = '#7d9180';
    ctx.font = 'bold 8px Consolas';
    ctx.fillText('LIVE TOKEN MARKET', x + 11, y + 32);
    const price = formatTokenPrice(market.livePrice);
    const change = market.liveChange24h;
    const changeText = Number.isFinite(change) ? (change >= 0 ? '+' : '') + change.toFixed(2) + '% 24H' : market.priceStatus;
    ctx.textAlign = 'right';
    ctx.fillStyle = market.priceStatus === 'LIVE' ? '#c8ef76' : '#d4aa62';
    ctx.font = 'bold 14px Consolas';
    ctx.fillText(price, x + w - 10, y + 19);
    ctx.fillStyle = Number.isFinite(change) && change < 0 ? '#ef746c' : '#76dda0';
    ctx.font = 'bold 8px Consolas';
    ctx.fillText(changeText, x + w - 10, y + 32);
    ctx.textAlign = 'left';

    const candles = market.candles;
    if (!candles.length) return;
    const gx = x + 10, gy = y + 39, gw = w - 20, gh = h - 55;
    let minimum = Infinity, maximum = -Infinity;
    candles.forEach(function (candle) {
      minimum = Math.min(minimum, candle.low);
      maximum = Math.max(maximum, candle.high);
    });
    const range = Math.max(1, maximum - minimum);
    const step = gw / candles.length;
    ctx.strokeStyle = '#18231e';
    for (let row = 1; row < 4; row += 1) line(gx, gy + row * gh / 4, gx + gw, gy + row * gh / 4, '#18231e', 1);
    candles.forEach(function (candle, index) {
      const cx = gx + index * step + step / 2;
      const highY = gy + (maximum - candle.high) / range * gh;
      const lowY = gy + (maximum - candle.low) / range * gh;
      const openY = gy + (maximum - candle.open) / range * gh;
      const closeY = gy + (maximum - candle.close) / range * gh;
      const rising = candle.close >= candle.open;
      const color = rising ? '#68c99c' : '#e06e65';
      ctx.strokeStyle = color;
      line(cx, highY, cx, lowY, color, 1);
      ctx.fillStyle = color;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(2, Math.abs(closeY - openY));
      ctx.fillRect(cx - Math.max(1, step * .27), bodyTop, Math.max(2, step * .54), bodyHeight);
    });
    ctx.fillStyle = '#5c685f';
    ctx.font = 'bold 7px Consolas';
    ctx.fillText('LIVE PRICE · SYNTHETIC CANDLES', gx, y + h - 5);
    ctx.textAlign = 'right';
    ctx.fillStyle = ui.marketHover ? '#d9ff83' : '#8faa75';
    ctx.fillText('OPEN DEXSCREENER ↗', x + w - 10, y + h - 5);
    ctx.textAlign = 'left';
  }

  function drawWallMonitor(x, y, w, h, time) {
    const phase = time / 720;
    ctx.fillStyle = '#080b0c';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#292d2d';
    ctx.strokeRect(x + .5, y + .5, w, h);
    ctx.fillStyle = '#696d68';
    ctx.font = '9px Consolas';
    ctx.fillText('FLOOR MONITOR / LIVE THROUGHPUT', x + 11, y + 15);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 8, y + 19, w - 16, h - 25);
    ctx.clip();
    ctx.strokeStyle = '#6f9f82';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 38; i += 1) {
      const px = x + 9 + i * 9 - (time / 70 % 9);
      const py = y + h * .64 - Math.sin(i * .63 + phase) * 12 - Math.sin(i * .19 + phase * .45) * 8;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.stroke();
    ctx.strokeStyle = '#526f8d';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = 0; i < 38; i += 1) {
      const px = x + 9 + i * 9 - (time / 105 % 9);
      const py = y + h * .7 - Math.cos(i * .48 + phase * .72) * 10;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.stroke();
    ctx.fillStyle = COLORS.acid;
    ctx.fillRect(x + 10 + (time / 9 % (w - 25)), y + 22, 2, h - 31);
    ctx.restore();
  }

  function drawClock(x, y) {
    const now = new Date(Date.now() + ui.serverOffset);
    const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
    const minutes = now.getMinutes() + seconds / 60;
    const hours = now.getHours() % 12 + minutes / 60;
    ctx.fillStyle = '#d7d2b9';
    ctx.beginPath(); ctx.arc(x, y, 34, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#534936'; ctx.lineWidth = 6; ctx.stroke();
    for (let i = 0; i < 12; i += 1) {
      const angle = i * Math.PI / 6;
      ctx.fillStyle = '#665d49';
      ctx.fillRect(x + Math.sin(angle) * 25 - 1, y - Math.cos(angle) * 25 - 1, 3, 3);
    }
    function hand(angle, length, width, color) {
      line(x, y, x + Math.sin(angle) * length, y - Math.cos(angle) * length, color, width);
    }
    hand(hours * Math.PI / 6, 17, 4, '#332c20');
    hand(minutes * Math.PI / 30, 24, 2.5, '#332c20');
    hand(seconds * Math.PI / 30, 26, 1, COLORS.red);
  }

  function drawDesk(cx, cy, label, color) {
    const x = cx - 112;
    const y = cy - 72;
    const w = 224;
    ctx.fillStyle = '#211b15';
    ctx.fillRect(x, y, w, 58);
    ctx.strokeStyle = '#493928';
    ctx.strokeRect(x + .5, y + .5, w, 58);
    ctx.fillStyle = '#4a3724';
    ctx.fillRect(x - 6, y + 41, w + 12, 10);
    ctx.fillStyle = '#2c2118';
    ctx.fillRect(x, y + 51, w, 17);
    for (let i = 0; i < 6; i += 1) {
      ctx.fillStyle = i % 2 ? color : '#6b5740';
      ctx.fillRect(x + 10 + i * 31, y + 26 - (i % 3) * 5, 20, 5 + (i % 3) * 5);
    }
    ctx.fillStyle = '#111719';
    ctx.fillRect(x + 15, y - 7, 59, 33);
    ctx.strokeStyle = '#2c3738';
    ctx.strokeRect(x + 15.5, y - 6.5, 59, 33);
    ctx.fillStyle = color;
    ctx.fillRect(x + 22, y + 1, 39, 4);
    ctx.fillRect(x + 22 + (performance.now() / 35 % 36), y + 8, 2, 12);
    ctx.fillStyle = '#17130f';
    ctx.fillRect(x + w - 68, y + 4, 53, 30);
    ctx.fillStyle = '#d0cbc0';
    ctx.fillRect(x + w - 61, y + 9, 15, 17);
    ctx.fillStyle = '#8f8b82';
    ctx.fillRect(x + w - 40, y + 13, 18, 13);
    ctx.fillStyle = '#080908';
    ctx.fillRect(cx - 55, cy + 15, 110, 17);
    ctx.fillStyle = '#c4c4bd';
    ctx.font = 'bold 10px Consolas';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, cy + 27);
    ctx.textAlign = 'left';
  }

  function drawServerRack(x, y) {
    ctx.fillStyle = '#101415';
    ctx.fillRect(x - 25, y, 38, 170);
    ctx.strokeStyle = '#333b3b';
    ctx.strokeRect(x - 24.5, y + .5, 38, 170);
    for (let i = 0; i < 13; i += 1) {
      ctx.fillStyle = i % 3 === 0 ? COLORS.acid : '#263232';
      ctx.fillRect(x - 18, y + 9 + i * 12, 5, 3);
      ctx.fillStyle = '#343b3c';
      ctx.fillRect(x - 7, y + 9 + i * 12, 13, 3);
    }
  }

  function drawPlant(x, y) {
    ctx.fillStyle = '#4a3524'; ctx.fillRect(x - 10, y + 24, 20, 18);
    ctx.fillStyle = '#314b32'; ctx.fillRect(x - 3, y, 7, 28);
    ctx.fillRect(x - 16, y + 5, 14, 7); ctx.fillRect(x + 3, y + 10, 16, 7); ctx.fillRect(x - 11, y - 6, 10, 9);
  }

  function drawRoom(time) {
    ctx.fillStyle = '#090a09';
    ctx.fillRect(0, 0, 1000, 620);
    ctx.fillStyle = '#13110f';
    ctx.fillRect(0, 0, 1000, 152);
    ctx.strokeStyle = '#241e18';
    for (let y = 152; y < 620; y += 25) line(0, y, 1000, y, '#241e18', 1);
    for (let x = -80; x < 1080; x += 75) line(x, 152, x + 30, 620, '#201c18', 1);
    drawTrainingMonitor(14, 10, 270, 120, time);
    drawPnlMonitor(294, 10, 210, 120);
    drawMarketMonitor(MARKET_MONITOR.x, MARKET_MONITOR.y, MARKET_MONITOR.w, MARKET_MONITOR.h);
    drawClock(950, 70);
    ctx.fillStyle = '#080908';
    ctx.fillRect(0, 136, 1000, 16);
    ctx.fillStyle = '#77736a';
    ctx.font = 'bold 9px Consolas';
    ctx.fillText('GROK BOT $ARCHITECTURE · ONE NETWORK · SIX AGENTS · FLOOR STATUS: ACTIVE', 30, 148);
    [165, 500, 835].forEach(function (x) {
      ctx.fillStyle = '#d7c28b10';
      ctx.beginPath();
      ctx.moveTo(x - 15, 152);
      ctx.lineTo(x - 100, 400);
      ctx.lineTo(x + 100, 400);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#6c5c3b';
      ctx.fillRect(x - 20, 148, 40, 6);
    });
    drawDesk(165, 245, 'COMMAND DESK', COLORS.helm);
    drawDesk(500, 235, 'SIGNAL DESK', COLORS.scout);
    drawDesk(835, 245, 'CONTEXT DESK', COLORS.archive);
    drawDesk(165, 468, 'BUILD DESK', COLORS.forge);
    drawDesk(500, 475, 'AUDIT DESK', COLORS.sentinel);
    drawDesk(835, 468, 'RELEASE DESK', COLORS.relay);
    ctx.fillStyle = '#191511';
    ctx.fillRect(380, 292, 240, 82);
    ctx.strokeStyle = '#51402e';
    ctx.strokeRect(380.5, 292.5, 240, 82);
    ctx.fillStyle = '#3b2c20';
    ctx.fillRect(393, 305, 214, 56);
    ctx.fillStyle = '#d3ccba';
    ctx.fillRect(470, 316, 24, 31);
    ctx.fillStyle = '#918b80';
    ctx.fillRect(508, 321, 29, 26);
    ctx.fillStyle = '#9f8b57';
    ctx.font = 'bold 9px Consolas';
    ctx.textAlign = 'center';
    ctx.fillText('COMMON HANDOFF TABLE', 500, 356);
    ctx.textAlign = 'left';
    drawServerRack(965, 250);
    drawPlant(42, 330);
    drawPlant(930, 555);
  }

  function quadratic(a, b, c, t) {
    return (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
  }

  function drawNetwork(time) {
    const links = ui.links;
    if (!links.length) return;
    links.forEach(function (link, index) {
      const from = agentById(link.from);
      const to = agentById(link.to);
      if (!from || !to) return;
      const x1 = from.x, y1 = from.y - 20, x2 = to.x, y2 = to.y - 20;
      const closeVertical = Math.abs(x2 - x1) < 130;
      const cx = (x1 + x2) / 2 + (closeVertical ? (index % 2 ? 85 : -85) : 0);
      const cy = Math.max(118, Math.min(y1, y2) - 60 - (index % 3) * 11);
      const color = from.color;
      const serverNow = Date.now() + ui.serverOffset;
      const duration = Math.max(1, Number(link.endsAt || serverNow + 1) - Number(link.startedAt || serverNow));
      const remaining = clamp((Number(link.endsAt || serverNow + duration) - serverNow) / duration, 0, 1);
      const fade = Math.min(1, remaining * 4);
      ctx.globalAlpha = .16 * fade;
      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, cy, x2, y2); ctx.stroke();
      ctx.globalAlpha = .72 * fade;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 7]);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, cy, x2, y2); ctx.stroke();
      ctx.setLineDash([]);
      for (let packet = 0; packet < 3; packet += 1) {
        const progress = (time / 900 + packet / 3 + index * .13) % 1;
        const px = quadratic(x1, cx, x2, progress);
        const py = quadratic(y1, cy, y2, progress);
        ctx.globalAlpha = (packet ? .68 : 1) * fade;
        ctx.fillStyle = color;
        ctx.fillRect(px - 5, py - 5, 10, 10);
        ctx.fillStyle = '#f1f2ea';
        ctx.fillRect(px - 1, py - 1, 3, 3);
      }
      if (index < 2) {
        const lx = quadratic(x1, cx, x2, .5);
        const ly = quadratic(y1, cy, y2, .5) - 8;
        const label = (from.name + ' → ' + to.name).toUpperCase();
        ctx.font = 'bold 9px Consolas';
        const width = Math.min(150, ctx.measureText(label).width + 18);
        ctx.globalAlpha = .92 * fade;
        ctx.fillStyle = '#070807f2';
        ctx.fillRect(lx - width / 2, ly - 11, width, 19);
        ctx.strokeStyle = color;
        ctx.strokeRect(lx - width / 2 + .5, ly - 10.5, width - 1, 18);
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.fillText(label, lx, ly + 3);
        ctx.textAlign = 'left';
      }
      ctx.globalAlpha = 1;
    });
  }

  function drawBot(agent, time) {
    const x = Math.round(agent.x);
    const y = Math.round(agent.y);
    const moving = agent.moving && Math.hypot(agent.tx - agent.x, agent.ty - agent.y) > 3;
    const stride = moving ? (Math.sin(time / 72 + agents.indexOf(agent)) > 0 ? 4 : -4) : 0;
    const scale = 1.34;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = .18;
    ctx.fillStyle = agent.color;
    ctx.fillRect(-22, 24, 44, 5);
    ctx.globalAlpha = 1;
    if (ui.selectedAgent === agent.id) {
      ctx.strokeStyle = agent.color;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(-29.5, -31.5, 59, 69);
      ctx.setLineDash([]);
    }
    ctx.fillStyle = agent.color;
    ctx.fillRect(-11, -25, 22, 4);
    ctx.fillRect(-16, -21, 32, 6);
    ctx.fillRect(-20, -15, 40, 30);
    ctx.fillRect(-20 + stride, 15, 9, 10);
    ctx.fillRect(-5, 15, 10, 8);
    ctx.fillRect(11 - stride, 15, 9, 10);
    ctx.fillStyle = '#0b0b0b';
    ctx.fillRect(-11, -10, 6, 8);
    ctx.fillRect(5, -10, 6, 8);
    ctx.fillStyle = '#f0eee4';
    ctx.fillRect(-9, -8, 2, 3);
    ctx.fillRect(7, -8, 2, 3);
    ctx.fillStyle = agent.color;
    ctx.fillRect(20, -24, 6, 6);
    ctx.restore();

    ctx.font = 'bold 12px Consolas';
    ctx.textAlign = 'center';
    const agentIndex = agents.indexOf(agent);
    const thoughtPhase = Math.floor(time / 2800) % agents.length;
    const showThought = agentIndex === thoughtPhase || agentIndex === (thoughtPhase + 2) % agents.length || agentIndex === (thoughtPhase + 4) % agents.length;
    if (showThought) {
      const thought = concise(agent.thought, 28);
      const thoughtWidth = Math.min(190, Math.max(100, ctx.measureText(thought).width + 20));
      ctx.fillStyle = '#070807ed';
      ctx.fillRect(x - thoughtWidth / 2, y - 76, thoughtWidth, 24);
      ctx.strokeStyle = agent.color + 'aa';
      ctx.strokeRect(x - thoughtWidth / 2 + .5, y - 75.5, thoughtWidth - 1, 23);
      ctx.fillStyle = agent.color;
      ctx.font = '10px Consolas';
      ctx.fillText(thought, x, y - 60);
    }

    const nameWidth = Math.max(80, ctx.measureText(agent.name).width + 22);
    ctx.fillStyle = '#080808ed';
    ctx.fillRect(x - nameWidth / 2, y + 48, nameWidth, 20);
    ctx.fillStyle = '#f0f0e8';
    ctx.font = 'bold 12px Consolas';
    ctx.fillText(agent.name, x, y + 62);
    ctx.textAlign = 'left';

    if (moving) {
      ctx.globalAlpha = .45;
      ctx.fillStyle = agent.color;
      for (let i = 0; i < 6; i += 1) ctx.fillRect(x - 34 - i * 8, y + 18 + (i % 2) * 4, 3, 3);
      ctx.globalAlpha = 1;
    }
  }

  function moveAgents(delta) {
    agents.forEach(function (agent) {
      const dx = agent.tx - agent.x;
      const dy = agent.ty - agent.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 1) {
        agent.x = agent.tx;
        agent.y = agent.ty;
        return;
      }
      const speed = agent.moving ? Math.max(.025, Number(agent.speed) || .045) : .08;
      const amount = Math.min(distance, delta * speed);
      agent.x += dx / distance * amount;
      agent.y += dy / distance * amount;
    });
  }

  function frame(now) {
    const delta = Math.min(40, now - ui.lastFrame);
    ui.lastFrame = now;
    moveAgents(delta);
    drawRoom(now);
    drawNetwork(now);
    agents.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (agent) {
      drawBot(agent, now);
    });
    requestAnimationFrame(frame);
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * canvas.width / rect.width,
      y: (event.clientY - rect.top) * canvas.height / rect.height
    };
  }

  canvas.addEventListener('click', function (event) {
    const point = canvasPoint(event);
    if (
      point.x >= MARKET_MONITOR.x && point.x <= MARKET_MONITOR.x + MARKET_MONITOR.w &&
      point.y >= MARKET_MONITOR.y && point.y <= MARKET_MONITOR.y + MARKET_MONITOR.h
    ) {
      window.open(market.pairUrl || DEX_FALLBACK_URL, '_blank', 'noopener,noreferrer');
      return;
    }
    let closest = null;
    let distance = 68;
    agents.forEach(function (agent) {
      const next = Math.hypot(point.x - agent.x, point.y - agent.y);
      if (next < distance) {
        closest = agent;
        distance = next;
      }
    });
    if (!closest) return;
    ui.selectedAgent = closest.id;
    renderRoster();
    renderInspector();
  });

  canvas.addEventListener('pointermove', function (event) {
    const point = canvasPoint(event);
    ui.marketHover =
      point.x >= MARKET_MONITOR.x && point.x <= MARKET_MONITOR.x + MARKET_MONITOR.w &&
      point.y >= MARKET_MONITOR.y && point.y <= MARKET_MONITOR.y + MARKET_MONITOR.h;
    canvas.style.cursor = ui.marketHover ? 'pointer' : 'default';
  });
  canvas.addEventListener('pointerleave', function () {
    ui.marketHover = false;
    canvas.style.cursor = 'default';
  });

  const bountyDialog = byId('bountyDialog');
  byId('bountyOpenBtn').addEventListener('click', function () { bountyDialog.showModal(); });
  byId('bountyCloseBtn').addEventListener('click', function () { bountyDialog.close(); });
  bountyDialog.addEventListener('click', function (event) {
    if (event.target === bountyDialog) bountyDialog.close();
  });

  initializeMarketTape();
  updateMarketTape();
  fetchLiveTokenPrice();
  window.setInterval(updateMarketTape, 1000);
  window.setInterval(fetchLiveTokenPrice, 30000);
  renderRoster();
  renderInspector();
  setConnection('connecting');
  pollBackend();
  window.setInterval(pollBackend, pollInterval);
  window.setInterval(function () {
    if (ui.lastSuccess && Date.now() - ui.lastSuccess > pollInterval * 3.5) {
      setConnection('error', 'STATE STREAM STALE · RETRYING');
    }
  }, 1000);
  requestAnimationFrame(frame);
})();

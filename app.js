(function () {
  'use strict';

  const COLORS = {
    helm: '#e26455', scout: '#a8cb58', archive: '#58beb0',
    forge: '#e5aa49', sentinel: '#9b82d7', relay: '#579fd5'
  };

  const agents = [
    { id: 'helm', name: 'HELM', role: 'Council Coordinator', color: COLORS.helm, x: 160, y: 205, tx: 160, ty: 205, homeX: 160, homeY: 205, task: 'Waiting for a signal.', speech: 'standing by' },
    { id: 'scout', name: 'SCOUT', role: 'Signal Intelligence', color: COLORS.scout, x: 500, y: 180, tx: 500, ty: 180, homeX: 500, homeY: 180, task: 'Watching public signals.', speech: 'scanning signals' },
    { id: 'archive', name: 'ARCHIVE', role: 'Context & Memory', color: COLORS.archive, x: 835, y: 205, tx: 835, ty: 205, homeX: 835, homeY: 205, task: 'Indexing project context.', speech: 'loading context' },
    { id: 'forge', name: 'FORGE', role: 'Editorial Writer', color: COLORS.forge, x: 165, y: 468, tx: 165, ty: 468, homeX: 165, homeY: 468, task: 'Waiting for a brief.', speech: 'draft queue clear' },
    { id: 'sentinel', name: 'SENTINEL', role: 'Claims & Safety', color: COLORS.sentinel, x: 500, y: 475, tx: 500, ty: 475, homeX: 500, homeY: 475, task: 'Monitoring the approval boundary.', speech: 'audit ready' },
    { id: 'relay', name: 'RELAY', role: 'Public Voice', color: COLORS.relay, x: 835, y: 468, tx: 835, ty: 468, homeX: 835, homeY: 468, task: 'Publish channel locked.', speech: 'awaiting approval' }
  ];

  const signals = [
    {
      id: 'community',
      label: 'COMMUNITY SIGNAL',
      title: 'When do the agents become real?',
      summary: 'Explain the public preview and private runtime clearly.',
      body: 'People want to see what is already interactive and what still needs backend work.',
      draft: 'the agent council is now interactive in the public build. you can direct the room, watch six roles hand work forward and inspect the final decision gate. the real X runtime is still being built behind it, so nothing posts without a future backend and human approval.',
      alternate: 'you can now step inside the $ARCHITECTURE agent council. six roles coordinate in one room, but the current public build is an honest simulation while the private runtime is being connected.'
    },
    {
      id: 'build',
      label: 'BUILD UPDATE',
      title: 'Show the new Agent Council architecture',
      summary: 'Turn the internal workflow into a concise dev update.',
      body: 'One voice on X, six internal roles, evidence checks and a human approval gate.',
      draft: 'building one public AI voice backed by a six-agent council: signal intelligence, context, writing, verification, coordination and publishing. they share the work internally, while the final X action stays behind a human decision gate.',
      alternate: 'the new $ARCHITECTURE flow is taking shape: six agents debate and verify internally, then one controlled voice prepares the public output. research can be autonomous; publishing still requires a human.'
    },
    {
      id: 'holders',
      label: 'HOLDER MILESTONE',
      title: 'Thank the people supporting the build',
      summary: 'Connect Holder HQ, the community and ongoing development.',
      body: 'Highlight the people supporting the project without making market promises.',
      draft: 'holder hq now sits beside the agent council as a permanent thank-you to everyone supporting $ARCHITECTURE. the leaderboard and community are live, and i am continuing to build the actual agent runtime behind this interface.',
      alternate: 'the project now has two visible rooms: an agent council for the product and holder hq for the people supporting it. thank you for giving me a reason to keep building both.'
    }
  ];

  const timeline = [
    { at: 0, stage: 'listen', agent: 'helm', text: 'opened a new council cycle', target: [480, 310] },
    { at: 3500, stage: 'listen', agent: 'scout', text: 'classified the selected community signal', target: [430, 300] },
    { at: 7000, stage: 'context', agent: 'scout', text: 'passed the signal brief to Archive', target: [700, 260], handoff: true },
    { at: 11000, stage: 'context', agent: 'archive', text: 'loaded project facts and public constraints', target: [690, 310] },
    { at: 15500, stage: 'draft', agent: 'archive', text: 'delivered a context packet to Forge', target: [360, 390], handoff: true },
    { at: 20500, stage: 'draft', agent: 'forge', text: 'assembled the first public draft', target: [390, 365], draft: true },
    { at: 27000, stage: 'verify', agent: 'forge', text: 'sent version 01 to Sentinel', target: [470, 410], handoff: true },
    { at: 32500, stage: 'verify', agent: 'sentinel', text: 'flagged one unsupported autonomy claim', target: [530, 400], warning: true },
    { at: 37500, stage: 'verify', agent: 'forge', text: 'rewrote the claim and attached evidence', target: [430, 385], revise: true },
    { at: 43000, stage: 'decide', agent: 'sentinel', text: 'returned PASS with 91% confidence', target: [510, 340], pass: true },
    { at: 48500, stage: 'decide', agent: 'helm', text: 'called the council to final review', meeting: true },
    { at: 54000, stage: 'publish', agent: 'relay', text: 'staged the draft at the human decision gate', target: [650, 355], gate: true }
  ];

  const state = {
    selectedAgent: 'helm', signalIndex: 0, running: false, paused: false,
    elapsed: 0, speed: 2, timelineIndex: 0, handoffs: 0, confidence: null,
    draftVersion: 0, approved: false, lastFrame: performance.now(), events: 0
  };

  const byId = function (id) { return document.getElementById(id); };
  const canvas = byId('stationCanvas');
  const ctx = canvas.getContext('2d');

  /* RENDER_UI */
  function agentById(id) {
    return agents.find(function (agent) { return agent.id === id; });
  }

  function setAgentTarget(id, x, y, task, speech) {
    const agent = agentById(id);
    if (!agent) return;
    agent.tx = Math.max(45, Math.min(955, x));
    agent.ty = Math.max(120, Math.min(560, y));
    if (task) agent.task = task;
    if (speech) agent.speech = speech;
    renderRoster();
    if (state.selectedAgent === id) renderInspector();
  }

  function renderRoster() {
    const root = byId('agentRoster');
    root.textContent = '';
    agents.forEach(function (agent) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'agent-row' + (state.selectedAgent === agent.id ? ' active' : '') + (agent.working ? ' working' : '');
      button.style.setProperty('--agent', agent.color);
      button.dataset.agent = agent.id;
      const avatar = document.createElement('span');
      avatar.className = 'agent-pixel';
      avatar.style.setProperty('--agent', agent.color);
      const copy = document.createElement('span');
      const name = document.createElement('b');
      name.textContent = agent.name;
      const role = document.createElement('small');
      role.textContent = agent.role;
      copy.append(name, role);
      const status = document.createElement('i');
      status.className = 'agent-state';
      button.append(avatar, copy, status);
      button.addEventListener('click', function () { selectAgent(agent.id); });
      root.append(button);
    });
  }

  function renderSignals() {
    const root = byId('signalList');
    root.textContent = '';
    signals.forEach(function (signal, index) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'signal-card' + (state.signalIndex === index ? ' active' : '');
      const label = document.createElement('span');
      label.textContent = signal.label;
      const title = document.createElement('b');
      title.textContent = signal.title;
      const summary = document.createElement('small');
      summary.textContent = signal.summary;
      button.append(label, title, summary);
      button.addEventListener('click', function () { chooseSignal(index); });
      root.append(button);
    });
  }

  function renderInspector() {
    const agent = agentById(state.selectedAgent);
    byId('inspectorName').textContent = agent.name;
    byId('inspectorRole').textContent = agent.role;
    byId('inspectorTask').textContent = agent.task;
    byId('inspectorAvatar').style.setProperty('--agent', agent.color);
  }

  function selectAgent(id) {
    state.selectedAgent = id;
    renderRoster();
    renderInspector();
  }

  function addFeed(agentId, text, tone) {
    const root = byId('liveFeed');
    const agent = agentById(agentId) || agents[0];
    const item = document.createElement('article');
    item.className = 'feed-item';
    item.style.setProperty('--agent', tone === 'warning' ? COLORS.helm : agent.color);
    const time = document.createElement('time');
    const now = new Date();
    time.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const copy = document.createElement('p');
    const author = document.createElement('b');
    author.textContent = agent.name + ' ';
    copy.append(author, document.createTextNode(text));
    item.append(time, copy);
    root.prepend(item);
    while (root.children.length > 24) root.lastElementChild.remove();
    state.events += 1;
    byId('eventCount').textContent = String(state.events).padStart(2, '0');
    window.ArchitectureBridge.emit('council:event', { agent: agent.id, message: text });
  }

  function updateDraft(status, text, verdict) {
    const signal = signals[state.signalIndex];
    if (text) byId('draftText').textContent = text;
    byId('draftStatus').textContent = status;
    byId('draftAuthor').textContent = state.draftVersion ? 'FORGE' : '—';
    byId('draftVersion').textContent = String(state.draftVersion).padStart(2, '0');
    byId('draftSources').textContent = state.draftVersion ? (signal.id === 'community' ? '6' : '8') : '0';
    byId('draftVerdict').textContent = verdict || 'PENDING';
    byId('draftCard').classList.toggle('ready', status === 'READY');
  }

  function setStage(name) {
    const order = ['listen', 'context', 'draft', 'verify', 'decide', 'publish'];
    const activeIndex = order.indexOf(name);
    document.querySelectorAll('.stage-track span').forEach(function (node, index) {
      node.classList.toggle('active', index === activeIndex);
      node.classList.toggle('done', index < activeIndex);
    });
    byId('progressStage').textContent = name ? name.toUpperCase() + ' PHASE' : 'COUNCIL IDLE';
  }

  function setGate(open) {
    byId('decisionGate').classList.toggle('unlocked', open);
    byId('decisionState').textContent = open ? 'AWAITING YOU' : 'LOCKED';
    ['rejectBtn', 'rewriteBtn', 'approveBtn'].forEach(function (id) { byId(id).disabled = !open; });
  }

  function renderSignalHeader() {
    const signal = signals[state.signalIndex];
    byId('cycleId').textContent = 'ARC-' + String(state.signalIndex + 1).padStart(3, '0');
    byId('cycleTitle').textContent = signal.title;
    byId('cycleSummary').textContent = signal.summary;
  }
  /* SIMULATION */
  function resetCouncil(silent) {
    state.running = false;
    state.paused = false;
    state.elapsed = 0;
    state.timelineIndex = 0;
    state.handoffs = 0;
    state.confidence = null;
    state.draftVersion = 0;
    state.approved = false;
    agents.forEach(function (agent) {
      agent.tx = agent.homeX; agent.ty = agent.homeY;
      agent.working = false;
      agent.task = agent.id === 'relay' ? 'Publish channel locked.' : 'Waiting for council work.';
      agent.speech = 'standing by';
    });
    byId('startBtn').disabled = false;
    byId('startBtn').textContent = '▶ START COUNCIL';
    byId('pauseBtn').disabled = true;
    byId('pauseBtn').textContent = 'Ⅱ PAUSE';
    byId('roomState').textContent = 'READY';
    byId('handoffCount').textContent = '00';
    byId('confidenceValue').textContent = '--';
    byId('progressText').textContent = '0%';
    byId('progressBar').style.width = '0%';
    setStage('');
    setGate(false);
    updateDraft('WAITING', 'Start the council to generate a reviewed public update.', 'PENDING');
    renderRoster();
    renderInspector();
    if (!silent) addFeed('helm', 'reset the local council simulation');
  }

  function chooseSignal(index) {
    state.signalIndex = index;
    resetCouncil(true);
    renderSignals();
    renderSignalHeader();
    addFeed('scout', 'loaded signal: ' + signals[index].title);
  }

  function startCouncil() {
    if (state.running && state.paused) {
      state.paused = false;
      byId('pauseBtn').textContent = 'Ⅱ PAUSE';
      byId('roomState').textContent = 'RUNNING';
      addFeed('helm', 'resumed the council cycle');
      return;
    }
    if (state.running) return;
    if (state.elapsed >= 54000) resetCouncil(true);
    state.running = true;
    state.paused = false;
    state.lastFrame = performance.now();
    byId('startBtn').disabled = true;
    byId('pauseBtn').disabled = false;
    byId('roomState').textContent = 'RUNNING';
    window.ArchitectureBridge.command('start-cycle', { signal: signals[state.signalIndex].id });
  }

  function togglePause() {
    if (!state.running) return;
    state.paused = !state.paused;
    byId('pauseBtn').textContent = state.paused ? '▶ RESUME' : 'Ⅱ PAUSE';
    byId('roomState').textContent = state.paused ? 'PAUSED' : 'RUNNING';
    addFeed('helm', state.paused ? 'paused the local simulation' : 'resumed the local simulation');
  }

  function executeTimelineEvent(event) {
    agents.forEach(function (agent) { agent.working = false; });
    const agent = agentById(event.agent);
    agent.working = true;
    agent.task = event.text.charAt(0).toUpperCase() + event.text.slice(1) + '.';
    agent.speech = event.text.replace(/the selected |the first |one /g, '').slice(0, 28);
    if (event.target) setAgentTarget(event.agent, event.target[0], event.target[1], agent.task, agent.speech);
    if (event.handoff) {
      state.handoffs += 1;
      byId('handoffCount').textContent = String(state.handoffs).padStart(2, '0');
    }
    if (event.meeting) callMeeting(false);
    if (event.draft) {
      state.draftVersion = 1;
      updateDraft('DRAFTING', signals[state.signalIndex].draft, 'CHECKING');
    }
    if (event.warning) {
      state.confidence = 68;
      byId('confidenceValue').textContent = '68%';
      updateDraft('REVISION', signals[state.signalIndex].draft, '1 FLAG');
    }
    if (event.revise) {
      state.draftVersion = 2;
      updateDraft('VERIFYING', signals[state.signalIndex].draft, 'RECHECK');
    }
    if (event.pass) {
      state.confidence = 91;
      byId('confidenceValue').textContent = '91%';
      updateDraft('READY', signals[state.signalIndex].draft, 'PASS');
    }
    if (event.gate) {
      setGate(true);
      updateDraft('READY', signals[state.signalIndex].draft, 'PASS');
      state.running = false;
      byId('startBtn').disabled = false;
      byId('startBtn').textContent = '↺ RUN AGAIN';
      byId('pauseBtn').disabled = true;
      byId('roomState').textContent = 'WAITING';
    }
    setStage(event.stage);
    addFeed(event.agent, event.text, event.warning ? 'warning' : '');
    renderRoster();
    renderInspector();
  }

  function tickSimulation(delta) {
    if (!state.running || state.paused) return;
    state.elapsed += delta * state.speed;
    while (state.timelineIndex < timeline.length && state.elapsed >= timeline[state.timelineIndex].at) {
      executeTimelineEvent(timeline[state.timelineIndex]);
      state.timelineIndex += 1;
    }
    const progress = Math.min(100, state.elapsed / 54000 * 100);
    byId('progressText').textContent = Math.floor(progress) + '%';
    byId('progressBar').style.width = progress + '%';
  }
  /* CANVAS */
  function line(x1, y1, x2, y2, color, width) {
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = color; ctx.lineWidth = width || 1; ctx.stroke();
  }

  function drawMonitorWall(time) {
    ctx.fillStyle = '#0c110e';
    ctx.fillRect(28, 28, 944, 92);
    ctx.strokeStyle = '#303b32';
    ctx.strokeRect(28.5, 28.5, 944, 92);
    ctx.fillStyle = '#617064';
    ctx.font = '10px Consolas';
    ctx.fillText('COUNCIL TELEMETRY / PUBLIC PREVIEW', 48, 49);
    ctx.fillStyle = '#101a16';
    ctx.fillRect(48, 62, 350, 42);
    ctx.strokeStyle = '#21372e';
    ctx.strokeRect(48.5, 62.5, 350, 42);
    ctx.beginPath();
    for (let x = 50; x < 394; x += 6) {
      const y = 84 + Math.sin((x + time * .045) * .038) * 10 + Math.sin((x + time * .08) * .091) * 3;
      if (x === 50) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = COLORS.archive;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#77817a';
    ctx.fillText('SIGNALS', 425, 70);
    ctx.fillText('CONTEXT', 425, 88);
    ctx.fillText('DRAFTS', 535, 70);
    ctx.fillText('VERDICTS', 535, 88);
    ctx.fillStyle = COLORS.scout; ctx.fillText('LIVE', 485, 70);
    ctx.fillStyle = COLORS.archive; ctx.fillText('SYNC', 485, 88);
    ctx.fillStyle = COLORS.forge; ctx.fillText(String(state.draftVersion).padStart(2, '0'), 603, 70);
    ctx.fillStyle = state.confidence ? COLORS.scout : '#5a6259';
    ctx.fillText(state.confidence ? state.confidence + '%' : '--', 603, 88);

    const clockX = 720, clockY = 75, radius = 31;
    ctx.fillStyle = '#d7d2b4'; ctx.beginPath(); ctx.arc(clockX, clockY, radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6f6442'; ctx.lineWidth = 4; ctx.stroke();
    for (let i = 0; i < 12; i += 1) {
      const angle = i / 12 * Math.PI * 2 - Math.PI / 2;
      line(clockX + Math.cos(angle) * 24, clockY + Math.sin(angle) * 24, clockX + Math.cos(angle) * 28, clockY + Math.sin(angle) * 28, '#59533b', 1);
    }
    const now = new Date();
    const minuteAngle = (now.getMinutes() + now.getSeconds() / 60) / 60 * Math.PI * 2 - Math.PI / 2;
    const hourAngle = ((now.getHours() % 12) + now.getMinutes() / 60) / 12 * Math.PI * 2 - Math.PI / 2;
    line(clockX, clockY, clockX + Math.cos(hourAngle) * 16, clockY + Math.sin(hourAngle) * 16, '#332f24', 3);
    line(clockX, clockY, clockX + Math.cos(minuteAngle) * 23, clockY + Math.sin(minuteAngle) * 23, '#332f24', 2);

    ctx.fillStyle = '#111a16'; ctx.fillRect(785, 56, 158, 49);
    ctx.fillStyle = COLORS.acid || '#b9e65a';
    ctx.fillText('RUNTIME', 800, 72);
    ctx.fillStyle = COLORS.forge;
    ctx.fillText('DEV BUILD', 800, 91);
    ctx.fillStyle = '#687268';
    ctx.fillText('NO LIVE X WRITE', 862, 91);
  }

  function drawDesk(x, y, w, label, color) {
    ctx.fillStyle = '#11140f'; ctx.fillRect(x, y, w, 55);
    ctx.strokeStyle = '#343a31'; ctx.strokeRect(x + .5, y + .5, w, 55);
    ctx.fillStyle = '#151d18'; ctx.fillRect(x + 12, y + 10, w - 24, 22);
    ctx.fillStyle = color; ctx.fillRect(x + 18, y + 15, 24, 4);
    ctx.fillStyle = '#6d796f';
    for (let i = 0; i < 6; i += 1) ctx.fillRect(x + 18 + i * 18, y + 24 - (i % 3) * 3, 11, 3);
    ctx.fillStyle = '#080a08'; ctx.fillRect(x + 20, y + 45, w - 40, 18);
    ctx.strokeStyle = color; ctx.strokeRect(x + 20.5, y + 44.5, w - 40, 18);
    ctx.fillStyle = color; ctx.font = '9px Consolas'; ctx.textAlign = 'center'; ctx.fillText(label, x + w / 2, y + 57); ctx.textAlign = 'left';
  }

  function drawRoom(time) {
    ctx.fillStyle = '#070a08'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#171c18'; ctx.lineWidth = 1;
    for (let x = 0; x <= 1000; x += 40) line(x, 120, x, 620, '#111612', 1);
    for (let y = 120; y <= 620; y += 40) line(0, y, 1000, y, '#111612', 1);
    drawMonitorWall(time);
    ctx.fillStyle = '#0b0f0c'; ctx.fillRect(0, 120, 1000, 500);
    ctx.globalAlpha = .45;
    for (let x = 0; x < 1000; x += 50) line(x, 120, x, 620, '#1b221c', 1);
    for (let y = 120; y < 620; y += 50) line(0, y, 1000, y, '#1b221c', 1);
    ctx.globalAlpha = 1;
    drawDesk(70, 150, 180, 'COORDINATION', COLORS.helm);
    drawDesk(410, 135, 180, 'SIGNAL DESK', COLORS.scout);
    drawDesk(750, 150, 180, 'CONTEXT VAULT', COLORS.archive);
    drawDesk(75, 435, 180, 'EDITORIAL', COLORS.forge);
    drawDesk(410, 445, 180, 'CLAIMS AUDIT', COLORS.sentinel);
    drawDesk(750, 435, 180, 'PUBLIC VOICE', COLORS.relay);
    ctx.fillStyle = '#111611'; ctx.fillRect(375, 275, 250, 100);
    ctx.strokeStyle = '#3a4237'; ctx.strokeRect(375.5, 275.5, 250, 100);
    ctx.fillStyle = '#171d16'; ctx.fillRect(398, 294, 204, 60);
    ctx.fillStyle = '#697164'; ctx.font = '10px Consolas'; ctx.textAlign = 'center';
    ctx.fillText('COUNCIL TABLE', 500, 329); ctx.textAlign = 'left';
    ctx.fillStyle = '#363c34';
    [[360,295],[628,295],[360,345],[628,345]].forEach(function (point) { ctx.fillRect(point[0], point[1], 14, 20); });
  }

  function drawBot(agent, time) {
    const moving = Math.hypot(agent.tx - agent.x, agent.ty - agent.y) > 2;
    const step = moving ? Math.sin(time * .014 + agents.indexOf(agent)) * 3 : 0;
    const x = Math.round(agent.x), y = Math.round(agent.y);

    ctx.globalAlpha = .3;
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(x, y + 28, 30, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    if (state.selectedAgent === agent.id) {
      ctx.strokeStyle = agent.color;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(x - 33.5, y - 40.5, 67, 82);
      ctx.setLineDash([]);
    }

    ctx.fillStyle = '#ececdf';
    ctx.fillRect(x - 21, y - 29, 42, 27);
    ctx.fillStyle = '#c7c9bd';
    ctx.fillRect(x - 25, y - 24, 4, 16);
    ctx.fillRect(x + 21, y - 24, 4, 16);
    ctx.fillStyle = '#0a0d0b';
    ctx.fillRect(x - 12, y - 20, 7, 8);
    ctx.fillRect(x + 5, y - 20, 7, 8);
    ctx.fillRect(x - 6, y - 8, 12, 3);

    ctx.fillStyle = agent.color;
    ctx.fillRect(x - 20, y - 2, 40, 27);
    ctx.fillRect(x - 27, y + 2, 7, 18);
    ctx.fillRect(x + 20, y + 2, 7, 18);
    ctx.fillStyle = '#111511';
    ctx.fillRect(x - 15, y + 5, 30, 9);
    ctx.fillStyle = agent.color;
    ctx.fillRect(x - 12, y + 8, 7, 3);
    ctx.fillRect(x - 2, y + 8, 7, 3);
    ctx.fillRect(x + 8, y + 8, 3, 3);
    ctx.fillStyle = '#d8dbd0';
    ctx.fillRect(x - 15 + step, y + 25, 11, 7);
    ctx.fillRect(x + 4 - step, y + 25, 11, 7);

    if (agent.working) {
      const ring = 26 + Math.sin(time * .006) * 3;
      ctx.strokeStyle = agent.color;
      ctx.globalAlpha = .45;
      ctx.beginPath(); ctx.arc(x, y - 10, ring, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.textAlign = 'center';
    ctx.font = 'bold 10px Consolas';
    ctx.fillStyle = '#e8ecdf';
    ctx.fillText(agent.name, x, y + 45);
    const speech = agent.speech || 'standing by';
    const labelWidth = Math.max(74, Math.min(168, ctx.measureText(speech).width + 18));
    ctx.fillStyle = '#090c0ae8';
    ctx.fillRect(x - labelWidth / 2, y + 51, labelWidth, 19);
    ctx.strokeStyle = agent.color;
    ctx.strokeRect(x - labelWidth / 2 + .5, y + 51.5, labelWidth, 19);
    ctx.font = '9px Consolas';
    ctx.fillStyle = agent.color;
    ctx.fillText(speech, x, y + 64);
    ctx.textAlign = 'left';
  }

  function moveAgents(delta) {
    agents.forEach(function (agent) {
      const dx = agent.tx - agent.x, dy = agent.ty - agent.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 1) { agent.x = agent.tx; agent.y = agent.ty; return; }
      const amount = Math.min(distance, delta * .085);
      agent.x += dx / distance * amount;
      agent.y += dy / distance * amount;
    });
  }

  function drawHandoff(time) {
    const working = agents.filter(function (agent) { return agent.working; });
    if (!working.length) return;
    const active = working[0];
    ctx.globalAlpha = .45;
    ctx.strokeStyle = active.color;
    ctx.setLineDash([3, 7]);
    ctx.beginPath();
    ctx.moveTo(active.x, active.y);
    ctx.lineTo(500, 325);
    ctx.stroke();
    ctx.setLineDash([]);
    const t = (time % 1200) / 1200;
    ctx.fillStyle = active.color;
    ctx.beginPath();
    ctx.arc(active.x + (500 - active.x) * t, active.y + (325 - active.y) * t, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    const delta = Math.min(40, now - state.lastFrame);
    state.lastFrame = now;
    tickSimulation(delta);
    moveAgents(delta);
    drawRoom(now);
    drawHandoff(now);
    agents.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (agent) { drawBot(agent, now); });
    requestAnimationFrame(frame);
  }
  /* INTERACTIONS */
  function callMeeting(logEvent) {
    const seats = [[445,295],[500,270],[555,295],[445,355],[500,380],[555,355]];
    agents.forEach(function (agent, index) {
      agent.tx = seats[index][0]; agent.ty = seats[index][1];
      agent.task = 'Joining the shared council review.';
      agent.speech = 'joining council';
    });
    if (logEvent !== false) addFeed('helm', 'called all six agents to the council table');
    renderInspector();
  }

  function askForAlternate() {
    const signal = signals[state.signalIndex];
    state.draftVersion = Math.max(1, state.draftVersion + 1);
    setAgentTarget('forge', 415, 380, 'Writing an alternate angle.', 'writing alternate');
    updateDraft('DRAFTING', signal.alternate, 'REVIEW NEEDED');
    setGate(false);
    addFeed('forge', 'generated alternate version ' + String(state.draftVersion).padStart(2, '0'));
  }

  function runAudit() {
    const confidence = 84 + Math.floor(Math.random() * 12);
    state.confidence = confidence;
    setAgentTarget('sentinel', 520, 380, 'Auditing claims and boundaries.', 'checking claims');
    byId('confidenceValue').textContent = confidence + '%';
    if (state.draftVersion) {
      updateDraft(confidence >= 90 ? 'READY' : 'VERIFYING', byId('draftText').textContent, confidence >= 90 ? 'PASS' : 'RECHECK');
      if (confidence >= 90) setGate(true);
    }
    addFeed('sentinel', 'completed a local claim audit at ' + confidence + '% confidence');
  }

  function addTapeEntry(label, text) {
    const root = byId('publicationTape');
    if (root.children.length === 1 && root.firstElementChild.textContent.indexOf('No approved') !== -1) root.textContent = '';
    const row = document.createElement('p');
    const mark = document.createElement('span');
    mark.textContent = label;
    const copy = document.createTextNode(text);
    row.append(mark, copy);
    root.prepend(row);
  }

  function approvePreview() {
    state.approved = true;
    setGate(false);
    byId('decisionState').textContent = 'APPROVED LOCALLY';
    byId('roomState').textContent = 'PREVIEWED';
    setAgentTarget('relay', 690, 340, 'Holding an approved local preview.', 'preview approved');
    addFeed('relay', 'stored the approved draft on the preview tape — no X post was sent');
    addTapeEntry('LOCAL', 'Approved preview · X write disabled');
    window.ArchitectureBridge.command('approve-preview', { draft: byId('draftText').textContent });
  }

  function rejectDraft() {
    setGate(false);
    updateDraft('REJECTED', byId('draftText').textContent, 'HUMAN REJECT');
    setAgentTarget('forge', 165, 468, 'Waiting for a new direction.', 'draft rejected');
    addFeed('helm', 'rejected the draft and returned it to Forge');
  }

  function requestRewrite() {
    setGate(false);
    state.draftVersion += 1;
    setAgentTarget('forge', 400, 385, 'Rewriting after human feedback.', 'applying edit');
    const current = byId('draftText').textContent;
    updateDraft('REVISION', current + ' [human edit requested]', 'RECHECK');
    addFeed('forge', 'accepted a human edit request for version ' + String(state.draftVersion).padStart(2, '0'));
  }

  function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * canvas.width / rect.width;
    const y = (event.clientY - rect.top) * canvas.height / rect.height;
    let nearest = null;
    let distance = Infinity;
    agents.forEach(function (agent) {
      const current = Math.hypot(agent.x - x, agent.y - y);
      if (current < distance) { nearest = agent; distance = current; }
    });
    if (nearest && distance < 48) {
      selectAgent(nearest.id);
      addFeed(nearest.id, 'was selected for direct inspection');
      return;
    }
    const selected = agentById(state.selectedAgent);
    setAgentTarget(selected.id, x, y, 'Following a manual room instruction.', 'moving to marker');
    addFeed(selected.id, 'received a manual movement command');
  }

  function loadCustomSignal(event) {
    event.preventDefault();
    const title = byId('customSignalTitle').value.trim();
    const body = byId('customSignalBody').value.trim();
    if (!title) { byId('customSignalTitle').focus(); return; }
    signals.push({
      id: 'custom-' + Date.now(),
      label: 'LOCAL SIGNAL',
      title: title,
      summary: body || 'Custom local council input.',
      body: body,
      draft: 'local council draft for: ' + title.toLowerCase() + '. this output was generated only inside the browser preview and has not been published.',
      alternate: 'alternate local angle for: ' + title.toLowerCase() + '. human review remains required.'
    });
    byId('signalDialog').close();
    byId('customSignalTitle').value = '';
    byId('customSignalBody').value = '';
    chooseSignal(signals.length - 1);
  }
  /* BOOT */
  byId('startBtn').addEventListener('click', startCouncil);
  byId('pauseBtn').addEventListener('click', togglePause);
  byId('resetBtn').addEventListener('click', function () { resetCouncil(false); });
  byId('speedSelect').addEventListener('change', function (event) { state.speed = Number(event.target.value) || 1; });
  byId('meetingBtn').addEventListener('click', function () { callMeeting(true); });
  byId('alternateBtn').addEventListener('click', askForAlternate);
  byId('auditBtn').addEventListener('click', runAudit);
  byId('approveBtn').addEventListener('click', approvePreview);
  byId('rejectBtn').addEventListener('click', rejectDraft);
  byId('rewriteBtn').addEventListener('click', requestRewrite);
  canvas.addEventListener('click', handleCanvasClick);
  byId('randomSignalBtn').addEventListener('click', function () {
    let next = state.signalIndex;
    while (signals.length > 1 && next === state.signalIndex) next = Math.floor(Math.random() * signals.length);
    chooseSignal(next);
  });
  byId('clearFeedBtn').addEventListener('click', function () {
    byId('liveFeed').textContent = '';
    state.events = 0;
    byId('eventCount').textContent = '00';
  });
  byId('injectSignalBtn').addEventListener('click', function () { byId('signalDialog').showModal(); });
  byId('loadCustomSignalBtn').addEventListener('click', loadCustomSignal);

  renderSignals();
  renderSignalHeader();
  resetCouncil(true);
  addFeed('helm', 'public preview initialized; private runtime remains disconnected');
  addFeed('scout', 'loaded three safe local signals for the interactive demo');
  addFeed('sentinel', 'confirmed that X write, transfers and trading are disabled');
  requestAnimationFrame(frame);
})();

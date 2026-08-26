(function () {
  'use strict';

  const listeners = new Set();
  const bridge = {
    mode: 'simulation',
    version: '0.2.0-public-preview',
    capabilities: Object.freeze({
      xRead: false,
      xWrite: false,
      tokenTransfers: false,
      trading: false,
      localSimulation: true
    }),
    subscribe(listener) {
      if (typeof listener !== 'function') return function () {};
      listeners.add(listener);
      return function () { listeners.delete(listener); };
    },
    emit(type, payload) {
      const event = Object.freeze({
        id: 'sim_' + Date.now().toString(36),
        type,
        payload: payload || {},
        simulated: true,
        timestamp: new Date().toISOString()
      });
      listeners.forEach(function (listener) { listener(event); });
      return event;
    },
    command(type, payload) {
      const event = bridge.emit('command:' + type, payload);
      return Promise.resolve({ accepted: true, simulated: true, eventId: event.id });
    }
  };

  Object.defineProperty(window, 'ArchitectureBridge', {
    value: bridge,
    configurable: true,
    writable: true
  });
})();

(function () {
  const local = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  window.ARCHITECTURE_CONFIG = Object.assign({
    apiBase: local ? 'http://localhost:8790' : 'https://grok-backend.vercel.app',
    pollIntervalMs: 1000
  }, window.ARCHITECTURE_CONFIG || {});
})();

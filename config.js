(function () {
  const host = String(location.hostname || '').toLowerCase();

  const isStaging =
    host === 'staging.murain.tw' ||
    host.includes('staging') ||
    host.endsWith('.pages.dev');

  window.MURAIN_ENV = isStaging ? 'staging' : 'production';
  window.API_BASE = isStaging
    ? 'https://api-staging.murain.tw'
    : 'https://api.murain.tw';

  console.log('[MURAIN_ENV]', window.MURAIN_ENV, window.API_BASE);
})();

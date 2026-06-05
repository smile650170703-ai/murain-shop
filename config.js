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

  window.MURAIN_SITE_ORIGIN = isStaging
    ? 'https://staging.murain.tw'
    : 'https://murain.tw';

  window.LINE_LOGIN_CHANNEL_ID = isStaging
    ? '2010297761'
    : '2008430261';

  window.LIFF_MEMBER_ID = isStaging
    ? '2010297761-7i2QQFJG'
    : '2008430261-EGZPg3Qp';

  window.LIFF_CHECKOUT_ID = isStaging
    ? '2010297761-qxOE7yTg'
    : '2008430261-KLwoQjm4';

  window.LIFF_BIND_MEMBER_ID = isStaging
    ? '2010297761-LEbOo1Qv'
    : '2008430261-kOeNLR9x';

  console.log('[MURAIN_ENV]', window.MURAIN_ENV, window.API_BASE);
})();

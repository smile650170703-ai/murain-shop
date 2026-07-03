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
window.OFFICIAL_LINE_URL = isStaging
  ? 'https://line.me/R/ti/p/@523fqjkm'
  : 'https://line.me/R/ti/p/@mu88888';

// ✅ 寄賣契約專用 LINE：只給 consign.html 的契約按鈕使用
window.CONSIGN_CONTRACT_LINE_URL = isStaging
  ? 'https://line.me/R/ti/p/@523fqjkm'
  : 'https://line.me/R/ti/p/@mu88888';

  console.log('[MURAIN_ENV]', window.MURAIN_ENV, window.API_BASE);
})();

(function () {
  const AUTH_STORE = "MURAIN_BACKOFFICE_AUTH_V1";
  const AUTH_MAX_AGE_MS = 12 * 60 * 60 * 1000;

  const LOCAL_KEYS = [
    "OP_KEY",
    "murain_admin_key",
    "MURAIN_ADMIN_OP_KEY",
    "stock_op",
    "MURAIN_OP_KEY",
    "murain_admin_line_message_op_key"
  ];

  const SESSION_KEYS = [
    "murain_op_key",
    "SHOP_ADMIN_OP_KEY",
    "company_entry_ok",
    "company_entry_token",
    "procurement_entry_ok",
    "procurement_entry_token"
  ];

  function apiBase() {
    return String(window.API_BASE || "https://api.murain.tw").replace(/\/$/, "");
  }

  function readAuth() {
    try {
      const raw = localStorage.getItem(AUTH_STORE) || "";
      if (!raw) return null;

      const a = JSON.parse(raw);
      if (!a || !a.key || !a.role) return null;

      if (Date.now() - Number(a.at || 0) > AUTH_MAX_AGE_MS) {
        clearAuth(false);
        return null;
      }

      return a;
    } catch (_) {
      return null;
    }
  }

  function canUse(required, auth) {
    const role = String(auth?.role || "").toLowerCase();
    const need = String(required || "").toLowerCase();

    if (!need) return true;
    if (!auth?.key) return false;

    if (need === "staff") return role === "staff" || role === "admin";
    if (need === "admin") return role === "admin";

    return false;
  }

  function inferRequiredRole(pathname) {
    let p = String(pathname || location.pathname || "").toLowerCase();

    try {
      p = decodeURIComponent(p);
    } catch (_) {}

    p = p
      .split("?")[0]
      .split("#")[0]
      .replace(/\/+$/, "");

    if (!p) p = "/";

    // 同時支援 /xxx.html 與 /xxx
    const pNoHtml = p.replace(/\.html$/i, "");

    const parts = pNoHtml.split("/").filter(Boolean);
    const base = parts[parts.length - 1] || "";

    // 本機測試檔常會變成 op (2)(9)、stock (1)、stock-in (1)(3)
    const baseStarts = (name) => {
      return (
        base === name ||
        base.startsWith(name + " ") ||
        base.startsWith(name + "(")
      );
    };

    // 統一密碼可用
    if (pNoHtml === "/op" || pNoHtml.endsWith("/op") || baseStarts("op")) {
      return "staff";
    }

    if (
      pNoHtml === "/admin-streamer-performance" ||
      pNoHtml.endsWith("/admin-streamer-performance") ||
      baseStarts("admin-streamer-performance")
    ) {
      return "staff";
    }

    // 主管密碼才可用
    if (pNoHtml === "/company-files" || pNoHtml.startsWith("/company-files/")) return "admin";
    if (pNoHtml === "/procurement-center" || pNoHtml.startsWith("/procurement-center/")) return "admin";
    if (pNoHtml.startsWith("/op/preorder-")) return "admin";
    if (pNoHtml.startsWith("/admin")) return "admin";
    if (pNoHtml.includes("shop-product-admin")) return "admin";

    if (
      pNoHtml === "/stock" ||
      pNoHtml.endsWith("/stock") ||
      baseStarts("stock")
    ) {
      return "admin";
    }

    if (
      pNoHtml === "/stock-in" ||
      pNoHtml.endsWith("/stock-in") ||
      baseStarts("stock-in")
    ) {
      return "admin";
    }

    return "";
  }

  function inferLinkRole(href) {
    let p = "";
    try {
      p = new URL(href, location.origin).pathname.toLowerCase();
    } catch (_) {
      p = String(href || "").toLowerCase();
    }
    return inferRequiredRole(p);
  }

  function fillLegacyInputs(key) {
    if (!key) return;

    const ids = [
      "op_key",
      "opKey",
      "op",
      "op_key_input",
      "opKeyInput",
      "adminEntryPassword",
      "entryPassword"
    ];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el || !("value" in el)) return;

      el.value = key;

      try {
        el.dispatchEvent(new Event("input", { bubbles: true }));
      } catch (_) {}

      // 不自動觸發 change，避免像 stock.html 的隱藏 #op 造成重複打 API 或循環觸發。
    });
  }

  function seedLegacy(auth) {
    if (!auth?.key) return;

    const key = String(auth.key || "");
    const role = String(auth.role || "").toLowerCase();

    try {
      localStorage.setItem("OP_KEY", key);
      localStorage.setItem("murain_admin_key", key);

      if (role === "admin") {
        localStorage.setItem("MURAIN_ADMIN_OP_KEY", key);
        localStorage.setItem("stock_op", key);
        localStorage.setItem("MURAIN_OP_KEY", key);
        localStorage.setItem("murain_admin_line_message_op_key", key);

        sessionStorage.setItem("murain_op_key", key);
        sessionStorage.setItem("SHOP_ADMIN_OP_KEY", key);

        sessionStorage.setItem("company_entry_ok", "1");
        sessionStorage.setItem("company_entry_token", "shared-admin-ok");

        sessionStorage.setItem("procurement_entry_ok", "1");
        sessionStorage.setItem("procurement_entry_token", "shared-admin-ok");
      } else {
        localStorage.removeItem("MURAIN_ADMIN_OP_KEY");
        localStorage.removeItem("stock_op");
        localStorage.removeItem("MURAIN_OP_KEY");
        localStorage.removeItem("murain_admin_line_message_op_key");

        sessionStorage.removeItem("murain_op_key");
        sessionStorage.removeItem("SHOP_ADMIN_OP_KEY");

        sessionStorage.removeItem("company_entry_ok");
        sessionStorage.removeItem("company_entry_token");

        sessionStorage.removeItem("procurement_entry_ok");
        sessionStorage.removeItem("procurement_entry_token");
      }
    } catch (_) {}

    if (document.readyState !== "loading") {
      fillLegacyInputs(key);
    }
  }

  function saveAuth(key, role) {
    const auth = {
      key: String(key || ""),
      role: String(role || "staff"),
      at: Date.now()
    };

    localStorage.setItem(AUTH_STORE, JSON.stringify(auth));
    seedLegacy(auth);
    return auth;
  }

  function clearAuth(reload) {
    try {
      localStorage.removeItem(AUTH_STORE);
    } catch (_) {}

    try {
      LOCAL_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch (_) {}

    try {
      SESSION_KEYS.forEach((k) => sessionStorage.removeItem(k));
    } catch (_) {}

    if (reload) location.reload();
  }

  async function verifyAndSave(key) {
    const opKey = String(key || "").trim();
    if (!opKey) throw new Error("請先輸入密碼");

    const r = await fetch(apiBase() + "/op/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op_key: opKey })
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok || data.ok !== true) {
      throw new Error(data.message || data.error || "密碼錯誤");
    }

    const role = String(data.role || (data.is_admin ? "admin" : "staff")).toLowerCase();

    if (role !== "admin" && role !== "staff") {
      throw new Error("權限回傳異常");
    }

    return saveAuth(opKey, role);
  }

  function roleLabel(auth) {
    if (!auth?.key) return "未登入";
    return auth.role === "admin" ? "主管" : "統一";
  }

  function applyTabPermission(auth) {
    document.querySelectorAll("a.page-tab, a.tab").forEach((a) => {
      const need = inferLinkRole(a.getAttribute("href") || a.href || "");
      if (!need) return;

      const ok = canUse(need, auth);

      a.dataset.authNeed = need;
      a.style.opacity = ok ? "" : "0.38";
      a.style.pointerEvents = ok ? "" : "auto";
      a.title = ok ? "" : (need === "admin" ? "主管密碼才可使用" : "請先登入");

      a.onclick = ok ? null : function (e) {
        e.preventDefault();

        const input = document.getElementById("murainSharedAuthInput");
        if (input) input.focus();

        alert(need === "admin" ? "這個功能需要主管密碼。" : "請先登入後再使用。");
      };
    });
  }

  function showLock(required, auth) {
    let lock = document.getElementById("murainSharedAuthLock");

    if (canUse(required, auth)) {
      if (lock) lock.remove();
      document.documentElement.classList.remove("murain-auth-locked");
      return;
    }

    document.documentElement.classList.add("murain-auth-locked");

    if (!lock) {
      lock = document.createElement("div");
      lock.id = "murainSharedAuthLock";
      lock.innerHTML = `
        <div class="murain-auth-lock-card">
          <h2>請先登入</h2>
          <p>統一密碼只能使用「直播主開單、直播主業績」。主管密碼可以使用全部後台功能。</p>
        </div>
      `;
      document.body.appendChild(lock);
    }
  }

  function ensureStyle() {
    if (document.getElementById("murainSharedAuthStyle")) return;

    const style = document.createElement("style");
    style.id = "murainSharedAuthStyle";
    style.textContent = `
      #murainSharedAuthBar{
        position:sticky;
        top:0;
        z-index:100000;
        display:flex;
        gap:8px;
        align-items:center;
        flex-wrap:nowrap;
        padding:6px 10px;
        min-height:44px;
        background:#071226;
        color:#fff;
        border-bottom:1px solid rgba(255,255,255,.12);
        box-shadow:0 8px 22px rgba(15,23,42,.18);
        font-size:13px;
      }
      #murainSharedAuthBar input{
        width:220px;
        max-width:42vw;
        min-height:34px;
        height:34px;
        border:1px solid rgba(255,255,255,.22);
        border-radius:999px;
        padding:6px 12px;
        background:#fff;
        color:#111827;
        outline:none;
        box-sizing:border-box;
        flex:0 0 220px;
      }
      #murainSharedAuthBar button{
        width:auto !important;
        min-width:54px;
        max-width:none;
        min-height:34px;
        height:34px;
        border:0;
        border-radius:999px;
        padding:0 14px;
        font-weight:800;
        cursor:pointer;
        flex:0 0 auto;
        box-sizing:border-box;
        line-height:1;
      }
      #murainSharedAuthBar .login{
        background:#22c55e;
        color:#052e16;
      }
      #murainSharedAuthBar .logout{
        background:#fee2e2;
        color:#991b1b;
      }
      #murainSharedAuthBar .role{
        padding:6px 10px;
        border-radius:999px;
        background:rgba(255,255,255,.12);
        font-weight:800;
      }
      #murainSharedAuthBar .msg{
        color:#fecaca;
        font-weight:700;
      }
      #murainSharedAuthLock{
        position:fixed;
        z-index:99990;
        inset:44px 0 0 0;
        background:rgba(248,250,252,.86);
        display:flex;
        align-items:flex-start;
        justify-content:center;
        padding-top:32px;
        backdrop-filter:blur(2px);
      }
      #murainSharedAuthLock .murain-auth-lock-card{
        width:min(520px,calc(100vw - 32px));
        background:#fff;
        border:1px solid #cbd5e1;
        border-radius:20px;
        padding:24px;
        box-shadow:0 18px 50px rgba(15,23,42,.16);
        color:#0f172a;
      }
      #murainSharedAuthLock h2{
        margin:0 0 10px;
        font-size:24px;
      }
      #murainSharedAuthLock p{
        margin:0;
        line-height:1.7;
        color:#475569;
      }
    `;
    document.head.appendChild(style);
  }

  function renderBar() {
    const required = inferRequiredRole(location.pathname);
    if (!required) return;

    ensureStyle();

    let auth = readAuth();
    seedLegacy(auth);

    let bar = document.getElementById("murainSharedAuthBar");

    if (!bar) {
      bar = document.createElement("div");
      bar.id = "murainSharedAuthBar";
      bar.innerHTML = `
        <strong>後台共用登入</strong>
        <input id="murainSharedAuthInput" type="password" placeholder="輸入統一密碼或主管密碼" autocomplete="current-password">
        <button class="login" id="murainSharedAuthLogin" type="button">登入</button>
        <button class="logout" id="murainSharedAuthLogout" type="button">登出</button>
        <span class="role" id="murainSharedAuthRole">未登入</span>
        <span class="msg" id="murainSharedAuthMsg"></span>
      `;
      document.body.insertBefore(bar, document.body.firstChild);
    }

    const input = document.getElementById("murainSharedAuthInput");
    const loginBtn = document.getElementById("murainSharedAuthLogin");
    const logoutBtn = document.getElementById("murainSharedAuthLogout");
    const roleEl = document.getElementById("murainSharedAuthRole");
    const msgEl = document.getElementById("murainSharedAuthMsg");

    function refresh() {
      auth = readAuth();

      roleEl.textContent = "目前權限：" + roleLabel(auth);
      logoutBtn.style.display = auth?.key ? "inline-block" : "none";

      applyTabPermission(auth);
      showLock(required, auth);

      if (auth?.key) fillLegacyInputs(auth.key);
    }

    loginBtn.onclick = async () => {
      msgEl.textContent = "登入中...";
      loginBtn.disabled = true;

      try {
        const saved = await verifyAndSave(input.value);
        msgEl.textContent = "登入成功，重新整理中...";
        seedLegacy(saved);

        // 重新整理一次，讓每個舊頁面原本的 OP_KEY 變數都吃到共用登入狀態
        location.reload();
      } catch (e) {
        msgEl.textContent = e.message || String(e);
      } finally {
        loginBtn.disabled = false;
      }
    };

    logoutBtn.onclick = () => clearAuth(true);

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") loginBtn.click();
    });

    refresh();
  }

  function getKey(requiredRole) {
    const auth = readAuth();
    if (!auth?.key) return "";

    const need = String(requiredRole || "").toLowerCase();

    if (need === "admin" && auth.role !== "admin") return "";
    if (need === "staff" && auth.role !== "staff" && auth.role !== "admin") return "";

    return String(auth.key || "").trim();
  }

  window.MURAIN_AUTH = {
    get: readAuth,
    getKey,
    canUse,
    login: verifyAndSave,
    logout: () => clearAuth(true),
    seedLegacy: () => seedLegacy(readAuth())
  };

  seedLegacy(readAuth());

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderBar);
  } else {
    renderBar();
  }
})();

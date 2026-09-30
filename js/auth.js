/* AgenticCore Pakistan — login / signup against the shared estate project */

function pkAuthMsg(text, ok) {
  const el = document.getElementById('authMsg');
  el.textContent = text;
  el.className = 'form-msg ' + (ok ? 'ok' : 'error');
}

// Only allow redirects to a page on this site (no open redirect).
function pkSafeNext(fallback) {
  const next = new URLSearchParams(location.search).get('next') || '';
  return /^[a-z0-9-]+\.html(#[A-Za-z0-9/_,-]*)?$/.test(next) ? next : fallback;
}

function pkSetBusy(btn, busy, key) {
  btn.disabled = busy;
  btn.textContent = pkT(busy ? 'auth_wait' : key);
}

document.addEventListener('DOMContentLoaded', function () {
  pkInitLanguage();
  const params = new URLSearchParams(location.search);

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    PkDB.currentUser().then(function (u) { if (u) location.href = pkSafeNext(u.role === 'admin' ? 'admin.html' : 'dashboard.html'); });
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const btn = document.getElementById('loginBtn');
      pkSetBusy(btn, true, 'auth_login_btn');
      const res = await PkDB.logIn(document.getElementById('identifier').value.trim(), document.getElementById('password').value);
      pkSetBusy(btn, false, 'auth_login_btn');
      if (res.error) { pkAuthMsg(res.error, false); return; }
      location.href = pkSafeNext(res.user.role === 'admin' ? 'admin.html' : 'dashboard.html');
    });
  }

  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    if (params.get('ref')) document.getElementById('referralCode').value = params.get('ref');
    // WhatsApp buttons fall back here while no number is configured; say so.
    if (params.get('intent') && !PK_CONFIG.whatsappNumber) document.getElementById('waFallbackNote').classList.remove('hidden');

    document.querySelectorAll('.role-option input').forEach(function (input) {
      input.addEventListener('change', function () {
        document.querySelectorAll('.role-option').forEach(function (o) { o.classList.remove('checked'); });
        input.closest('.role-option').classList.add('checked');
      });
    });

    signupForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const phone = document.getElementById('phone').value.trim();
      const password = document.getElementById('password').value;
      if (password.length < 8) { pkAuthMsg('Password must be at least 8 characters.', false); return; }
      if (!/^[0-9+\-\s]{7,}$/.test(phone)) { pkAuthMsg('Enter a valid phone number.', false); return; }
      const btn = document.getElementById('signupBtn');
      pkSetBusy(btn, true, 'auth_signup_btn');
      const res = await PkDB.signUp({
        fullName: document.getElementById('fullName').value.trim(),
        phone: phone,
        email: document.getElementById('email').value.trim(),
        password: password,
        role: (document.querySelector('input[name="role"]:checked') || {}).value || 'buyer',
        referralCode: document.getElementById('referralCode').value.trim()
      });
      pkSetBusy(btn, false, 'auth_signup_btn');
      if (res.error) { pkAuthMsg(res.error, false); return; }
      if (res.needsConfirmation) { pkAuthMsg('Account created. Check your email to confirm it, then log in.', true); signupForm.reset(); return; }
      if (typeof pkTrack === 'function') pkTrack('sign_up', params.get('intent') || 'direct');
      location.href = pkSafeNext('dashboard.html');
    });
  }
});

const USER_CACHE = { data: null };

async function sha256Hex(str) {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  const bytes = Array.from(new Uint8Array(buf));
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

function recordAudit(entry) {
  try {
    const list = JSON.parse(localStorage.getItem('audit_log') || '[]');
    list.push({ ...entry, ts: new Date().toISOString() });
    while (list.length > 500) {
      list.shift();
    }
    localStorage.setItem('audit_log', JSON.stringify(list));
  } catch (err) {
    console.error('audit log failed', err);
  }
}

function applyPasswordOverride(rec) {
  try {
    const override = JSON.parse(localStorage.getItem('override_' + rec.username) || 'null');
    if (override && override.password_hash && override.salt) {
      return { ...rec, salt: override.salt, password_hash: override.password_hash };
    }
  } catch (err) {
    console.warn('override parse failed', err);
  }
  return rec;
}

async function loadUsers() {
  if (USER_CACHE.data) {
    return USER_CACHE.data;
  }
  const res = await fetch('data/users.json');
  if (!res.ok) {
    throw new Error('Unable to load users.json');
  }
  USER_CACHE.data = await res.json();
  return USER_CACHE.data;
}

function getFormMessage(form) {
  return form.querySelector('.form-message') || document.getElementById('loginMsg');
}

async function handleLogin(ev, expectedRole) {
  ev.preventDefault();
  const form = ev.target;
  const userField = form.querySelector('input[name="username"], input#username');
  const passField = form.querySelector('input[name="password"], input#password');
  const msg = getFormMessage(form);
  const username = (userField?.value || '').trim();
  const password = passField?.value || '';

  if (msg) {
    msg.textContent = 'Checking…';
  }
  try {
    const db = await loadUsers();
    let rec = db.users.find(x => x.username === username);
    if (!rec) {
      if (msg) {
        msg.textContent = 'User not found';
      }
      return;
    }
    if (expectedRole === 'manager' && rec.role !== 'manager') {
      if (msg) {
        msg.textContent = 'Use the manager panel to sign in';
      }
      return;
    }
    if (expectedRole === 'member' && rec.role !== 'member') {
      if (msg) {
        msg.textContent = 'Use the manager login instead';
      }
      return;
    }

    rec = applyPasswordOverride(rec);

    const hash = await sha256Hex(rec.salt + password);
    if (hash !== rec.password_hash) {
      if (msg) {
        msg.textContent = 'Invalid password';
      }
      return;
    }

    const session = {
      username: rec.username,
      role: rec.role,
      branch: rec.branch || null,
      permissions: rec.permissions || [],
      ts: Date.now()
    };
    localStorage.setItem('sndp_session', JSON.stringify(session));
    recordAudit({ actor: rec.username, action: 'login', branch: rec.branch || null });
    if (msg) {
      msg.textContent = 'Login successful. Redirecting…';
    }
    location.href = 'app.html';
  } catch (err) {
    console.error(err);
    if (msg) {
      msg.textContent = 'Unable to load users';
    }
  }
}

function openReset(prefillId) {
  const modal = document.getElementById('resetModal');
  if (!modal) {
    return;
  }
  if (prefillId) {
    const field = document.getElementById(prefillId);
    if (field) {
      const value = field.value || field.getAttribute('placeholder') || '';
      const resetField = document.getElementById('resetUser');
      if (resetField) {
        resetField.value = value;
      }
    }
  }
  modal.classList.remove('hidden');
  const resetInput = document.getElementById('resetUser');
  if (resetInput) {
    resetInput.focus();
  }
}

function closeReset() {
  const modal = document.getElementById('resetModal');
  if (!modal) {
    return;
  }
  modal.classList.add('hidden');
  const resetUser = document.getElementById('resetUser');
  if (resetUser) {
    resetUser.value = '';
  }
  const area = document.getElementById('otpArea');
  if (area) {
    area.classList.add('hidden');
  }
  const status = document.getElementById('otpStatus');
  const hint = document.getElementById('otpHint');
  if (status) {
    status.textContent = '';
  }
  if (hint) {
    hint.textContent = '';
  }
}

async function sendOtp() {
  const user = document.getElementById('resetUser')?.value.trim();
  if (!user) {
    alert('Enter username');
    return;
  }
  const db = await loadUsers();
  const rec = db.users.find(x => x.username === user);
  if (!rec) {
    alert('User not found');
    return;
  }
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  localStorage.setItem('otp_' + user, JSON.stringify({ code, expires: Date.now() + 10 * 60 * 1000 }));
  const area = document.getElementById('otpArea');
  if (area) {
    area.classList.remove('hidden');
  }
  const status = document.getElementById('otpStatus');
  if (status) {
    status.textContent = '';
  }
  const hint = document.getElementById('otpHint');
  if (hint) {
    hint.textContent = `OTP for demo purposes: ${code}`;
  }
  recordAudit({ actor: user, action: 'otp_sent', branch: rec.branch || null });
}

async function submitReset() {
  const user = document.getElementById('resetUser')?.value.trim();
  const otp = document.getElementById('otpInput')?.value.trim();
  const pass = document.getElementById('newPassword')?.value;
  const status = document.getElementById('otpStatus');
  if (!otp || !pass) {
    if (status) {
      status.textContent = 'Enter OTP and new password';
    }
    return;
  }
  const stored = localStorage.getItem('otp_' + user);
  if (!stored) {
    if (status) {
      status.textContent = 'No OTP found, request again.';
    }
    return;
  }
  const rec = JSON.parse(stored);
  if (Date.now() > rec.expires) {
    if (status) {
      status.textContent = 'OTP expired. Request a new one.';
    }
    return;
  }
  if (rec.code !== otp) {
    if (status) {
      status.textContent = 'Incorrect OTP.';
    }
    return;
  }
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('');
  const hash = await sha256Hex(salt + pass);
  localStorage.setItem('override_' + user, JSON.stringify({ salt, password_hash: hash }));
  localStorage.removeItem('otp_' + user);
  if (status) {
    status.textContent = 'Password updated. You can now sign in.';
  }
  recordAudit({ actor: user, action: 'password_reset_override', branch: rec.branch || null });
}

async function downloadSampleWorkbook() {
  if (typeof XLSX === 'undefined') {
    alert('Excel helper not loaded.');
    return;
  }
  try {
    const res = await fetch('data/accounts/sample_account.json');
    const payload = await res.json();
    const dataset = Array.isArray(payload.account) ? payload.account : (payload.rows || []);
    const rows = dataset.map(row => ({ ...row }));
    let running = 0;
    const sheetRows = rows.map(r => {
      const amt = typeof r.Amount === 'number' ? r.Amount : parseFloat(r.Amount || 0) || 0;
      running += amt;
      return { ...r, Balance: running };
    });
    const ws = XLSX.utils.json_to_sheet(sheetRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Account');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sample_account_book.xlsx';
    a.click();
    URL.revokeObjectURL(a.href);
    const msg = document.getElementById('promptMsg');
    if (msg) {
      msg.textContent = 'Sample Excel downloaded. Import it into Excel or LibreOffice to explore the format.';
    }
  } catch (err) {
    console.error(err);
    const msg = document.getElementById('promptMsg');
    if (msg) {
      msg.textContent = 'Unable to load sample_account.json';
    }
  }
}

async function copyPrompt() {
  const prompt = document.getElementById('aiPrompt')?.value || '';
  try {
    await navigator.clipboard.writeText(prompt);
    const msg = document.getElementById('promptMsg');
    if (msg) {
      msg.textContent = 'Prompt copied to clipboard.';
    }
  } catch (err) {
    console.error(err);
    const msg = document.getElementById('promptMsg');
    if (msg) {
      msg.textContent = 'Copy failed — please select and copy manually.';
    }
  }
}

function initLoginPanels() {
  const memberForm = document.getElementById('publicLoginForm');
  if (memberForm) {
    memberForm.addEventListener('submit', ev => handleLogin(ev, 'member'));
  }
  const managerForm = document.getElementById('managerLoginForm');
  if (managerForm) {
    managerForm.addEventListener('submit', ev => handleLogin(ev, 'manager'));
  }
  const genericForm = document.getElementById('loginForm');
  if (genericForm) {
    genericForm.addEventListener('submit', ev => handleLogin(ev, 'any'));
  }

  document.querySelectorAll('button[data-reset]').forEach(btn => {
    btn.addEventListener('click', () => openReset(btn.getAttribute('data-reset')));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLoginPanels();
});

window.openReset = openReset;
window.closeReset = closeReset;
window.sendOtp = sendOtp;
window.submitReset = submitReset;
window.downloadSampleWorkbook = downloadSampleWorkbook;
window.copyPrompt = copyPrompt;

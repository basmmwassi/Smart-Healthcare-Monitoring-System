const API_BASE = 'https://smart-healthcare-monitoring-system.onrender.com';
const AUTH_URL = `${API_BASE}/api/auth`;

const loginForm = document.getElementById('login-form');
const msgEl = document.getElementById('login-msg');

function setMsg(text, isError = true) {
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.style.color = isError ? '#ffb4b4' : '#b6ffcf';
}

function saveRememberedEmail(email, remember) {
  if (remember) localStorage.setItem('savedEmail', email);
  else localStorage.removeItem('savedEmail');
}

document.addEventListener('DOMContentLoaded', () => {
  const savedEmail = localStorage.getItem('savedEmail');
  const emailInput = document.getElementById('login-email');
  if (savedEmail && emailInput) emailInput.value = savedEmail;
});

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    const remember = document.getElementById('remember')?.checked;

    if (!email || !password) {
      setMsg('Please enter email and password.');
      return;
    }

    try {
      setMsg('Logging in...', false);

      const res = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(data.message || 'Login failed. Check your credentials.');
        return;
      }

      const token = data.token;
      if (!token) {
        setMsg('Login succeeded but no token returned from server.');
        return;
      }

      // خزّن التوكن
      localStorage.setItem('token', token);

      // Remember me: خزّن الإيميل فقط
      saveRememberedEmail(email, remember);

      setMsg('Login successful! Redirecting...', false);

      window.location.href = 'dashboard.html';

    } catch (err) {
      setMsg('Server error. Please try again.');
    }
  });
}

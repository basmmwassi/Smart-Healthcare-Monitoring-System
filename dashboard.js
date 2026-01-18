const API_BASE = 'https://smart-healthcare-monitoring-system.onrender.com'
const token = localStorage.getItem('token')

function setDashMsg(text, isError = true) {
  const el = document.getElementById('dash-msg')
  if (!el) return
  el.textContent = text
  el.style.color = isError ? '#ffb4b4' : '#b6ffcf'
}

async function fetchMe() {
  if (!token) {
    window.location.href = 'index.html'
    return
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      localStorage.removeItem('token')
      window.location.href = 'index.html'
      return
    }

    const who = document.getElementById('whoami')
    if (who) who.textContent = `Signed in as: ${data.user?.email || 'Unknown'}`
    setDashMsg('Dashboard loaded successfully.', false)
  } catch {
    setDashMsg('Server error while loading dashboard.')
  }
}

function wireLogout() {
  const btn = document.getElementById('logout-btn')
  if (!btn) return
  btn.addEventListener('click', () => {
    localStorage.removeItem('token')
    window.location.href = 'index.html'
  })
}

wireLogout()
fetchMe()


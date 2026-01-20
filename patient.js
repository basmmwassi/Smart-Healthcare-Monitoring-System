const API_BASE = 'https://smart-healthcare-monitoring-system.onrender.com'
const token = localStorage.getItem('token')

function setMsg(text, isError = true) {
  const el = document.getElementById('p-msg')
  if (!el) return
  el.textContent = text
  el.style.color = isError ? '#ffb4b4' : '#b6ffcf'
}

function badgeClass(sev) {
  const s = String(sev || '').toUpperCase()
  if (s === 'CRITICAL') return 'b-critical'
  if (s === 'WARNING') return 'b-warning'
  return 'b-normal'
}

function fmtTime(ts) {
  if (!ts) return 'Unknown'
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return String(ts)
  return d.toLocaleString()
}

function qs(name) {
  return new URLSearchParams(window.location.search).get(name)
}



function renderLatest(latest) {
  const title = document.getElementById('p-title')
  const sub = document.getElementById('p-sub')
  const cards = document.getElementById('p-cards')

  const name = latest?.patientName || latest?.name || 'Unknown Patient'
  const id = latest?.patientId || 'Unknown'
  const sev = String(latest?.finalSeverity || 'NORMAL').toUpperCase()
  const ts = latest?.timestamp

  if (title) title.textContent = name
  if (sub) sub.innerHTML = `ID: <b>${id}</b> | Status: <span class="badge ${badgeClass(sev)}">${sev}</span> | Last update: ${fmtTime(ts)}`
  if (!cards) return

  const v = latest?.vitals || {}
  const fallText = v.fallDetected === true ? 'Yes' : v.fallDetected === false ? 'No' : 'Unknown'

  cards.innerHTML = `
    <div class="card"><div class="k">Heart Rate</div><div class="v">${v.heartRate ?? '--'}</div></div>
    <div class="card"><div class="k">SpO₂</div><div class="v">${v.spo2 ?? '--'}</div></div>
    <div class="card"><div class="k">Temperature</div><div class="v">${v.temperature ?? '--'}</div></div>
    <div class="card"><div class="k">Fall Detected</div><div class="v">${fallText}</div></div>
  `
}

function renderAlerts(alerts) {
  const ul = document.getElementById('p-alerts')
  if (!ul) return
  ul.innerHTML = ''

  if (!alerts.length) {
    const li = document.createElement('li')
    li.className = 'item'
    li.textContent = 'No alerts'
    ul.appendChild(li)
    return
  }

  for (const a of alerts) {
    const sev = String(a?.severity || a?.finalSeverity || 'INFO').toUpperCase()
    const msg = a?.message || 'Alert'
    const ts = a?.timestamp

    const li = document.createElement('li')
    li.className = 'item'
    li.innerHTML = `
  <div class="item-row">
    <div class="item-left">
      <div>
        <span class="badge ${badgeClass(sev)}">${sev}</span>
        ${isLatest ? `<span class="latest-tag">Latest</span>` : ``}
      </div>

      <div class="item-vitals">
        <span class="pill">HR: ${v.heartRate ?? '--'}</span>
        <span class="pill">SpO₂: ${v.spo2 ?? '--'}</span>
        <span class="pill">Temp: ${v.temperature ?? '--'}</span>
        <span class="pill">Fall: ${v.fallDetected === true ? 'Yes' : v.fallDetected === false ? 'No' : '--'}</span>
      </div>
    </div>

    <div class="item-right">
      ${fmtTime(ts)}
    </div>
  </div>
`

    ul.appendChild(li)
  }
}



function renderHistory(history) {
  const ul = document.getElementById('p-history')
  if (!ul) return
  ul.innerHTML = ''

  if (!history.length) {
    const li = document.createElement('li')
    li.className = 'item'
    li.textContent = 'No readings'
    ul.appendChild(li)
    return
  }

  for (let i = 0; i < history.length; i++) {
    const h = history[i] || {}
    const v = h.vitals || {}
    const sev = String(h.finalSeverity || 'NORMAL').toUpperCase()
    const ts = h.timestamp

    const isLatest = i === 0

    const li = document.createElement('li')
    li.className = 'item'
    li.innerHTML = `
      <div class="item-row">
        <div class="item-main">
          <div>
            <span class="badge ${badgeClass(sev)}">${sev}</span>
            ${isLatest ? `<span class="latest-tag">Latest</span>` : ``}
          </div>
          <div class="small">${fmtTime(ts)}</div>
          <div class="item-vitals">
            <span class="pill">HR: ${v.heartRate ?? '--'}</span>
            <span class="pill">SpO₂: ${v.spo2 ?? '--'}</span>
            <span class="pill">Temp: ${v.temperature ?? '--'}</span>
            <span class="pill">Fall: ${v.fallDetected === true ? 'Yes' : v.fallDetected === false ? 'No' : '--'}</span>
          </div>
        </div>
      </div>
    `
    ul.appendChild(li)
  }
}




async function fetchLatest(patientId) {
  const res = await fetch(`${API_BASE}/api/patients/${encodeURIComponent(patientId)}/latest`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.message || 'Failed to load latest')
  return data.latest || data.data || data
}


async function fetchAlerts(patientId) {
  const res = await fetch(`${API_BASE}/api/patients/${encodeURIComponent(patientId)}/alerts?limit=50`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.message || 'Failed to load alerts')

  const list =
    Array.isArray(data) ? data :
      Array.isArray(data.alerts) ? data.alerts :
        Array.isArray(data.data) ? data.data : []

  return list
}

async function fetchHistory(patientId) {
  const res = await fetch(`${API_BASE}/api/patients/${encodeURIComponent(patientId)}/history?limit=200`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.message || 'Failed to load history')

  const list =
    Array.isArray(data) ? data :
      Array.isArray(data.history) ? data.history :
        Array.isArray(data.data) ? data.data : []

  return list
}


async function init() {
  if (!token) {
    window.location.href = 'index.html'
    return
  }

  const patientId = qs('patientId')
  if (!patientId) {
    setMsg('Missing patientId in URL.', true)
    return
  }

  try {
    const latest = await fetchLatest(patientId)
    const history = await fetchHistory(patientId)
    const alerts = await fetchAlerts(patientId)

    renderLatest(latest)
    renderHistory(history)
    renderAlerts(alerts)

    setMsg('Loaded patient details.', false)

  } catch (e) {
    setMsg(String(e?.message || 'Error loading patient details.'), true)
    renderHistory([])
    renderAlerts([])
  }
}


init()

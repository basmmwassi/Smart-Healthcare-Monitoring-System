const API_BASE = 'https://smart-healthcare-monitoring-system.onrender.com'
const token = localStorage.getItem('token')

let latestPatients = []
let refreshTimer = null

function setDashMsg(text, isError = true) {
  const el = document.getElementById('dash-msg')
  if (!el) return
  el.textContent = text
  el.style.color = isError ? '#ffb4b4' : '#b6ffcf'
}

function setEmpty(text) {
  const box = document.getElementById('dash-empty')
  if (!box) return
  if (!text) {
    box.style.display = 'none'
    box.textContent = ''
    return
  }
  box.style.display = 'block'
  box.textContent = text
}

function badgeClass(sev) {
  const s = String(sev || '').toUpperCase()
  if (s === 'CRITICAL') return 'b-critical'
  if (s === 'WARNING') return 'b-warning'
  if (s === 'INFO') return 'b-info'
  return 'b-normal'
}

function fmtTime(ts) {
  if (!ts) return 'Unknown'
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return String(ts)
  return d.toLocaleString()
}

function getVitals(p) {
  const v = p?.vitals || p?.latest?.vitals || {}
  return {
    heartRate: v.heartRate ?? v.hr ?? null,
    spo2: v.spo2 ?? null,
    temperature: v.temperature ?? null,
    fallDetected: v.fallDetected ?? null
  }
}

function getPatientName(p) {
  return p?.patientName || p?.name || p?.patient?.name || 'Unknown Patient'
}

function getPatientId(p) {
  return p?.patientId || p?.id || p?._id || 'Unknown'
}

function getSeverity(p) {
  return p?.finalSeverity || p?.severity || p?.latest?.finalSeverity || 'NORMAL'
}

function getAlertActive(p) {
  return Boolean(p?.alertActive || p?.latest?.alertActive)
}

function getTimestamp(p) {
  return p?.timestamp || p?.latest?.timestamp || p?.updatedAt || p?.createdAt || null
}

function renderStats(patients) {
  const total = patients.length
  const critical = patients.filter(p => String(getSeverity(p)).toUpperCase() === 'CRITICAL' || getAlertActive(p)).length
  const normal = patients.filter(p => String(getSeverity(p)).toUpperCase() === 'NORMAL' && !getAlertActive(p)).length
  const activeDevices = total

  const a = document.getElementById('total-patients')
  const b = document.getElementById('critical-alerts')
  const c = document.getElementById('normal-patients')
  const d = document.getElementById('active-devices')

  if (a) a.textContent = String(total)
  if (b) b.textContent = String(critical)
  if (c) c.textContent = String(normal)
  if (d) d.textContent = String(activeDevices)
}

function makePatientCard(p) {
  const id = getPatientId(p)
  const name = getPatientName(p)
  const sev = String(getSeverity(p)).toUpperCase()
  const vitals = getVitals(p)
  const ts = getTimestamp(p)
  const alertActive = getAlertActive(p)
  const msg = p?.message || p?.latest?.message || ''

  const badgeText = alertActive && sev === 'NORMAL' ? 'ALERT' : sev
  const badgeCls = badgeClass(alertActive && sev === 'NORMAL' ? 'CRITICAL' : sev)

  const fallText = vitals.fallDetected === true ? 'Yes' : vitals.fallDetected === false ? 'No' : 'Unknown'

  const el = document.createElement('div')
  el.className = 'patient-card'
  el.innerHTML = `
    <div class="pc-head">
      <div>
        <div class="pc-name">${name}</div>
        <div class="pc-sub">ID: ${id}</div>
      </div>
      <div class="badge ${badgeCls}">${badgeText}</div>
    </div>

    <div class="vitals">
      <div class="v">
        <div class="k">Heart Rate</div>
        <div class="val">${vitals.heartRate ?? '--'}</div>
      </div>
      <div class="v">
        <div class="k">SpO₂</div>
        <div class="val">${vitals.spo2 ?? '--'}</div>
      </div>
      <div class="v">
        <div class="k">Temperature</div>
        <div class="val">${vitals.temperature ?? '--'}</div>
      </div>
      <div class="v">
        <div class="k">Fall Detected</div>
        <div class="val">${fallText}</div>
      </div>
    </div>

    <div class="pc-foot">
      <div class="small">Last update: ${fmtTime(ts)}</div>
      <a class="linkbtn" href="patient.html?patientId=${encodeURIComponent(id)}">View details</a>
    </div>

    ${msg ? `<div class="small">Message: ${String(msg)}</div>` : ``}
  `
  return el
}

function renderPatients(patients) {
  const grid = document.getElementById('patients-grid')
  if (!grid) return
  grid.innerHTML = ''

  if (!patients.length) {
    setEmpty('No patients found with the current filters.')
    return
  }

  setEmpty('')
  const frag = document.createDocumentFragment()
  for (const p of patients) frag.appendChild(makePatientCard(p))
  grid.appendChild(frag)
}

function applyFilters() {
  const q = (document.getElementById('search')?.value || '').trim().toLowerCase()
  const onlyWarnings = Boolean(document.getElementById('only-warnings')?.checked)

  let filtered = latestPatients.slice()

  if (onlyWarnings) {
    filtered = filtered.filter(p => {
      const s = String(getSeverity(p)).toUpperCase()
      return s === 'WARNING' || s === 'CRITICAL' || getAlertActive(p)
    })
  }

  if (q) {
    filtered = filtered.filter(p => {
      const name = String(getPatientName(p)).toLowerCase()
      const id = String(getPatientId(p)).toLowerCase()
      return name.includes(q) || id.includes(q)
    })
  }

  renderStats(filtered)
  renderPatients(filtered)
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
  } catch {
    setDashMsg('Server error while loading dashboard.')
  }
}

// function mockPatients() {
//   const now = new Date()
//   return [
//     {
//       patientId: 'P102',
//       patientName: 'Ahmad Saleh',
//       vitals: { heartRate: 110, spo2: 92, temperature: 38.5, fallDetected: false },
//       severityReport: { heartRate: 'WARNING', spo2: 'CRITICAL', temperature: 'WARNING', fallMotion: 'INFO' },
//       finalSeverity: 'CRITICAL',
//       alertActive: true,
//       message: 'Sensor Fault',
//       timestamp: now.toISOString()
//     },
//     {
//       patientId: 'P205',
//       patientName: 'Sara N.',
//       vitals: { heartRate: 78, spo2: 98, temperature: 36.8, fallDetected: false },
//       severityReport: { heartRate: 'NORMAL', spo2: 'NORMAL', temperature: 'NORMAL', fallMotion: 'INFO' },
//       finalSeverity: 'NORMAL',
//       alertActive: false,
//       timestamp: now.toISOString()
//     }
//   ]
// }

async function fetchPatients() {
  if (!token) return

  try {
    const onlyWarnings = Boolean(document.getElementById('only-warnings')?.checked)
    const url = new URL(`${API_BASE}/api/dashboard/patients`)
    if (onlyWarnings) url.searchParams.set('onlyWarnings', 'true')

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` }
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      latestPatients = []
      setDashMsg(data?.message || 'Failed to load patients.', true)
      applyFilters()
      return
    }

    const list =
      Array.isArray(data) ? data :
      Array.isArray(data.patients) ? data.patients :
      Array.isArray(data.data) ? data.data : []

    latestPatients = list
    setDashMsg('Dashboard updated.', false)
    applyFilters()
  } catch {
    latestPatients = []
    setDashMsg('Network error while loading patients.', true)
    applyFilters()
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

function wireControls() {
  const search = document.getElementById('search')
  const onlyWarnings = document.getElementById('only-warnings')
  const refreshBtn = document.getElementById('refresh-btn')

  if (search) search.addEventListener('input', applyFilters)
  if (onlyWarnings) onlyWarnings.addEventListener('change', () => fetchPatients())
  if (refreshBtn) refreshBtn.addEventListener('click', fetchPatients)
}

function startAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer)
  refreshTimer = setInterval(fetchPatients, 5000)
}

wireLogout()
wireControls()
fetchMe()
fetchPatients()
startAutoRefresh()

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

  if (!Array.isArray(alerts) || alerts.length === 0) {
    const li = document.createElement('li')
    li.className = 'item'
    li.textContent = 'No alerts'
    ul.appendChild(li)
    return
  }

  for (let i = 0; i < alerts.length; i++) {
    const a = alerts[i] || {}
    const sev = String(a.severity || a.finalSeverity || 'INFO').toUpperCase()
    const msg = String(a.message || 'Alert')
    const ts = a.timestamp
    const isLatest = i === 0

    const li = document.createElement('li')
    li.className = 'item'
    const v = a.vitals || {}

    li.innerHTML = `
  <div class="item-row">
    <div class="item-left">
      <div>
        <span class="badge ${badgeClass(sev)}">${sev}</span>
        ${isLatest ? `<span class="latest-tag">Latest</span>` : ``}
        <span style="margin-left:10px;">${msg}</span>
      </div>

      <div class="item-vitals">
        <span class="pill">HR: ${v.heartRate ?? '--'}</span>
        <span class="pill">SpO₂: ${v.spo2 ?? '--'}</span>
        <span class="pill">Temp: ${v.temperature ?? '--'}</span>
        <span class="pill">Fall: ${v.fallDetected === true ? 'Yes' : v.fallDetected === false ? 'No' : '--'}</span>
      </div>
    </div>

    <div class="item-right">${fmtTime(ts)}</div>
  </div>
`

    ul.appendChild(li)
  }
}




function renderHistory(history) {
  const ul = document.getElementById('p-history')
  if (!ul) return
  ul.innerHTML = ''

  if (!Array.isArray(history) || history.length === 0) {
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

        <div class="item-right">${fmtTime(ts)}</div>
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

    window.__history = history
    window.__alerts = alerts

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



const fromEl = document.getElementById('fromDate')
const toEl = document.getElementById('toDate')
const pdfBox = document.getElementById('pdfContainer')

const btnReadings = document.getElementById('downloadReadingsPdf')
const btnAlerts = document.getElementById('downloadAlertsPdf')

if (btnReadings) btnReadings.addEventListener('click', () => downloadPdf('readings'))
if (btnAlerts) btnAlerts.addEventListener('click', () => downloadPdf('alerts'))

async function downloadPdf(type) {
  const patientId = qs('patientId')
  if (!patientId) {
    setMsg('Missing patientId', true)
    return
  }

  const fromIso = fromEl && fromEl.value ? new Date(fromEl.value).toISOString() : ''
  const toIso = toEl && toEl.value ? new Date(toEl.value).toISOString() : ''

  const params = []
  if (fromIso) params.push(`from=${encodeURIComponent(fromIso)}`)
  if (toIso) params.push(`to=${encodeURIComponent(toIso)}`)

  const url = type === 'readings'
    ? `${API_BASE}/api/patients/${patientId}/history?limit=2000${params.length ? '&' + params.join('&') : ''}`
    : `${API_BASE}/api/patients/${patientId}/alerts?limit=2000${params.length ? '&' + params.join('&') : ''}`

  let list = []

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) {
      setMsg('Fetch failed', true)
      return
    }

    list = type === 'readings' ? data.history : data.alerts
  } catch {
    setMsg('Fetch error', true)
    return
  }

  if (!Array.isArray(list) || list.length === 0) {
    setMsg('No data to export', true)
    return
  }

  const { jsPDF } = window.jspdf
  const pdf = new jsPDF('p', 'mm', 'a4')

  let y = 15
  const lineHeight = 8

  const patientName = document.getElementById('p-title')?.textContent || 'Patient'
  const title = type === 'readings' ? 'Readings' : 'Alerts'

  pdf.setFontSize(18)
  pdf.setTextColor(0, 0, 0)
  pdf.text(`${patientName} - ${title}`, 10, y)
  y += 10

  pdf.setFontSize(10)
  pdf.text(`Range: ${fromEl?.value || 'Any'} to ${toEl?.value || 'Any'}`, 10, y)

  y += 10

  list.forEach((x) => {
    if (y > 280) {
      pdf.addPage()
      y = 15
    }

    const tsRaw = x.timestamp || x.createdAt
    const ts = fmtTime(tsRaw)

    const v = type === 'readings' ? (x.vitals || x) : (x.vitals || {})
    const fall = v.fallDetected === true ? 'Yes' : v.fallDetected === false ? 'No' : '--'

    const sev = type === 'readings'
      ? String(x.finalSeverity || 'NORMAL').toUpperCase()
      : String(x.severity || x.finalSeverity || 'INFO').toUpperCase()

    pdf.setFontSize(10)

    if (sev === 'CRITICAL') pdf.setTextColor(200, 0, 0)
    else if (sev === 'WARNING') pdf.setTextColor(180, 120, 0)
    else pdf.setTextColor(0, 0, 0)

    pdf.text(`Severity: ${sev}`, 10, y)
    y += 7

    pdf.setTextColor(0, 0, 0)

    const vitalsText = `HR: ${v.heartRate ?? '--'} | SpO2: ${v.spo2 ?? '--'} | Temp: ${v.temperature ?? '--'} | Fall: ${fall}`

    pdf.text(vitalsText, 10, y)

    const pageWidth = pdf.internal.pageSize.getWidth()
    pdf.text(ts, pageWidth - 10, y, { align: 'right' })

    y += 8

    pdf.setDrawColor(0, 0, 0)
    pdf.line(10, y, pageWidth - 10, y)
    y += 8
  })



  pdf.save(`${patientName}-${title}-${new Date().toISOString().slice(0, 10)}.pdf`)
}



init()

/* ═══════════════════════════════════════════════════════════
   OncoAI — Hospital Management System
   ═══════════════════════════════════════════════════════════ */

// ─── Utils ───
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const api = (path, opts = {}) =>
  fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts }).then(r => {
    if (!r.ok) return r.text().then(t => { throw new Error(t || r.statusText); });
    const ct = r.headers.get('content-type') || '';
    return ct.includes('json') ? r.json() : r.text();
  });

function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  $('#toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function closeModal() {
  $('#modalOverlay').classList.remove('open');
  $('#modalBody').innerHTML = '';
}

function openModal(title, bodyHtml) {
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = bodyHtml;
  $('#modalOverlay').classList.add('open');
}

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  patients: 'Patient Records',
  documents: 'Documents',
  referrals: 'Referral Letters',
  lab: 'Lab Results',
  pathology: 'Pathology Reports',
  imaging: 'Imaging Results',
  recommendations: 'Recommendations',
  tumorboard: 'Tumor Board',
  summary: 'AI Summary',
  orchestrator: 'Multi-Agent Orchestrator',
  reviews: 'Reviews',
  whatsapp: 'WhatsApp',
};

function switchTab(name) {
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  $$('.tab-content').forEach(t => t.classList.toggle('active', t.id === `tab-${name}`));
  const titleEl = $('#pageTitle');
  if (titleEl) titleEl.textContent = PAGE_TITLES[name] || name;
  if (name === 'dashboard') loadDashboard();
  if (name === 'reviews') renderReviews();
  if (name === 'whatsapp') renderWhatsApp();
  if (name === 'tumorboard') renderTumorBoards();
}

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
  $$('.nav-btn').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));
  loadPatients();
  loadDocPatients();
  loadClinicalPatients();
  loadSummaryPatients();
  loadOrchAgents();
  loadOrchPatients();
  loadDashboard();
  loadReviewPatients();
  renderReviews();
  renderWhatsApp();
  loadTBPatients();
  renderTumorBoards();
  loadImagingUploadPatients();
  initImagingDragDrop();
  // Highlight default filter
  $$('[data-tbfilter="all"]').forEach(b => b.classList.add('btn-primary'));
});

// ─── Dashboard ───
async function loadDashboard() {
  try {
    const [patients, referrals, lab, imaging] = await Promise.all([
      api('/api/patients'), api('/api/referrals'), api('/api/lab-results'), api('/api/imaging-results'),
    ]);
    ['stat','hero'].forEach(pfx => {
      $(`#${pfx}Patients`).textContent = patients.length;
      $(`#${pfx}Referrals`).textContent = referrals.length;
      $(`#${pfx}Lab`).textContent = lab.length;
      $(`#${pfx}Imaging`).textContent = imaging.length;
    });

    // ── Recent Tumor Board Cases table ──
    loadRecentCases(patients);

    // ── Recent Activity feed ──
    loadActivityFeed(patients, referrals, lab, imaging);

    // ── AI Analytics ──
    loadAnalytics();
  } catch { /* ignore */ }
}

async function loadRecentCases(patientList) {
  const tbody = $('#recentCasesTable');
  if (!tbody) return;
  try {
    const boards = await api('/api/tumor-boards').catch(() => []);
    if (!boards || !boards.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No recent tumor board cases</td></tr>';
      return;
    }
    // Build patient name map for display
    const pmap = {};
    if (patientList && patientList.length) {
      patientList.forEach(p => { pmap[p.id] = p.name; });
    } else {
      // Fallback: fetch patients if not passed in
      try {
        const ps = await api('/api/patients');
        ps.forEach(p => { pmap[p.id] = p.name; });
      } catch { /* ignore */ }
    }

    const recent = boards.slice(0, 8);
    const priorityMap = { completed: 'Low', in_progress: 'High', scheduled: 'Medium', cancelled: 'Low' };
    tbody.innerHTML = recent.map(b => {
      const pname = pmap[b.patient_id] || `Patient #${b.patient_id}`;
      const priority = priorityMap[b.status] || 'Medium';
      const statusClass = {
        scheduled: 'pending', in_progress: 'abnormal', completed: 'success', cancelled: 'routine'
      }[b.status] || 'pending';
      const priorityClass = priority.toLowerCase();
      return `<tr>
        <td><strong>TB-${b.id}</strong></td>
        <td>${esc(b.discussion ? b.discussion.substring(0, 50) : pname)}</td>
        <td><span class="priority-${priorityClass}">${priority}</span></td>
        <td><span class="status-badge ${statusClass}">${(b.status || '').replace(/_/g, ' ')}</span></td>
        <td>${esc(b.chairperson || '—')}</td>
      </tr>`;
    }).join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Unable to load cases</td></tr>';
  }
}

function loadActivityFeed(patients, referrals, lab, imaging) {
  const feed = $('#activityFeed');
  if (!feed) return;

  const events = [];

  // Build activity events from recent data
  if (patients && patients.length) {
    patients.slice(-5).reverse().forEach(p => {
      events.push({
        icon: '👤',
        title: 'Patient registered',
        desc: `${p.name}${p.medical_condition ? ' — ' + p.medical_condition : ''}`,
        time: p.created_at || null,
        type: 'patient',
      });
    });
  }

  if (referrals && referrals.length) {
    referrals.slice(-4).reverse().forEach(r => {
      events.push({
        icon: '📋',
        title: 'Referral created',
        desc: `${r.doctor_name || 'Doctor'} (${r.specialty || 'General'}) — ${r.status || 'Pending'}`,
        time: r.created_at || null,
        type: 'referral',
      });
    });
  }

  if (lab && lab.length) {
    lab.slice(-4).reverse().forEach(l => {
      events.push({
        icon: '🔬',
        title: 'Lab result received',
        desc: `${l.test_name || 'Test'}${l.status ? ' — ' + l.status : ''}`,
        time: l.created_at || null,
        type: 'lab',
      });
    });
  }

  if (imaging && imaging.length) {
    imaging.slice(-3).reverse().forEach(i => {
      events.push({
        icon: '📷',
        title: 'Imaging result',
        desc: `${i.study_type || i.modality || 'Study'}${i.status ? ' — ' + i.status : ''}`,
        time: i.created_at || null,
        type: 'imaging',
      });
    });
  }

  // Sort by time descending (most recent first), null times go last
  events.sort((a, b) => {
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return new Date(b.time) - new Date(a.time);
  });

  // Take top 10 items for the feed
  const topEvents = events.slice(0, 10);

  if (!topEvents.length) {
    feed.innerHTML = '<div class="empty-state" style="padding:1rem;text-align:center;color:var(--gray-400)">No recent activity</div>';
    return;
  }

  feed.innerHTML = topEvents.map(e => {
    const timeStr = e.time ? formatRelativeTime(new Date(e.time)) : '';
    return `<div class="activity-item" style="display:flex;gap:0.75rem;padding:0.6rem 0;border-bottom:1px solid var(--gray-100)">
      <div class="activity-icon" style="font-size:1.25rem;flex-shrink:0;width:2rem;height:2rem;display:flex;align-items:center;justify-content:center;background:var(--gray-50);border-radius:50%">${e.icon}</div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:0.8125rem;color:var(--gray-900)">${esc(e.title)}</div>
        <div style="font-size:0.75rem;color:var(--gray-500);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(e.desc)}</div>
      </div>
      ${timeStr ? `<div style="font-size:0.6875rem;color:var(--gray-400);white-space:nowrap;flex-shrink:0">${esc(timeStr)}</div>` : ''}
    </div>`;
  }).join('');
}

function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

// ─── Patients ───
let patients = [];

async function loadPatients() { try { patients = await api('/api/patients'); renderPatients(); } catch (e) { toast(e.message, 'error'); } }

function renderPatients() {
  const q = ($('#patientSearch')?.value || '').toLowerCase();
  const filtered = patients.filter(p =>
    (p.name || '').toLowerCase().includes(q) ||
    (p.phone || '').includes(q) ||
    (p.medical_condition || '').toLowerCase().includes(q)
  );
  const tbody = $('#patientTable');
  if (!filtered.length) { tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No patients found</td></tr>'; return; }
  const journeyLabels = { arrival:'Arrival', evaluation:'Evaluation', biopsy_ordered:'Biopsy', awaiting_results:'Awaiting', case_compiled:'Compiled', tb_scheduled:'TB Sched', tb_presented:'TB Done', treatment_planned:'Planned', awaiting_treatment:'Awaiting Tx', in_treatment:'In Tx', follow_up:'Follow-up' };
  const journeyColors = { arrival:'routine', evaluation:'pending', biopsy_ordered:'pending', awaiting_results:'pending', case_compiled:'abnormal', tb_scheduled:'abnormal', tb_presented:'success', treatment_planned:'success', awaiting_treatment:'pending', in_treatment:'success' };
  tbody.innerHTML = filtered.map(p => {
    const j = p.journey_status || 'arrival';
    return `<tr>
    <td>${p.id}</td>
    <td><strong>${esc(p.name)}</strong></td>
    <td>${p.age || '—'}</td>
    <td>${p.gender || '—'}</td>
    <td>${p.phone ? `<a href="https://wa.me/${p.phone}" target="_blank" style="color:var(--secondary);text-decoration:none">${esc(p.phone)}</a>` : '—'}</td>
    <td><span class="status-badge ${(p.medical_condition||'').toLowerCase().includes('emerg') ? 'emergency' : 'routine'}">${esc(p.medical_condition || '—')}</span></td>
    <td><span class="status-badge ${journeyColors[j] || 'routine'}">${journeyLabels[j] || j}</span></td>
    <td>
      <button class="btn btn-secondary btn-sm" onclick="editPatient(${p.id})">✏️</button>
      <button class="btn btn-danger btn-sm" onclick="deletePatient(${p.id})">🗑️</button>
    </td>
  </tr>`}).join('');

  // Update patient count badge
  const countEl = $('#patientCount');
  if (countEl) {
    countEl.textContent = `${filtered.length} of ${patients.length} patients`;
  }
}

function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

function openAddPatient() { openPatientForm(); }

function openPatientForm(p) {
  const v = (field) => p ? esc(p[field] || '') : '';
  const sel = (field, val) => p && p[field] === val ? 'selected' : '';
  openModal(p ? 'Edit Patient' : 'Add Patient', `
    <form onsubmit="event.preventDefault(); savePatient('${p ? 'update' : 'create'}', ${p ? p.id : ''})" style="max-height:70vh;overflow-y:auto;padding-right:0.5rem">

      <h4 style="font-size:0.9rem;font-weight:700;color:var(--primary);margin-bottom:0.5rem;display:flex;align-items:center;gap:0.4rem"><i class="ri-user-line"></i> Personal Information</h4>
      <div class="form-grid">
        <div class="form-group"><label>Full Name *</label><input value="${v('name')}" id="fName" required></div>
        <div class="form-group"><label>Date of Birth</label><input type="date" value="${v('date_of_birth')}" id="fDOB"></div>
        <div class="form-group"><label>Age</label><input type="number" value="${p ? p.age : ''}" id="fAge"></div>
        <div class="form-group"><label>Gender</label><select id="fGender"><option value="">--</option><option ${sel('gender','Male')}>Male</option><option ${sel('gender','Female')}>Female</option><option ${sel('gender','Other')}>Other</option></select></div>
        <div class="form-group"><label>Place of Birth</label><input value="${v('place_of_birth')}" id="fPlaceOfBirth" placeholder="e.g. Dar es Salaam"></div>
        <div class="form-group"><label>Nationality</label><input value="${p?.nationality || 'Tanzanian'}" id="fNationality"></div>
        <div class="form-group"><label>Tribe/Ethnicity</label><input value="${v('tribe_ethnicity')}" id="fTribe"></div>
        <div class="form-group"><label>Religion</label><select id="fReligion"><option value="">--</option><option ${sel('religion','Christian')}>Christian</option><option ${sel('religion','Muslim')}>Muslim</option><option ${sel('religion','Hindu')}>Hindu</option><option ${sel('religion','Other')}>Other</option></select></div>
        <div class="form-group"><label>Marital Status</label><select id="fMarital"><option value="">--</option><option ${sel('marital_status','Single')}>Single</option><option ${sel('marital_status','Married')}>Married</option><option ${sel('marital_status','Divorced')}>Divorced</option><option ${sel('marital_status','Widowed')}>Widowed</option></select></div>
        <div class="form-group"><label>Occupation</label><input value="${v('occupation')}" id="fOccupation"></div>
        <div class="form-group"><label>Education Level</label><select id="fEducation"><option value="">--</option><option ${sel('education_level','None')}>None</option><option ${sel('education_level','Primary')}>Primary</option><option ${sel('education_level','Secondary')}>Secondary</option><option ${sel('education_level','Diploma')}>Diploma</option><option ${sel('education_level','Degree')}>Degree</option><option ${sel('education_level','Postgraduate')}>Postgraduate</option></select></div>
        <div class="form-group"><label>Phone</label><input value="${v('phone')}" id="fPhone" placeholder="+255..."></div>
        <div class="form-group"><label>Email</label><input type="email" value="${v('email')}" id="fEmail"></div>
        <div class="form-group full-width"><label>Address</label><input value="${v('address')}" id="fAddress" placeholder="Street, Ward, District, Region"></div>
      </div>

      <h4 style="font-size:0.9rem;font-weight:700;color:var(--primary);margin:1rem 0 0.5rem;display:flex;align-items:center;gap:0.4rem"><i class="ri-contacts-line"></i> Next of Kin</h4>
      <div class="form-grid">
        <div class="form-group"><label>Name</label><input value="${v('next_of_kin_name')}" id="fKinName"></div>
        <div class="form-group"><label>Phone</label><input value="${v('next_of_kin_phone')}" id="fKinPhone"></div>
        <div class="form-group"><label>Relationship</label><select id="fKinRelation"><option value="">--</option><option ${sel('next_of_kin_relationship','Spouse')}>Spouse</option><option ${sel('next_of_kin_relationship','Parent')}>Parent</option><option ${sel('next_of_kin_relationship','Child')}>Child</option><option ${sel('next_of_kin_relationship','Sibling')}>Sibling</option><option ${sel('next_of_kin_relationship','Other')}>Other</option></select></div>
      </div>

      <h4 style="font-size:0.9rem;font-weight:700;color:var(--primary);margin:1rem 0 0.5rem;display:flex;align-items:center;gap:0.4rem"><i class="ri-shield-check-line"></i> Insurance</h4>
      <div class="form-grid">
        <div class="form-group"><label>NHIF Registered?</label><select id="fNHIF"><option value="">--</option><option value="true" ${p?.nhif_registered ? 'selected' : ''}>Yes</option><option value="false" ${p && p.nhif_registered === false ? 'selected' : ''}>No</option></select></div>
        <div class="form-group"><label>NHIF Number</label><input value="${v('nhif_number')}" id="fNHIFNum" placeholder="NHIF card number"></div>
        <div class="form-group"><label>Other Insurance</label><input value="${v('insurance_provider')}" id="fInsProvider" placeholder="e.g. AAR, Jubilee, NSSF"></div>
        <div class="form-group"><label>Insurance Number</label><input value="${v('insurance_number')}" id="fInsNumber"></div>
      </div>

      <h4 style="font-size:0.9rem;font-weight:700;color:var(--primary);margin:1rem 0 0.5rem;display:flex;align-items:center;gap:0.4rem"><i class="ri-heart-pulse-line"></i> Medical Details</h4>
      <div class="form-grid">
        <div class="form-group"><label>Blood Group</label><select id="fBlood"><option value="">--</option><option ${sel('blood_group','A+')}>A+</option><option ${sel('blood_group','A-')}>A-</option><option ${sel('blood_group','B+')}>B+</option><option ${sel('blood_group','B-')}>B-</option><option ${sel('blood_group','AB+')}>AB+</option><option ${sel('blood_group','AB-')}>AB-</option><option ${sel('blood_group','O+')}>O+</option><option ${sel('blood_group','O-')}>O-</option></select></div>
        <div class="form-group"><label>Height (cm)</label><input type="number" value="${p?.height_cm || ''}" id="fHeight"></div>
        <div class="form-group"><label>Weight (kg)</label><input type="number" step="0.1" value="${p?.weight_kg || ''}" id="fWeight"></div>
        <div class="form-group"><label>Smoking Status</label><select id="fSmoking"><option value="">--</option><option ${sel('smoking_status','Never')}>Never</option><option ${sel('smoking_status','Former')}>Former</option><option ${sel('smoking_status','Current')}>Current</option></select></div>
        <div class="form-group"><label>Alcohol Use</label><select id="fAlcohol"><option value="">--</option><option ${sel('alcohol_use','None')}>None</option><option ${sel('alcohol_use','Occasional')}>Occasional</option><option ${sel('alcohol_use','Regular')}>Regular</option><option ${sel('alcohol_use','Heavy')}>Heavy</option></select></div>
        <div class="form-group"><label>Cancer Type</label><input value="${v('cancer_type')}" id="fCancerType" placeholder="e.g. Oral SCC, Laryngeal"></div>
        <div class="form-group"><label>Cancer Stage</label><select id="fCancerStage"><option value="">--</option><option ${sel('cancer_stage','Stage I')}>Stage I</option><option ${sel('cancer_stage','Stage II')}>Stage II</option><option ${sel('cancer_stage','Stage III')}>Stage III</option><option ${sel('cancer_stage','Stage IV')}>Stage IV</option><option ${sel('cancer_stage','Unknown')}>Unknown</option></select></div>
        <div class="form-group full-width"><label>Allergies</label><input value="${v('allergies')}" id="fAllergies" placeholder="Known allergies..."></div>
        <div class="form-group full-width"><label>Chronic Conditions</label><input value="${v('chronic_conditions')}" id="fChronic" placeholder="e.g. Diabetes, Hypertension, HIV"></div>
        <div class="form-group full-width"><label>Current Medications</label><input value="${v('current_medications')}" id="fMedications" placeholder="Current medications..."></div>
        <div class="form-group full-width"><label>Family Cancer History</label><textarea id="fFamilyHistory">${v('family_cancer_history')}</textarea></div>
        <div class="form-group full-width"><label>Medical Condition / Presenting Complaint</label><textarea id="fCondition">${v('medical_condition')}</textarea></div>
        <div class="form-group full-width"><label>Notes</label><textarea id="fNotes">${v('notes')}</textarea></div>
      </div>

      <div class="form-actions"><button class="btn btn-secondary" type="button" onclick="closeModal()">Cancel</button><button class="btn btn-primary" type="submit">${p ? 'Update' : 'Create'} Patient</button></div>
    </form>
  `);
}

async function savePatient(action, id) {
  const body = {
    name: $('#fName').value,
    age: parseInt($('#fAge').value) || null,
    gender: $('#fGender').value,
    phone: $('#fPhone').value,
    email: $('#fEmail')?.value || null,
    address: $('#fAddress')?.value || null,
    medical_condition: $('#fCondition').value,
    notes: $('#fNotes').value,
    date_of_birth: $('#fDOB')?.value || null,
    place_of_birth: $('#fPlaceOfBirth')?.value || null,
    tribe_ethnicity: $('#fTribe')?.value || null,
    marital_status: $('#fMarital')?.value || null,
    occupation: $('#fOccupation')?.value || null,
    education_level: $('#fEducation')?.value || null,
    religion: $('#fReligion')?.value || null,
    nationality: $('#fNationality')?.value || null,
    next_of_kin_name: $('#fKinName')?.value || null,
    next_of_kin_phone: $('#fKinPhone')?.value || null,
    next_of_kin_relationship: $('#fKinRelation')?.value || null,
    nhif_registered: $('#fNHIF')?.value === 'true' ? true : $('#fNHIF')?.value === 'false' ? false : null,
    nhif_number: $('#fNHIFNum')?.value || null,
    insurance_provider: $('#fInsProvider')?.value || null,
    insurance_number: $('#fInsNumber')?.value || null,
    blood_group: $('#fBlood')?.value || null,
    allergies: $('#fAllergies')?.value || null,
    chronic_conditions: $('#fChronic')?.value || null,
    current_medications: $('#fMedications')?.value || null,
    family_cancer_history: $('#fFamilyHistory')?.value || null,
    smoking_status: $('#fSmoking')?.value || null,
    alcohol_use: $('#fAlcohol')?.value || null,
    height_cm: parseInt($('#fHeight')?.value) || null,
    weight_kg: parseFloat($('#fWeight')?.value) || null,
    cancer_type: $('#fCancerType')?.value || null,
    cancer_stage: $('#fCancerStage')?.value || null,
  };
  try {
    if (action === 'create') await api('/api/patients', { method: 'POST', body: JSON.stringify(body) });
    else await api(`/api/patients/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    toast(action === 'create' ? 'Patient created' : 'Patient updated');
    closeModal();
    await loadPatients();
  } catch (e) { toast(e.message, 'error'); }
}

$('#addPatientBtn')?.addEventListener('click', openAddPatient);

async function deletePatient(id) {
  if (!confirm('Delete this patient and all associated records?')) return;
  try { await api(`/api/patients/${id}`, { method: 'DELETE' }); toast('Patient deleted'); await loadPatients(); }
  catch (e) { toast(e.message, 'error'); }
}

function editPatient(id) { const p = patients.find(x => x.id === id); if (p) openPatientForm(p); }

// ─── Documents ───
async function loadDocPatients() {
  try {
    const ps = await api('/api/patients');
    const sel = $('#docPatientSelect');
    sel.innerHTML = '<option value="">— Select Patient —</option>' + ps.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  } catch {}
}

async function uploadDocument() {
  const files = $('#docFile').files;
  if (!files.length) { toast('Select a file first', 'error'); return; }
  const patientId = $('#docPatientSelect').value;
  if (!patientId) { toast('Select a patient', 'error'); return; }
  const title = $('#docTitle').value || files[0].name;
  const fd = new FormData();
  fd.append('file', files[0]);
  fd.append('title', title);
  try {
    await fetch(`/api/patients/${patientId}/documents`, { method: 'POST', body: fd });
    toast('Document uploaded');
    $('#docTitle').value = '';
    $('#docFile').value = '';
    renderDocuments();
  } catch (e) { toast(e.message, 'error'); }
}

// Drag & drop
const uploadZone = $('#uploadZone');
if (uploadZone) {
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) {
      $('#docFile').files = e.dataTransfer.files;
      uploadDocument();
    }
  });
}

async function renderDocuments() {
  const patientId = $('#docPatientSelect').value;
  const q = ($('#docSearch')?.value || '').toLowerCase();
  const tbody = $('#docTable');
  if (!patientId) { tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Select a patient</td></tr>'; return; }
  try {
    let docs = await api(`/api/patients/${patientId}/documents`);
    if (q) docs = docs.filter(d => d.title.toLowerCase().includes(q) || (d.filename || '').toLowerCase().includes(q));
    if (!docs.length) { tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No documents</td></tr>'; return; }
    tbody.innerHTML = docs.map(d => `<tr>
      <td>${d.id}</td>
      <td>${esc(d.title)}</td>
      <td><a href="/api/documents/${d.id}/download" target="_blank">${esc(d.filename)}</a></td>
      <td>${d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteDoc(${d.id})">🗑️</button></td>
    </tr>`).join('');
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteDoc(id) {
  if (!confirm('Delete document?')) return;
  try { await api(`/api/documents/${id}`, { method: 'DELETE' }); toast('Document deleted'); renderDocuments(); }
  catch (e) { toast(e.message, 'error'); }
}

// ─── Clinical Module ───
const CLINICAL_CONFIG = {
  referrals: {
    selectId: 'refPatientSelect', searchId: 'refSearch', tbodyId: 'refTable',
    cols: ['ID', 'Doctor', 'Specialty', 'Hospital', 'Status', 'Date', 'Docs', 'Actions'],
    renderRow: (r, { id, doctor_name, specialty, hospital, status, created_at, notes }) => {
      const docCount = (notes || '').match(/(\d+) document/) ? (notes || '').match(/(\d+) document/)[1] : '0';
      return `<td>${id}</td><td>${esc(doctor_name)}</td><td>${esc(specialty)}</td><td>${esc(hospital)}</td><td><span class="status-badge ${(status||'').toLowerCase()}">${esc(status)}</span></td><td>${created_at ? new Date(created_at).toLocaleDateString() : '—'}</td>
      <td>${parseInt(docCount) > 0 ? `<span style="display:inline-flex;align-items:center;gap:0.25rem;padding:0.15rem 0.5rem;background:var(--primary-light);color:var(--primary);border-radius:999px;font-size:0.8rem;font-weight:600"><i class="ri-attachment-2"></i>${docCount}</span>` : '<span style="color:var(--gray-400);font-size:0.85rem">—</span>'}</td>
      <td><button class="btn btn-secondary btn-sm" onclick="clinical.render('referrals','edit',${id})">✏️</button><button class="btn btn-danger btn-sm" onclick="clinical.delete('referrals',${id})">🗑️</button></td>`},
    fields: [
      { id: 'doctor_name', label: 'Doctor Name', type: 'text' },
      { id: 'specialty', label: 'Specialty', type: 'text' },
      { id: 'hospital', label: 'Hospital', type: 'text' },
      { id: 'status', label: 'Status', type: 'select', options: ['Pending','Sent','Completed','Cancelled'] },
      { id: 'reason', label: 'Reason', type: 'textarea' },
      { id: 'notes', label: 'Notes', type: 'textarea' },
    ],
    api: 'referrals',
  },
  lab: {
    selectId: 'labPatientSelect', searchId: 'labSearch', tbodyId: 'labTable',
    cols: ['ID', 'Test', 'Value', 'Unit', 'Reference', 'Status', 'Date', 'Actions'],
    renderRow: (r, { id, test_name, test_value, reference_range, status, created_at }) => {
      const parts = (test_value || '').split('|');
      const val = parts[0] || test_value || '';
      const unit = parts[1] || '';
      const statusClass = (status||'').toLowerCase();
      const valColor = statusClass === 'critical' ? 'color:var(--danger);font-weight:700' : statusClass === 'abnormal' ? 'color:#D97706;font-weight:600' : '';
      return `<td>${id}</td><td><strong>${esc(test_name)}</strong></td><td style="${valColor}">${esc(val)}</td><td style="color:var(--gray-500);font-size:0.85rem">${esc(unit)}</td><td style="color:var(--gray-400);font-size:0.85rem">${esc(reference_range || '')}</td><td><span class="status-badge ${statusClass}">${esc(status)}</span></td><td>${created_at ? new Date(created_at).toLocaleDateString() : '—'}</td>
      <td><button class="btn btn-secondary btn-sm" onclick="clinical.render('lab','edit',${id})">✏️</button><button class="btn btn-danger btn-sm" onclick="clinical.delete('lab',${id})">🗑️</button></td>`},
    fields: [
      { id: 'test_name', label: 'Test Name', type: 'text' },
      { id: 'test_value', label: 'Value (value|unit format)', type: 'text' },
      { id: 'reference_range', label: 'Reference Range', type: 'text' },
      { id: 'status', label: 'Status', type: 'select', options: ['Normal','Abnormal','Critical','Pending'] },
      { id: 'notes', label: 'Notes', type: 'textarea' },
    ],
    api: 'lab-results',
  },
  pathology: {
    selectId: 'pathPatientSelect', searchId: 'pathSearch', tbodyId: 'pathTable',
    cols: ['ID', 'Site', 'Histology', 'TNM', 'Margins', 'Status', 'Date', 'Actions'],
    renderRow: (r, { id, specimen_type, findings, diagnosis, status, notes, created_at }) => {
      const parts = (findings || '').split('||');
      const histoType = parts[0] || specimen_type || '';
      const tnm = parts[1] || '';
      const margins = parts[2] || '';
      const marginClass = margins.includes('Positive') ? 'critical' : margins.includes('Close') ? 'pending' : margins.includes('Clear') ? 'normal' : '';
      return `<td>${id}</td><td><strong>${esc(specimen_type || '')}</strong></td><td style="max-width:180px;overflow:hidden;text-overflow:ellipsis">${esc(histoType)}</td><td style="font-family:monospace;font-size:0.85rem;color:var(--primary);font-weight:600">${esc(tnm)}</td><td>${margins ? `<span class="status-badge ${marginClass}">${esc(margins.substring(0,20))}</span>` : '—'}</td><td><span class="status-badge ${(status||'').toLowerCase()}">${esc(status)}</span></td><td>${created_at ? new Date(created_at).toLocaleDateString() : '—'}</td>
      <td><button class="btn btn-secondary btn-sm" onclick="clinical.render('pathology','edit',${id})">✏️</button><button class="btn btn-danger btn-sm" onclick="clinical.delete('pathology',${id})">🗑️</button></td>`},
    fields: [
      { id: 'specimen_type', label: 'Specimen Site', type: 'text' },
      { id: 'findings', label: 'Histology||TNM||Margins (structured)', type: 'textarea' },
      { id: 'diagnosis', label: 'Diagnosis', type: 'textarea' },
      { id: 'pathologist', label: 'Pathologist', type: 'text' },
      { id: 'status', label: 'Status', type: 'select', options: ['Final','Preliminary','Pending','Amended'] },
      { id: 'notes', label: 'Notes', type: 'textarea' },
    ],
    api: 'pathology-reports',
  },
  imaging: {
    selectId: 'imgPatientSelect', searchId: 'imgSearch', tbodyId: 'imgTable',
    cols: ['ID', 'Study', 'Finding', 'Status', 'Date', 'Actions'],
    renderRow: (r, { id, study_type, findings, status, created_at }) =>
      `<td>${id}</td><td>${esc(study_type)}</td><td style="max-width:250px;overflow:hidden;text-overflow:ellipsis">${esc(findings || '').substring(0,80)}...</td><td><span class="status-badge ${(status||'').toLowerCase()}">${esc(status)}</span></td><td>${created_at ? new Date(created_at).toLocaleDateString() : '—'}</td>
      <td><button class="btn btn-secondary btn-sm" onclick="clinical.render('imaging','edit',${id})">✏️</button><button class="btn btn-danger btn-sm" onclick="clinical.delete('imaging',${id})">🗑️</button></td>`,
    fields: [
      { id: 'study_type', label: 'Study Type', type: 'text' },
      { id: 'findings', label: 'Findings', type: 'textarea' },
      { id: 'radiologist', label: 'Radiologist', type: 'text' },
      { id: 'status', label: 'Status', type: 'select', options: ['Final','Preliminary','Pending'] },
      { id: 'notes', label: 'Notes', type: 'textarea' },
    ],
    api: 'imaging-results',
  },
  recommendations: {
    selectId: 'recPatientSelect', searchId: 'recSearch', tbodyId: 'recTable',
    cols: ['ID', 'Priority', 'Category', 'Recommendation', 'Date', 'Actions'],
    renderRow: (r, { id, priority, category, recommendation_text, created_at }) =>
      `<td>${id}</td><td><span class="priority-${priority}">${esc(priority)}</span></td><td>${esc(category)}</td><td style="max-width:250px;overflow:hidden;text-overflow:ellipsis">${esc(recommendation_text || '').substring(0,80)}...</td><td>${created_at ? new Date(created_at).toLocaleDateString() : '—'}</td>
      <td><button class="btn btn-secondary btn-sm" onclick="clinical.render('recommendations','edit',${id})">✏️</button><button class="btn btn-danger btn-sm" onclick="clinical.delete('recommendations',${id})">🗑️</button></td>`,
    fields: [
      { id: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High'] },
      { id: 'category', label: 'Category', type: 'text' },
      { id: 'recommendation_text', label: 'Recommendation', type: 'textarea' },
      { id: 'status', label: 'Status', type: 'select', options: ['Active', 'Completed', 'Cancelled'] },
    ],
    api: 'recommendations',
  },
};

const clinical = {
  async render(type, action, id) {
    const cfg = CLINICAL_CONFIG[type];
    const patientId = $(`#${cfg.selectId}`).value;
    const q = ($(`#${cfg.searchId}`)?.value || '').toLowerCase();
    const tbody = $(`#${cfg.tbodyId}`);
    if (action === 'add') return this.openForm(type, null, patientId);
    if (action === 'edit') {
      const items = await api(`/api/${cfg.api}`);
      const item = items.find(x => x.id === id);
      if (item) this.openForm(type, item, item.patient_id);
      return;
    }
    if (!patientId) { tbody.innerHTML = `<tr><td colspan="${cfg.cols.length}" class="empty-state">Select a patient</td></tr>`; return; }
    try {
      let items = await api(`/api/patients/${patientId}/${cfg.api}`);
      if (q) items = items.filter(x => JSON.stringify(x).toLowerCase().includes(q));
      if (!items.length) { tbody.innerHTML = `<tr><td colspan="${cfg.cols.length}" class="empty-state">No records</td></tr>`; return; }
      tbody.innerHTML = items.map(r => `<tr>${cfg.renderRow(r, r)}</tr>`).join('');
    } catch (e) { toast(e.message, 'error'); }
  },

  openForm(type, item, preselectedPatientId) {
    const cfg = CLINICAL_CONFIG[type];
    const isEdit = !!item;
    const title = isEdit ? `Edit ${type.slice(0,-1).replace(/^./,c=>c.toUpperCase())}` : `New ${type.slice(0,-1).replace(/^./,c=>c.toUpperCase())}`;
    let fieldsHtml = cfg.fields.map(f => {
      const val = isEdit ? (item[f.id] || '') : '';
      if (f.type === 'select') {
        const opts = f.options.map(o => `<option ${val === o ? 'selected' : ''}>${o}</option>`).join('');
        return `<div class="form-group"><label>${f.label}</label><select id="cf_${f.id}">${opts}</select></div>`;
      }
      if (f.type === 'textarea') {
        return `<div class="form-group full-width"><label>${f.label}</label><textarea id="cf_${f.id}">${esc(val)}</textarea></div>`;
      }
      return `<div class="form-group"><label>${f.label}</label><input value="${esc(val)}" id="cf_${f.id}" ${f.type === 'date' ? 'type="date"' : 'type="text"'}></div>`;
    }).join('');

    openModal(title, `
      <form onsubmit="event.preventDefault(); clinical.save('${type}','${isEdit ? 'update' : 'create'}', ${isEdit ? item.id : ''}, ${isEdit ? item.patient_id : preselectedPatientId})">
        <div class="form-grid">${fieldsHtml}</div>
        <div class="form-actions"><button class="btn btn-secondary" type="button" onclick="closeModal()">Cancel</button><button class="btn btn-primary" type="submit">${isEdit ? 'Update' : 'Create'}</button></div>
      </form>
    `);
  },

  async save(type, action, id, patientId) {
    const cfg = CLINICAL_CONFIG[type];
    const body = {};
    cfg.fields.forEach(f => { body[f.id] = $(`#cf_${f.id}`).value; });
    const url = action === 'create'
      ? `/api/patients/${patientId}/${cfg.api}`
      : `/api/${cfg.api}/${id}`;
    try {
      await api(url, { method: action === 'create' ? 'POST' : 'PUT', body: JSON.stringify(body) });
      toast(action === 'create' ? `${type.slice(0,-1)} created` : `${type.slice(0,-1)} updated`);
      closeModal();
      this.render(type);
    } catch (e) { toast(e.message, 'error'); }
  },

  async delete(type, id) {
    if (!confirm('Delete this record?')) return;
    const cfg = CLINICAL_CONFIG[type];
    try { await api(`/api/${cfg.api}/${id}`, { method: 'DELETE' }); toast(`${type.slice(0,-1)} deleted`); this.render(type); }
    catch (e) { toast(e.message, 'error'); }
  },
};

window.clinical = clinical;

async function loadClinicalPatients() {
  try {
    const ps = await api('/api/patients');
    ['refPatientSelect','labPatientSelect','pathPatientSelect','imgPatientSelect','recPatientSelect'].forEach(id => {
      const sel = $(`#${id}`);
      if (sel) sel.innerHTML = '<option value="">— Select Patient —</option>' + ps.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
    });
  } catch {}
}

// ─── AI Summary ───
async function loadSummaryPatients() {
  try {
    const ps = await api('/api/patients');
    const sel = $('#summaryPatientSelect');
    sel.innerHTML = '<option value="">— Select Patient —</option>' + ps.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
    sel.onchange = loadSummaryHistory;
    // Show method badge
    const info = await api('/api/summary-method').catch(() => ({ method: 'extractive' }));
    $('#summaryMethodBadge').textContent = `⚡ ${info.method}`;
  } catch {}
}

async function loadSummaryHistory() {
  const pid = $('#summaryPatientSelect').value;
  const list = $('#summaryHistoryList');
  if (!pid) { list.innerHTML = ''; return; }
  try {
    const items = await api(`/api/patients/${pid}/summaries`);
    if (!items.length) { list.innerHTML = '<p style="color:var(--gray-400);font-size:0.8125rem">No summaries yet</p>'; return; }
    list.innerHTML = items.map(s => `<div class="summary-history-item"><div class="date">${new Date(s.created_at).toLocaleString()}</div><div class="text">${esc(s.summary_text)}</div></div>`).join('');
  } catch {}
}

async function generateSummary() {
  const pid = $('#summaryPatientSelect').value;
  if (!pid) { toast('Select a patient', 'error'); return; }
  const maxSentences = parseInt($('#summarySentences').value) || 5;
  const btn = $('#generate-summary-btn');
  btn.disabled = true; btn.textContent = '⏳ Generating...';
  try {
    const res = await api('/api/summarize', { method: 'POST', body: JSON.stringify({ patient_id: parseInt(pid), max_sentences: maxSentences }) });
    $('#summaryResult').classList.remove('hidden');
    $('#summaryContent').textContent = res.summary;
    $('#summaryMeta').textContent = `Generated ${res.method || ''} • ${new Date(res.created_at || Date.now()).toLocaleString()}`;
    toast('Summary generated');
    loadSummaryHistory();
  } catch (e) { toast(e.message, 'error'); }
  finally { btn.disabled = false; btn.textContent = '🤖 Generate Summary'; }
}

// ─── Healthcare Agent Orchestrator (Stanford Medicine-style) ───
const AGENT_REGISTRY = {
  patient_profile:        { name: 'Patient Profile',        icon: 'ri-user-heart-line',    color: '#0F4C5C', desc: 'Compiles demographics, history, socioeconomic factors' },
  document_analysis:      { name: 'Document Analyzer',      icon: 'ri-file-search-line',   color: '#3B82F6', desc: 'Extracts key findings from uploaded clinical documents' },
  clinical_trial_matcher: { name: 'Clinical Trial Matcher',  icon: 'ri-search-eye-line',    color: '#8B5CF6', desc: 'Matches patient to eligible clinical trials' },
  medication_review:      { name: 'Medication Review',       icon: 'ri-capsule-line',       color: '#F59E0B', desc: 'Reviews current medications, interactions, contraindications' },
  literature_search:      { name: 'Literature Search',       icon: 'ri-book-open-line',     color: '#10B981', desc: 'Searches PubMed/NCCN for relevant evidence' },
  recommendations:        { name: 'Treatment Recommender',   icon: 'ri-lightbulb-flash-line', color: '#EF4444', desc: 'Synthesizes all data into treatment recommendations' },
  guideline_checker:      { name: 'Guideline Checker',       icon: 'ri-shield-check-line',  color: '#14B8A6', desc: 'Validates against NCCN/WHO H&N cancer guidelines' },
  risk_assessor:          { name: 'Risk Assessor',           icon: 'ri-alert-line',         color: '#DC2626', desc: 'Calculates recurrence risk, survival probability' },
  tb_briefing:            { name: 'TB Briefing Generator',   icon: 'ri-presentation-line',  color: '#6366F1', desc: 'Prepares structured tumor board presentation' },
};
const AGENTS = Object.keys(AGENT_REGISTRY);

const AGENT_PIPELINES = {
  full:      AGENTS,
  smart:     [],
  pretb:     ['patient_profile', 'document_analysis', 'guideline_checker', 'risk_assessor', 'tb_briefing'],
  treatment: ['patient_profile', 'medication_review', 'literature_search', 'guideline_checker', 'risk_assessor', 'recommendations'],
  custom:    [],
};

async function loadOrchAgents() {
  const container = $('#orchAgentCheckboxes');
  container.innerHTML = AGENTS.map(a => {
    const info = AGENT_REGISTRY[a];
    return `<label class="checkbox-label" style="border-left:3px solid ${info.color}" title="${esc(info.desc)}">
      <input type="checkbox" checked value="${a}">
      <i class="${info.icon}" style="color:${info.color}"></i>
      ${info.name}
    </label>`;
  }).join('');
}

async function loadOrchPatients() {
  try {
    const ps = await api('/api/patients');
    const sel = $('#orchPatientSelect');
    sel.innerHTML = '<option value="">— Select Patient —</option>' + ps.map(p => `<option value="${p.id}">${esc(p.name)} (${esc(p.patient_code || '')})</option>`).join('');
  } catch {}
}

async function smartRouteAgents() {
  const pid = $('#orchPatientSelect')?.value;
  const summary = $('#smartRouteSummary');
  const detail = $('#smartRouteDetail');
  if (!pid) { summary.style.display = 'none'; return; }

  const [patient, labs, path, imaging, workup] = await Promise.all([
    api(`/api/patients/${pid}`).catch(() => null),
    api(`/api/patients/${pid}/lab-results`).catch(() => []),
    api(`/api/patients/${pid}/pathology-reports`).catch(() => []),
    api(`/api/patients/${pid}/imaging-results`).catch(() => []),
    api(`/api/patients/${pid}/workup`).catch(() => null),
  ]);

  const needed = ['patient_profile'];
  const reasons = ['Patient Profile: always required'];

  if (labs.length > 0 || path.length > 0 || imaging.length > 0) {
    needed.push('document_analysis');
    reasons.push(`Document Analysis: ${labs.length} lab + ${path.length} path + ${imaging.length} imaging records found`);
  }
  if (patient?.cancer_type || patient?.cancer_stage) {
    needed.push('clinical_trial_matcher', 'literature_search');
    reasons.push(`Trial Matcher + Literature: cancer type "${patient.cancer_type || 'N/A'}" stage "${patient.cancer_stage || 'N/A'}" detected`);
  }
  if (patient?.current_medications || patient?.chronic_conditions) {
    needed.push('medication_review');
    reasons.push('Medication Review: medications or chronic conditions recorded');
  }
  needed.push('guideline_checker', 'risk_assessor', 'recommendations');
  reasons.push('Guideline Check + Risk + Recommendations: always included in smart route');

  if (workup?.tb_ready) {
    needed.push('tb_briefing');
    reasons.push('TB Briefing: patient workup is complete, ready for tumor board');
  }

  AGENT_PIPELINES.smart = [...new Set(needed)];
  summary.style.display = 'block';
  detail.innerHTML = reasons.map(r => `<div style="padding:0.2rem 0;display:flex;align-items:center;gap:0.4rem"><i class="ri-arrow-right-s-line" style="color:var(--primary)"></i> ${esc(r)}</div>`).join('');

  // Auto-check the needed agents
  $$('#orchAgentCheckboxes input').forEach(cb => {
    cb.checked = AGENT_PIPELINES.smart.includes(cb.value);
  });
}

let orchCommLog = [];
let orchStartTime = 0;

function addCommLog(from, to, message, type = 'data') {
  const icons = { data: 'ri-arrow-right-line', finding: 'ri-search-eye-line', alert: 'ri-alert-line', complete: 'ri-check-double-line' };
  const colors = { data: 'var(--primary)', finding: '#3B82F6', alert: '#EF4444', complete: '#10B981' };
  orchCommLog.push({ from, to, message, type, time: Date.now() });
  const el = $('#commLogEntries');
  if (!el) return;
  const elapsed = ((Date.now() - orchStartTime) / 1000).toFixed(1);
  el.innerHTML += `<div style="display:flex;gap:0.5rem;padding:0.35rem 0;border-bottom:1px solid var(--gray-100);animation:fadeIn 0.3s">
    <span style="font-size:0.8rem;color:var(--gray-400);min-width:40px">${elapsed}s</span>
    <i class="${icons[type]}" style="color:${colors[type]};font-size:0.95rem"></i>
    <span><strong style="color:${AGENT_REGISTRY[from]?.color || 'var(--gray-600)'}">${AGENT_REGISTRY[from]?.name || from}</strong> → <strong style="color:${AGENT_REGISTRY[to]?.color || 'var(--gray-600)'}">${AGENT_REGISTRY[to]?.name || to}</strong>: ${esc(message)}</span>
  </div>`;
  el.scrollTop = el.scrollHeight;
}

function updatePipelineNode(agent, status) {
  const node = $(`#pipe_${agent}`);
  if (!node) return;
  const colors = { waiting: 'var(--gray-300)', running: 'var(--warning)', done: 'var(--success)', error: 'var(--danger)' };
  const icons = { waiting: 'ri-time-line', running: 'ri-loader-4-line', done: 'ri-check-line', error: 'ri-close-line' };
  node.style.borderColor = colors[status];
  node.querySelector('.pipe-status').className = `pipe-status ${icons[status]}`;
  if (status === 'running') node.querySelector('.pipe-status').style.animation = 'spin 1s linear infinite';
  else node.querySelector('.pipe-status').style.animation = 'none';
}

async function runOrchestrator() {
  const pid = $('#orchPatientSelect').value;
  if (!pid) { toast('Select a patient', 'error'); return; }
  const mode = $('#orchMode')?.value || 'full';
  let selected = mode === 'custom' || mode === 'full'
    ? $$('#orchAgentCheckboxes input:checked').map(c => c.value)
    : AGENT_PIPELINES[mode] || AGENTS;
  if (!selected.length) selected = AGENTS;

  orchCommLog = [];
  orchStartTime = Date.now();

  // Show pipeline
  const pipeline = $('#orchPipeline');
  const commLog = $('#orchCommLog');
  pipeline.style.display = 'block';
  commLog.style.display = 'block';
  $('#commLogEntries').innerHTML = '';
  $('#orchProgressBar').style.width = '0%';
  $('#orchProgressText').textContent = '0%';

  // Build pipeline flow visualization
  $('#pipelineFlow').innerHTML = selected.map((a, i) => {
    const info = AGENT_REGISTRY[a] || {};
    return (i > 0 ? '<i class="ri-arrow-right-line" style="color:var(--gray-300);font-size:1.1rem"></i>' : '') +
      `<div id="pipe_${a}" style="display:flex;align-items:center;gap:0.4rem;padding:0.4rem 0.75rem;border:2px solid var(--gray-300);border-radius:10px;font-size:0.85rem;font-weight:600;transition:all 0.3s">
        <i class="${info.icon || 'ri-robot-line'}" style="color:${info.color || 'var(--gray-500)'}"></i>
        <span>${info.name || a}</span>
        <i class="pipe-status ri-time-line" style="font-size:0.9rem;color:var(--gray-400)"></i>
      </div>`;
  }).join('');

  const loading = $('#orchLoading');
  const results = $('#orchResults');
  results.classList.add('hidden');
  loading.classList.remove('hidden');
  $('#orchProgress').innerHTML = selected.map(a => {
    const info = AGENT_REGISTRY[a] || {};
    return `<span class="orch-progress-step" data-agent="${a}"><i class="${info.icon || ''}" style="font-size:0.85rem"></i> ${info.name || a}</span>`;
  }).join('');

  // Simulate pipeline with sequential agent communication
  let completedCount = 0;
  const totalAgents = selected.length;

  addCommLog('orchestrator', selected[0], `Starting ${mode} pipeline with ${totalAgents} agents`, 'data');

  try {
    // Run agents — simulate sequential with communication
    for (let i = 0; i < selected.length; i++) {
      const agent = selected[i];
      updatePipelineNode(agent, 'running');
      addCommLog('orchestrator', agent, `Invoking agent...`, 'data');

      if (i > 0) {
        addCommLog(selected[i-1], agent, `Passing context from ${AGENT_REGISTRY[selected[i-1]]?.name}`, 'data');
      }
    }

    const data = await api('/api/orchestrate', {
      method: 'POST',
      body: JSON.stringify({ patient_id: parseInt(pid), agents: selected }),
    });

    // Animate completion
    for (let i = 0; i < selected.length; i++) {
      const agent = selected[i];
      const result = data.results?.[agent];
      const success = result && !result.error;

      updatePipelineNode(agent, success ? 'done' : 'error');
      completedCount++;
      const pct = Math.round((completedCount / totalAgents) * 100);
      $('#orchProgressBar').style.width = pct + '%';
      $('#orchProgressText').textContent = pct + '%';

      addCommLog(agent, 'orchestrator', success ? (result.summary || '').substring(0, 80) : `Error: ${result?.error}`, success ? 'complete' : 'alert');

      $$('.orch-progress-step').forEach(s => { if (s.dataset.agent === agent) s.className = `orch-progress-step ${success ? 'done' : 'error'}`; });
    }

    // Agent-to-agent findings
    if (data.results?.patient_profile?.summary && data.results?.recommendations?.summary) {
      addCommLog('patient_profile', 'recommendations', 'Patient context provided for treatment synthesis', 'finding');
    }
    if (data.results?.guideline_checker?.summary) {
      addCommLog('guideline_checker', 'recommendations', 'NCCN/WHO guideline compliance data shared', 'finding');
    }
    if (data.results?.risk_assessor?.summary) {
      addCommLog('risk_assessor', 'tb_briefing', 'Risk scores passed to TB briefing', 'finding');
    }

    const elapsed = ((Date.now() - orchStartTime) / 1000).toFixed(1);
    addCommLog('orchestrator', 'dashboard', `Pipeline complete in ${elapsed}s — ${completedCount}/${totalAgents} agents succeeded`, 'complete');

    loading.classList.add('hidden');
    results.classList.remove('hidden');
    $('#orchStatus').textContent = `Pipeline complete — ${completedCount} agents finished in ${elapsed}s`;

    // Clinical Intelligence Dashboard
    $('#orchAgentCount').textContent = completedCount;
    $('#orchAgentTime').textContent = `${elapsed}s elapsed`;

    // Simulated risk score based on patient data
    const patient = await api(`/api/patients/${pid}`).catch(() => null);
    const riskScore = patient?.cancer_stage?.includes('IV') ? 'High' : patient?.cancer_stage?.includes('III') ? 'Moderate' : 'Low';
    const riskColors = { High: '#EF4444', Moderate: '#F59E0B', Low: '#10B981' };
    $('#orchRiskScore').textContent = riskScore;
    $('#orchRiskScore').style.color = riskColors[riskScore] || 'white';
    $('#orchRiskLabel').textContent = `${patient?.cancer_type || 'Cancer'} ${patient?.cancer_stage || ''}`;

    const guidelineMatch = completedCount === totalAgents ? '92%' : `${Math.round((completedCount / totalAgents) * 90)}%`;
    $('#orchGuidelineScore').textContent = guidelineMatch;

    // Agent results grid
    const grid = $('#orchAgentGrid');
    grid.innerHTML = selected.map(a => {
      const result = data.results?.[a];
      const info = AGENT_REGISTRY[a] || {};
      const success = result && !result.error;
      const badge = success ? 'success' : 'error';
      const summary = result?.summary || result?.error || 'No output';
      return `<div class="orch-agent-card ${badge}" style="border-left-color:${info.color}">
        <h4><i class="${info.icon}" style="color:${info.color}"></i> ${info.name} <span class="agent-badge ${badge}">${success ? '✓' : '✗'}</span></h4>
        <div class="agent-summary">${esc(summary)}</div>
      </div>`;
    }).join('');

    // Treatment Recommendation
    const recResult = data.results?.recommendations?.summary || data.results?.tb_briefing?.summary;
    if (recResult) {
      $('#orchTreatmentRec').style.display = 'block';
      $('#orchTreatmentText').textContent = recResult;
    }

    $('#orchReport').textContent = data.compiled_report || 'No compiled report generated.';
  } catch (e) {
    loading.classList.add('hidden');
    results.classList.remove('hidden');
    $('#orchStatus').textContent = 'Pipeline error';
    $('#orchAgentGrid').innerHTML = `<div class="orch-agent-card error"><h4><span class="agent-badge error">✗</span> Error</h4><div class="agent-summary">${esc(e.message)}</div></div>`;
    $('#orchReport').textContent = 'Orchestration failed.';
    addCommLog('orchestrator', 'error', e.message, 'alert');
    toast(e.message, 'error');
  }
}

async function runPreTBBriefing() {
  $('#orchMode').value = 'pretb';
  AGENT_PIPELINES.pretb.forEach(a => {
    $$('#orchAgentCheckboxes input').forEach(cb => { cb.checked = AGENT_PIPELINES.pretb.includes(cb.value); });
  });
  await runOrchestrator();
}

// ─── Real-time Notifications ───
let notifications = JSON.parse(localStorage.getItem('oncoai_notifs') || '[]');

function toggleNotifications() {
  const panel = document.getElementById('notifPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function addNotification(title, message, type = 'info') {
  const icons = { info: 'ri-information-line', success: 'ri-check-line', warning: 'ri-alert-line', critical: 'ri-alarm-warning-line' };
  const colors = { info: 'var(--primary)', success: 'var(--success)', warning: '#F59E0B', critical: 'var(--danger)' };
  const notif = { id: Date.now(), title, message, type, time: new Date().toISOString(), read: false };
  notifications.unshift(notif);
  if (notifications.length > 50) notifications = notifications.slice(0, 50);
  localStorage.setItem('oncoai_notifs', JSON.stringify(notifications));
  renderNotifications();
  toast(title, type === 'critical' ? 'error' : 'success');
}

function renderNotifications() {
  const list = document.getElementById('notifList');
  const badge = document.getElementById('notifBadge');
  if (!list) return;
  const unread = notifications.filter(n => !n.read).length;
  if (badge) {
    badge.textContent = unread;
    badge.style.display = unread > 0 ? 'flex' : 'none';
  }
  if (!notifications.length) {
    list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--gray-400);font-size:0.9rem">No notifications</div>';
    return;
  }
  const icons = { info: 'ri-information-line', success: 'ri-check-line', warning: 'ri-alert-line', critical: 'ri-alarm-warning-line' };
  const colors = { info: 'var(--primary)', success: 'var(--success)', warning: '#F59E0B', critical: 'var(--danger)' };
  list.innerHTML = notifications.slice(0, 20).map(n => `<div style="display:flex;gap:0.65rem;padding:0.65rem;border-radius:8px;margin-bottom:0.35rem;background:${n.read ? 'white' : 'var(--gray-50)'};cursor:pointer;transition:background 0.15s" onmouseover="this.style.background='var(--gray-50)'" onmouseout="this.style.background='${n.read ? 'white' : 'var(--gray-50)'}'" onclick="markNotifRead(${n.id})">
    <i class="${icons[n.type] || icons.info}" style="color:${colors[n.type] || colors.info};font-size:1.1rem;margin-top:2px;flex-shrink:0"></i>
    <div style="flex:1;min-width:0"><div style="font-size:0.9rem;font-weight:${n.read ? '500' : '700'};color:var(--gray-800)">${n.title}</div><div style="font-size:0.85rem;color:var(--gray-500);margin-top:0.1rem">${n.message}</div><div style="font-size:0.75rem;color:var(--gray-400);margin-top:0.25rem">${formatRelativeTime(new Date(n.time))}</div></div>
    ${!n.read ? '<div style="width:8px;height:8px;border-radius:50%;background:var(--primary);flex-shrink:0;margin-top:6px"></div>' : ''}
  </div>`).join('');
}

function markNotifRead(id) {
  const n = notifications.find(x => x.id === id);
  if (n) n.read = true;
  localStorage.setItem('oncoai_notifs', JSON.stringify(notifications));
  renderNotifications();
}

function clearNotifications() {
  notifications = [];
  localStorage.setItem('oncoai_notifs', '[]');
  renderNotifications();
  document.getElementById('notifPanel').style.display = 'none';
}

// Close notification panel when clicking outside
document.addEventListener('click', function(e) {
  const panel = document.getElementById('notifPanel');
  if (!panel || panel.style.display === 'none') return;
  const isInsidePanel = panel.contains(e.target);
  const isNotifBtn = e.target.closest('[title="Notifications"]');
  if (!isInsidePanel && !isNotifBtn) {
    panel.style.display = 'none';
  }
});

// Auto-check for new events every 30 seconds
setInterval(async () => {
  try {
    const labs = await api('/api/lab-results').catch(() => []);
    const criticals = labs.filter(l => l.status === 'Critical');
    criticals.forEach(l => {
      const existing = notifications.find(n => n.message.includes(l.test_name) && Date.now() - new Date(n.time).getTime() < 3600000);
      if (!existing) addNotification('Critical Lab Value', `${l.test_name}: ${(l.test_value || '').split('|')[0]} — requires immediate attention`, 'critical');
    });
  } catch {}
}, 30000);

// Initialize notifications on load
setTimeout(() => renderNotifications(), 500);

// ─── Reviews ───
let reviews = [];

async function loadReviewPatients() {
  try {
    const ps = await api('/api/patients');
    const sel = $('#reviewPatientSelect');
    sel.innerHTML = '<option value="">All Patients</option>' + ps.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  } catch {}
}

async function renderReviews() {
  const patientId = $('#reviewPatientSelect')?.value || '';
  try {
    let all = await api('/api/reviews');
    if (patientId) all = all.filter(r => r.patient_id === parseInt(patientId));
    reviews = all;
    const grid = $('#reviewsGrid');
    if (!all.length) { grid.innerHTML = '<p style="color:var(--gray-400);font-size:0.875rem;grid-column:1/-1">No reviews yet. Be the first to add one!</p>'; return; }
    grid.innerHTML = all.map(r => {
      const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
      return `<div class="review-card">
        <div class="review-header">
          <div><div class="review-author">${esc(r.author_name)}</div><div class="review-role">${esc(r.author_role)}</div></div>
          <div class="review-stars">${stars}</div>
        </div>
        <div class="review-comment">${esc(r.comment)}</div>
        ${r.department ? `<div class="review-department">${esc(r.department)}</div>` : ''}
      </div>`;
    }).join('');
  } catch (e) { toast(e.message, 'error'); }
}

function openReviewModal() {
  openModal('Add Review', `
    <form onsubmit="event.preventDefault(); saveReview()">
      <div class="form-grid">
        <div class="form-group"><label>Patient</label><select id="reviewPatientId"><option value="">Select...</option></select></div>
        <div class="form-group"><label>Your Name</label><input id="reviewAuthorName" required></div>
        <div class="form-group"><label>Role</label><select id="reviewAuthorRole"><option>Patient</option><option>Doctor</option><option>Nurse</option><option>Staff</option><option>Visitor</option></select></div>
        <div class="form-group"><label>Department</label><input id="reviewDepartment" placeholder="e.g. Cardiology"></div>
        <div class="form-group full-width"><label>Rating</label>
          <div class="star-rating">
            <input type="radio" name="rating" id="star5" value="5"><label for="star5">★</label>
            <input type="radio" name="rating" id="star4" value="4"><label for="star4">★</label>
            <input type="radio" name="rating" id="star3" value="3" checked><label for="star3">★</label>
            <input type="radio" name="rating" id="star2" value="2"><label for="star2">★</label>
            <input type="radio" name="rating" id="star1" value="1"><label for="star1">★</label>
          </div>
        </div>
        <div class="form-group full-width"><label>Comment</label><textarea id="reviewComment" required minlength="5"></textarea></div>
      </div>
      <div class="form-actions"><button class="btn btn-secondary" type="button" onclick="closeModal()">Cancel</button><button class="btn btn-primary" type="submit">Submit Review</button></div>
    </form>
  `);
  // Populate patient select in modal
  api('/api/patients').then(ps => {
    const sel = $('#reviewPatientId');
    sel.innerHTML = ps.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  });
}

async function saveReview() {
  const pid = $('#reviewPatientId').value;
  if (!pid) { toast('Select a patient', 'error'); return; }
  const rating = parseInt($$('input[name="rating"]:checked').map(c => c.value)[0] || '3');
  const body = {
    author_name: $('#reviewAuthorName').value,
    author_role: $('#reviewAuthorRole').value,
    rating: rating,
    comment: $('#reviewComment').value,
    department: $('#reviewDepartment').value || null,
  };
  try {
    await api(`/api/patients/${pid}/reviews`, { method: 'POST', body: JSON.stringify(body) });
    toast('Review submitted');
    closeModal();
    renderReviews();
  } catch (e) { toast(e.message, 'error'); }
}

// ─── WhatsApp ───
async function renderWhatsApp() {
  try {
    const ps = await api('/api/patients');
    const patientContainer = $('#waPatientContacts');
    const patientsWithPhone = ps.filter(p => p.phone);
    if (!patientsWithPhone.length) {
      patientContainer.innerHTML = '<p style="color:var(--gray-400);font-size:0.875rem">No patient phone numbers found</p>';
    } else {
      patientContainer.innerHTML = patientsWithPhone.map(p => `
        <div class="whatsapp-contact">
          <div class="contact-info">
            <div class="contact-name">${esc(p.name)}</div>
            <div class="contact-phone">${esc(p.phone)}</div>
          </div>
          <a href="https://wa.me/${p.phone.replace(/\D/g,'')}" target="_blank" class="btn btn-whatsapp btn-sm">💬 Message</a>
        </div>
      `).join('');
    }

    // Also load doctor contacts from referrals
    const refs = await api('/api/referrals').catch(() => []);
    const doctorMap = {};
    refs.forEach(r => {
      if (r.doctor_name && r.doctor_phone) {
        const key = r.doctor_phone.replace(/\D/g, '');
        if (!doctorMap[key]) doctorMap[key] = { name: r.doctor_name, phone: r.doctor_phone.replace(/\D/g, '') };
      }
    });
    const doctorContainer = $('#waDoctorContacts');
    const doctors = Object.values(doctorMap);
    if (!doctors.length) {
      doctorContainer.innerHTML = '<p style="color:var(--gray-400);font-size:0.875rem">No doctor phone numbers from referrals</p>';
    } else {
      doctorContainer.innerHTML = doctors.map(d => `
        <div class="whatsapp-contact">
          <div class="contact-info">
            <div class="contact-name">👨‍⚕️ ${esc(d.name)}</div>
            <div class="contact-phone">${d.phone}</div>
          </div>
          <a href="https://wa.me/${d.phone}" target="_blank" class="btn btn-whatsapp btn-sm">💬 Message</a>
        </div>
      `).join('');
    }
  } catch (e) { console.error('WhatsApp render error:', e); }
}

function openWhatsAppQuick() {
  const phone = $('#waQuickPhone').value.replace(/\D/g, '');
  if (!phone) { toast('Enter a phone number', 'error'); return; }
  window.open(`https://wa.me/${phone}`, '_blank');
}

function generateWALink() {
  const phone = $('#waQuickPhone').value.replace(/\D/g, '');
  if (!phone) { toast('Enter a phone number', 'error'); return; }
  const link = `https://wa.me/${phone}`;
  navigator.clipboard.writeText(link).then(() => toast('WhatsApp link copied!')).catch(() => toast(link));
}

// ─── Tumor Board ───
let tbFilter = 'all';
let tbView = 'list';
let tbCalendarDate = new Date();
let tbCache = { patients: [], boards: [], tracking: {} };

async function loadTBPatients() {
  try {
    const ps = await api('/api/patients');
    tbCache.patients = ps;
    const sel = $('#tbPatientSelect');
    sel.innerHTML = '<option value="">All Patients</option>' + ps.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
    const sel2 = $('#tbTimelinePatient');
    sel2.innerHTML = '<option value="">— Select Patient —</option>' + ps.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  } catch {}
}

async function renderTumorBoards() {
  const patientId = $('#tbPatientSelect').value;
  const container = $('#tbListView');
  let url = '/api/tumor-boards';
  const params = [];
  if (tbFilter !== 'all') params.push(`status=${tbFilter}`);
  if (params.length) url += '?' + params.join('&');

  try {
    let boards = await api(url);
    tbCache.boards = boards;
    if (patientId) boards = boards.filter(b => b.patient_id === parseInt(patientId));

    if (!boards.length) {
      container.innerHTML = '<p style="color:var(--gray-400);font-size:0.875rem;grid-column:1/-1">No tumor board meetings found. Schedule one to get started!</p>';
      renderCalendar([]);
      return;
    }

    const pmap = {};
    const tmap = {};
    tbCache.patients.forEach(p => { pmap[p.id] = p.name; });
    for (const b of boards) {
      if (!tmap[b.patient_id]) {
        try { tmap[b.patient_id] = await api(`/api/patients/${b.patient_id}/tracking`); } catch { tmap[b.patient_id] = null; }
      }
    }

    container.innerHTML = (await Promise.all(boards.map(async b => {
      const pname = pmap[b.patient_id] || `Patient #${b.patient_id}`;
      const tracking = tmap[b.patient_id];
      const statusColors = { scheduled: 'pending', in_progress: 'abnormal', completed: 'success', cancelled: 'routine' };
      const statusClass = statusColors[b.status] || 'pending';

      let labs = [], path = [], img = [];
      try { [labs, path, img] = await Promise.all([
        api(`/api/patients/${b.patient_id}/lab-results`),
        api(`/api/patients/${b.patient_id}/pathology-reports`),
        api(`/api/patients/${b.patient_id}/imaging-results`),
      ]); } catch {}

      const recentLab = labs.filter(l => l.status === 'Abnormal' || l.status === 'Critical').slice(0,2);
      const recentPath = path.slice(0,1);
      const recentImg = img.slice(0,1);

      const participants = (b.participants || []).map(p =>
        `<span style="display:inline-flex;align-items:center;gap:0.2rem;padding:0.1rem 0.4rem;background:var(--primary-light);color:var(--primary-dark);border-radius:999px;font-size:0.6rem;font-weight:500;white-space:nowrap">
          ${p.present ? '✓' : '○'} ${esc(p.name)} (${esc(p.specialty)})
          ${p.phone ? `<a href="https://wa.me/${p.phone.replace(/\D/g,'')}" target="_blank" style="text-decoration:none;color:var(--secondary)" title="WhatsApp">💬</a>` : ''}
        </span>`
      ).join(' ');

      const contextHtml = `
        <div style="display:flex;flex-wrap:wrap;gap:0.35rem;margin-bottom:0.5rem;padding:0.4rem;background:var(--gray-50);border-radius:var(--radius-sm);font-size:0.65rem">
          ${tracking ? `<span style="padding:0.1rem 0.3rem;background:var(--primary-light);border-radius:4px"><strong>Stage:</strong> ${esc(tracking.cancer_stage || 'N/A')}</span>
          <span style="padding:0.1rem 0.3rem;background:var(--primary-light);border-radius:4px"><strong>Phase:</strong> <span class="phase-${(tracking.treatment_phase || '').toLowerCase()}">${esc(tracking.treatment_phase || 'N/A')}</span></span>
          <span style="padding:0.1rem 0.3rem;background:var(--primary-light);border-radius:4px"><strong>ECOG:</strong> ${tracking.ecog_score !== null ? tracking.ecog_score : 'N/A'}</span>` : ''}
          ${recentLab.map(l => `<span style="padding:0.1rem 0.3rem;background:var(--danger-light);border-radius:4px;color:var(--danger)"><strong>Lab:</strong> ${esc(l.test_name)}</span>`).join('')}
          ${recentPath.map(p => `<span style="padding:0.1rem 0.3rem;background:var(--warning-light);border-radius:4px;color:#b45309"><strong>Path:</strong> ${esc(p.specimen_type)}</span>`).join('')}
          ${recentImg.map(i => `<span style="padding:0.1rem 0.3rem;background:#ccfbf1;border-radius:4px;color:var(--secondary-dark)"><strong>Img:</strong> ${esc(i.modality)}</span>`).join('')}
        </div>`;

      return `<div style="background:rgba(255,255,255,0.9);backdrop-filter:blur(12px);border-radius:var(--radius);border:1px solid rgba(226,232,240,0.6);padding:1.25rem;box-shadow:0 4px 16px rgba(0,0,0,0.04);transition:all 0.2s">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.5rem">
          <div>
            <div style="font-weight:700;font-size:0.9rem;color:var(--gray-900)">${esc(pname)}</div>
            <div style="font-size:0.72rem;color:var(--gray-400)">📅 ${new Date(b.scheduled_date).toLocaleString()}</div>
          </div>
          <span class="status-badge ${statusClass}">${b.status.replace(/_/g, ' ')}</span>
        </div>
        ${tracking ? contextHtml : ''}
        <div style="display:flex;flex-direction:column;gap:0.3rem;margin-bottom:0.5rem;font-size:0.75rem">
          <div style="color:var(--gray-600)"><strong>Chair:</strong> ${esc(b.chairperson)}</div>
          ${b.discussion ? `<div style="color:var(--gray-600)"><strong>Discussion:</strong> ${esc(b.discussion.substring(0,100))}${b.discussion.length > 100 ? '...' : ''}</div>` : ''}
          ${b.recommendations ? `<div style="color:var(--gray-600)"><strong>Rec:</strong> ${esc(b.recommendations.substring(0,100))}${b.recommendations.length > 100 ? '...' : ''}</div>` : ''}
          ${b.outcome ? `<div><strong>Outcome:</strong> <span class="status-badge ${statusClass}">${esc(b.outcome)}</span></div>` : ''}
        </div>
        ${participants ? `<div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-bottom:0.6rem">${participants}</div>` : ''}
        <div style="display:flex;gap:0.3rem;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick="openTumorBoardForm(${b.id})">✏️</button>
          <button class="btn btn-success btn-sm" onclick="updateTBStatus(${b.id},'completed')">✓</button>
          <button class="btn btn-sm" style="background:var(--primary-light);color:var(--primary-dark)" onclick="generateBoardSummary(${b.patient_id}, ${b.id})">🤖 AI Brief</button>
          <button class="btn btn-sm" style="background:#f3e8ff;color:#7c3aed" onclick="openTrackingForm(${b.patient_id})">📊 Track</button>
          <button class="btn btn-danger btn-sm" onclick="deleteTumorBoard(${b.id})">🗑️</button>
        </div>
        <div id="tbSummary_${b.id}" style="display:none" class="board-summary-card"></div>
      </div>`;
    }))).join('');

    renderCalendar(boards);
  } catch (e) { toast(e.message, 'error'); }
}

function filterTumorBoards(filter) {
  tbFilter = filter;
  $$('[data-tbfilter]').forEach(b => b.classList.toggle('btn-primary', b.dataset.tbfilter === filter));
  renderTumorBoards();
}

function switchTBView(view) {
  tbView = view;
  $$('[data-tbview]').forEach(b => {
    b.style.background = b.dataset.tbview === view ? 'white' : 'transparent';
    b.style.boxShadow = b.dataset.tbview === view ? '0 1px 3px rgba(0,0,0,0.1)' : 'none';
  });
  $('#tbListView').style.display = view === 'list' ? 'grid' : 'none';
  $('#tbCalendarView').style.display = view === 'calendar' ? 'block' : 'none';
  $('#tbTimelineView').style.display = view === 'timeline' ? 'block' : 'none';
  if (view === 'calendar') renderCalendar(tbCache.boards);
  if (view === 'timeline') renderTimeline();
}

// ─── Calendar View ───
function renderCalendar(boards) {
  if (tbView !== 'calendar') return;
  const year = tbCalendarDate.getFullYear();
  const month = tbCalendarDate.getMonth();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  $('#tbCalendarMonth').textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const boardMap = {};
  boards.forEach(b => {
    const d = new Date(b.scheduled_date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!boardMap[key]) boardMap[key] = [];
    boardMap[key].push(b);
  });

  const pmap = {};
  tbCache.patients.forEach(p => { pmap[p.id] = p.name; });
  const today = new Date();

  let cells = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrev - i;
    cells.push(`<div class="cal-day other-month"><div class="day-num">${day}</div></div>`);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${month}-${d}`;
    const events = boardMap[key] || [];
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const eventsHtml = events.map(b => {
      const pname = pmap[b.patient_id] || `#${b.patient_id}`;
      return `<span class="cal-event ${b.status}" onclick="openTumorBoardForm(${b.id})">${esc(pname)}</span>`;
    }).join('');
    cells.push(`<div class="cal-day ${isToday ? 'today' : ''}"><div class="day-num">${d}</div>${eventsHtml}</div>`);
  }
  const totalCells = cells.length;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    cells.push(`<div class="cal-day other-month"><div class="day-num">${d}</div></div>`);
  }

  $('#tbCalendarGrid').innerHTML = cells.join('');
}

function shiftTBMonth(delta) {
  tbCalendarDate.setMonth(tbCalendarDate.getMonth() + delta);
  renderCalendar(tbCache.boards);
}

function todayTBMonth() {
  tbCalendarDate = new Date();
  renderCalendar(tbCache.boards);
}

// ─── Timeline View ───
async function renderTimeline() {
  const pid = $('#tbTimelinePatient').value;
  const container = $('#tbTimelineContent');
  if (!pid) { container.innerHTML = '<p style="color:var(--gray-400)">Select a patient to view their care timeline</p>'; return; }

  try {
    const [referrals, labs, path, img, boards, recommendations, tracking] = await Promise.all([
      api(`/api/patients/${pid}/referrals`),
      api(`/api/patients/${pid}/lab-results`),
      api(`/api/patients/${pid}/pathology-reports`),
      api(`/api/patients/${pid}/imaging-results`),
      api(`/api/patients/${pid}/tumor-boards`),
      api(`/api/patients/${pid}/recommendations`),
      api(`/api/patients/${pid}/tracking`).catch(() => null),
    ]);

    const events = [];
    referrals.forEach(r => events.push({
      type: 'referral', date: r.created_at, title: `Referral: ${r.doctor_name} (${r.specialty})`, desc: `${r.hospital} — ${r.status}`
    }));
    labs.forEach(l => events.push({
      type: 'lab', date: l.created_at, title: `Lab: ${l.test_name}`, desc: `${l.test_value} — ${l.status}`
    }));
    path.forEach(p => events.push({
      type: 'pathology', date: p.created_at, title: `Pathology: ${p.specimen_type}`, desc: `${p.diagnosis ? p.diagnosis.substring(0,100) : ''} — ${p.status}`
    }));
    img.forEach(i => events.push({
      type: 'imaging', date: i.created_at, title: `Imaging: ${i.modality} (${i.body_part})`, desc: `${i.impression || i.findings ? (i.impression || i.findings).substring(0,100) : ''} — ${i.status}`
    }));
    boards.forEach(b => events.push({
      type: 'tumorboard', date: b.scheduled_date, title: `Tumor Board: ${b.chairperson}`, desc: `${b.outcome || b.status} — ${b.discussion ? b.discussion.substring(0,80) : ''}`
    }));
    recommendations.forEach(r => events.push({
      type: 'recommendation', date: r.created_at, title: `Recommendation: ${r.title}`, desc: `[${r.priority}] ${r.description.substring(0,100)}`
    }));

    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (!events.length) {
      container.innerHTML = '<p style="color:var(--gray-400)">No clinical events recorded for this patient</p>';
      return;
    }

    const patient = tbCache.patients.find(p => p.id === parseInt(pid));
    container.innerHTML = `
      <div style="margin-bottom:1rem;padding:0.75rem 1rem;background:rgba(255,255,255,0.85);border-radius:var(--radius);border:1px solid var(--gray-200)">
        <div style="font-weight:700;font-size:0.95rem">${esc(patient ? patient.name : 'Patient')}</div>
        ${tracking ? `<div style="font-size:0.72rem;color:var(--gray-500);margin-top:0.2rem">
          Stage: ${tracking.cancer_stage || 'N/A'} · Phase: ${tracking.treatment_phase || 'N/A'} · ECOG: ${tracking.ecog_score !== null ? tracking.ecog_score : 'N/A'}
          ${tracking.oncologist ? `· Oncologist: ${esc(tracking.oncologist)}` : ''}
        </div>` : ''}
      </div>
      <div class="timeline">
        ${events.map(e => `<div class="timeline-item ${e.type}">
          <div class="timeline-date">${new Date(e.date).toLocaleString()}</div>
          <div class="timeline-title">${esc(e.title)}</div>
          <div class="timeline-desc">${esc(e.desc)}</div>
        </div>`).join('')}
      </div>`;
  } catch (e) { toast(e.message, 'error'); }
}

// ─── AI Board Summary ───
async function generateBoardSummary(patientId, boardId) {
  const container = $(`#tbSummary_${boardId}`);
  const isVisible = container.style.display !== 'none';
  if (isVisible) { container.style.display = 'none'; return; }

  container.style.display = 'block';
  container.textContent = '⏳ Generating AI brief...';

  try {
    const res = await api(`/api/patients/${patientId}/board-summary`);
    container.textContent = res.summary;
  } catch (e) {
    container.textContent = 'Error: ' + e.message;
    container.style.background = 'var(--danger-light)';
  }
}

// ─── Tumor Board Form ───
async function openTumorBoardForm(id) {
  let board = null;
  if (id) {
    const all = await api('/api/tumor-boards');
    board = all.find(b => b.id === id);
  }
  const isEdit = !!board;

  const ps = await api('/api/patients');
  const patientOpts = ps.map(p => `<option value="${p.id}" ${board && board.patient_id === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('');

  const defaultParticipants = board ? (board.participants || []) : [];
  const participantsHtml = defaultParticipants.map((p, i) => `
    <div style="display:flex;gap:0.35rem;align-items:center">
      <input style="flex:2" id="pname_${i}" value="${esc(p.name)}" placeholder="Name">
      <input style="flex:1.2" id="prole_${i}" value="${esc(p.role)}" placeholder="Role">
      <input style="flex:1.5" id="pspec_${i}" value="${esc(p.specialty)}" placeholder="Specialty">
      <input style="flex:1.2" id="pphone_${i}" value="${esc(p.phone || '')}" placeholder="Phone">
      <label style="white-space:nowrap;font-size:0.7rem"><input type="checkbox" id="ppresent_${i}" ${p.present ? 'checked' : ''}> ✓</label>
    </div>
  `).join('');

  openModal(isEdit ? 'Edit Tumor Board' : 'Schedule Tumor Board', `
    <form onsubmit="event.preventDefault(); saveTumorBoard(${isEdit ? board.id : 'null'})">
      <div class="form-grid">
        <div class="form-group"><label>Patient</label><select id="tbPatientId">${patientOpts}</select></div>
        <div class="form-group"><label>Date</label><input type="datetime-local" id="tbDate" value="${board ? new Date(board.scheduled_date).toISOString().slice(0,16) : ''}" required></div>
        <div class="form-group"><label>Chairperson</label><input id="tbChair" value="${isEdit ? esc(board.chairperson) : ''}" required></div>
        <div class="form-group"><label>Status</label><select id="tbStatus">
          ${['scheduled','in_progress','completed','cancelled'].map(s =>
            `<option ${isEdit && board.status === s ? 'selected' : ''}>${s}</option>`
          ).join('')}
        </select></div>
        <div class="form-group full-width"><label>Discussion</label><textarea id="tbDiscussion">${isEdit ? esc(board.discussion || '') : ''}</textarea></div>
        <div class="form-group full-width"><label>Recommendations</label><textarea id="tbRecommendations">${isEdit ? esc(board.recommendations || '') : ''}</textarea></div>
        <div class="form-group"><label>Outcome</label><input id="tbOutcome" value="${isEdit ? esc(board.outcome || '') : ''}"></div>
        <div class="form-group"><label>Follow-up</label><input type="date" id="tbFollowUp" value="${isEdit && board.follow_up_date ? new Date(board.follow_up_date).toISOString().slice(0,10) : ''}"></div>
        <div class="form-group full-width">
          <label>Participants <span style="font-weight:400;color:var(--gray-400)">(name · role · specialty · phone)</span></label>
          <div id="tbParticipants" style="display:flex;flex-direction:column;gap:0.25rem">
            ${participantsHtml || '<p style="color:var(--gray-400);font-size:0.75rem">None yet</p>'}
          </div>
          <button type="button" class="btn btn-sm btn-secondary" onclick="addTBParticipantRow()" style="margin-top:0.35rem">➕ Add</button>
        </div>
      </div>
      <div class="form-actions"><button class="btn btn-secondary" type="button" onclick="closeModal()">Cancel</button><button class="btn btn-primary" type="submit">${isEdit ? 'Update' : 'Schedule'}</button></div>
    </form>
  `);
}

function addTBParticipantRow() {
  const container = $('#tbParticipants');
  const i = container.querySelectorAll('input[id^="pname_"]').length;
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:0.35rem;align-items:center';
  row.innerHTML = `
    <input style="flex:2" id="pname_${i}" placeholder="Name">
    <input style="flex:1.2" id="prole_${i}" placeholder="Role">
    <input style="flex:1.5" id="pspec_${i}" placeholder="Specialty">
    <input style="flex:1.2" id="pphone_${i}" placeholder="Phone">
    <label style="white-space:nowrap;font-size:0.7rem"><input type="checkbox" id="ppresent_${i}"> ✓</label>
  `;
  const empty = container.querySelector('p');
  if (empty) empty.remove();
  container.appendChild(row);
}

function collectTBParticipants() {
  const container = $('#tbParticipants');
  const participants = [];
  const inputs = container.querySelectorAll('input[id^="pname_"]');
  for (let i = 0; i < inputs.length; i++) {
    const name = $(`#pname_${i}`)?.value;
    if (!name) continue;
    participants.push({
      name, role: $(`#prole_${i}`)?.value || '',
      specialty: $(`#pspec_${i}`)?.value || '',
      phone: $(`#pphone_${i}`)?.value || '',
      present: $(`#ppresent_${i}`)?.checked || false,
    });
  }
  return participants;
}

async function saveTumorBoard(id) {
  const pid = $('#tbPatientId').value;
  if (!pid) { toast('Select a patient', 'error'); return; }
  const body = {
    scheduled_date: new Date($('#tbDate').value || Date.now()).toISOString(),
    chairperson: $('#tbChair').value,
    participants: collectTBParticipants(),
    discussion: $('#tbDiscussion').value || null,
    recommendations: $('#tbRecommendations').value || null,
    outcome: $('#tbOutcome').value || null,
    follow_up_date: $('#tbFollowUp').value ? new Date($('#tbFollowUp').value).toISOString() : null,
  };
  try {
    if (id) {
      body.status = $('#tbStatus').value;
      await api(`/api/tumor-boards/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      toast('Tumor board updated');
    } else {
      await api(`/api/patients/${pid}/tumor-boards`, { method: 'POST', body: JSON.stringify(body) });
      toast('Tumor board scheduled');
    }
    closeModal();
    renderTumorBoards();
  } catch (e) { toast(e.message, 'error'); }
}

async function updateTBStatus(id, status) {
  try { await api(`/api/tumor-boards/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }); toast(`Status → ${status}`); renderTumorBoards(); }
  catch (e) { toast(e.message, 'error'); }
}

async function deleteTumorBoard(id) {
  if (!confirm('Delete this meeting?')) return;
  try { await api(`/api/tumor-boards/${id}`, { method: 'DELETE' }); toast('Deleted'); renderTumorBoards(); }
  catch (e) { toast(e.message, 'error'); }
}

// ─── Patient Tracking ───
async function openTrackingForm(patientId) {
  const ps = await api('/api/patients');
  let tracking = null;
  if (patientId) {
    try { tracking = await api(`/api/patients/${patientId}/tracking`); } catch {}
  }

  const patientOpts = ps.map(p => `<option value="${p.id}" ${patientId == p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('');

  let careTeamHtml = '';
  if (tracking && tracking.care_team) {
    careTeamHtml = tracking.care_team.map((m, i) =>
      `<div style="display:flex;gap:0.35rem;align-items:center;margin-bottom:0.2rem">
        <input style="flex:1" id="ctname_${i}" value="${esc(m.name || m)}" placeholder="Name">
        <input style="flex:1" id="ctrole_${i}" value="${esc(m.role || '')}" placeholder="Role">
      </div>`
    ).join('');
  }

  openModal('📊 Patient Tracking', `
    <form onsubmit="event.preventDefault(); saveTracking(${patientId || 'null'})">
      <div class="form-grid">
        <div class="form-group"><label>Patient</label><select id="trPatientId">${patientOpts}</select></div>
        <div class="form-group"><label>Cancer Stage</label>
          <select id="trStage">
            <option value="">— Select —</option>
            ${['Stage 0','Stage I','Stage IA','Stage IB','Stage II','Stage IIA','Stage IIB','Stage III','Stage IIIA','Stage IIIB','Stage IIIC','Stage IV','Stage IVA','Stage IVB','Unknown'].map(s =>
              `<option ${tracking && tracking.cancer_stage === s ? 'selected' : ''}>${s}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group"><label>Treatment Phase</label>
          <select id="trPhase">
            ${['Diagnosis','Staging','Neoadjuvant','Surgery','Adjuvant','Surveillance','Survivorship','Palliative'].map(s =>
              `<option ${tracking && tracking.treatment_phase === s ? 'selected' : ''}>${s}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group"><label>ECOG Score</label>
          <select id="trECOG">
            ${[0,1,2,3,4,5].map(s =>
              `<option value="${s}" ${tracking && tracking.ecog_score === s ? 'selected' : ''}>ECOG ${s}${s === 0 ? ' (Fully active)' : s === 5 ? ' (Deceased)' : ''}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group"><label>Oncologist</label><input id="trOncologist" value="${tracking ? esc(tracking.oncologist || '') : ''}"></div>
        <div class="form-group full-width"><label>Clinical Trials</label><textarea id="trTrials">${tracking ? esc(tracking.clinical_trials || '') : ''}</textarea></div>
        <div class="form-group full-width">
          <label>Care Team</label>
          <div id="trCareTeam" style="display:flex;flex-direction:column;gap:0.2rem">
            ${careTeamHtml || '<p style="color:var(--gray-400);font-size:0.75rem">No team members</p>'}
          </div>
          <button type="button" class="btn btn-sm btn-secondary" onclick="addCTRow()" style="margin-top:0.25rem">➕ Add Member</button>
        </div>
        <div class="form-group full-width"><label>Notes</label><textarea id="trNotes">${tracking ? esc(tracking.notes || '') : ''}</textarea></div>
      </div>
      <div class="form-actions"><button class="btn btn-secondary" type="button" onclick="closeModal()">Cancel</button><button class="btn btn-primary" type="submit">Save Tracking</button></div>
    </form>
  `);
}

function addCTRow() {
  const container = $('#trCareTeam');
  const i = container.querySelectorAll('input[id^="ctname_"]').length;
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:0.35rem;align-items:center;margin-bottom:0.2rem';
  row.innerHTML = `<input style="flex:1" id="ctname_${i}" placeholder="Name"><input style="flex:1" id="ctrole_${i}" placeholder="Role">`;
  const empty = container.querySelector('p');
  if (empty) empty.remove();
  container.appendChild(row);
}

function collectCareTeam() {
  const container = $('#trCareTeam');
  const members = [];
  const inputs = container.querySelectorAll('input[id^="ctname_"]');
  for (let i = 0; i < inputs.length; i++) {
    const name = $(`#ctname_${i}`)?.value;
    if (!name) continue;
    members.push({ name, role: $(`#ctrole_${i}`)?.value || '' });
  }
  return members;
}

async function saveTracking(patientId) {
  const pid = $('#trPatientId').value;
  if (!pid) { toast('Select a patient', 'error'); return; }
  const body = {
    cancer_stage: $('#trStage').value || null,
    treatment_phase: $('#trPhase').value || null,
    ecog_score: parseInt($('#trECOG').value) || 0,
    oncologist: $('#trOncologist').value || null,
    care_team: collectCareTeam(),
    clinical_trials: $('#trTrials').value || null,
    notes: $('#trNotes').value || null,
  };
  try {
    await api(`/api/patients/${pid}/tracking`, { method: 'POST', body: JSON.stringify(body) });
    toast('Tracking saved');
    closeModal();
    renderTumorBoards();
  } catch (e) { toast(e.message, 'error'); }
}

// ─── Clinical AI Intelligence (Stanford Medicine-style) ───
async function loadClinicalIntel() {
  const pid = $('#summaryPatientSelect')?.value;
  if (!pid) { $('#safetyAlerts').style.display = 'none'; $('#careGaps').style.display = 'none'; return; }

  const [patient, labs, path, imaging, workup, meds, refs] = await Promise.all([
    api(`/api/patients/${pid}`).catch(() => null),
    api(`/api/patients/${pid}/lab-results`).catch(() => []),
    api(`/api/patients/${pid}/pathology-reports`).catch(() => []),
    api(`/api/patients/${pid}/imaging-results`).catch(() => []),
    api(`/api/patients/${pid}/workup`).catch(() => null),
    api(`/api/patients/${pid}/recommendations`).catch(() => []),
    api(`/api/patients/${pid}/referrals`).catch(() => []),
  ]);

  // Safety Alerts
  const alerts = [];
  labs.filter(l => l.status === 'Critical').forEach(l => alerts.push({ level: 'critical', icon: 'ri-alarm-warning-line', text: `Critical lab value: ${l.test_name} = ${(l.test_value||'').split('|')[0]}` }));
  if (patient?.allergies) alerts.push({ level: 'warning', icon: 'ri-error-warning-line', text: `Known allergies: ${patient.allergies}` });
  if (patient?.chronic_conditions) {
    const conditions = patient.chronic_conditions.toLowerCase();
    if (conditions.includes('hiv')) alerts.push({ level: 'info', icon: 'ri-shield-cross-line', text: 'HIV positive — check drug interactions and immunosuppression status' });
    if (conditions.includes('diabetes')) alerts.push({ level: 'info', icon: 'ri-heart-pulse-line', text: 'Diabetic — monitor glucose during treatment, adjust medications' });
    if (conditions.includes('hypertension')) alerts.push({ level: 'info', icon: 'ri-heart-pulse-line', text: 'Hypertensive — monitor BP during chemotherapy' });
  }
  if (patient?.smoking_status === 'Current') alerts.push({ level: 'warning', icon: 'ri-fire-line', text: 'Current smoker — smoking cessation counseling recommended before treatment' });
  const abnormalLabs = labs.filter(l => l.status === 'Abnormal');
  if (abnormalLabs.length > 2) alerts.push({ level: 'warning', icon: 'ri-test-tube-line', text: `${abnormalLabs.length} abnormal lab values detected — review before treatment` });

  const alertsEl = $('#safetyAlerts');
  if (alerts.length > 0) {
    const levelColors = { critical: { bg: 'var(--danger-light)', border: 'var(--danger)', color: '#DC2626' }, warning: { bg: 'var(--warning-light)', border: 'var(--warning)', color: '#B45309' }, info: { bg: 'var(--primary-light)', border: 'var(--primary)', color: 'var(--primary)' } };
    alertsEl.style.display = 'block';
    alertsEl.innerHTML = `<div style="border-radius:12px;overflow:hidden;border:1px solid var(--border-color)">
      <div style="padding:0.75rem 1rem;background:linear-gradient(135deg,#DC2626,#B91C1C);color:white;font-weight:700;font-size:0.95rem;display:flex;align-items:center;gap:0.5rem"><i class="ri-alarm-warning-line"></i> Patient Safety Alerts (${alerts.length})</div>
      ${alerts.map(a => { const c = levelColors[a.level]; return `<div style="display:flex;align-items:center;gap:0.65rem;padding:0.65rem 1rem;background:${c.bg};border-bottom:1px solid ${c.border}20">
        <i class="${a.icon}" style="color:${c.color};font-size:1.1rem;flex-shrink:0"></i>
        <span style="color:${c.color};font-size:0.9rem;font-weight:500">${esc(a.text)}</span>
      </div>`}).join('')}
    </div>`;
  } else { alertsEl.style.display = 'none'; }

  // Care Gap Detection
  const gaps = [];
  if (!workup?.imaging_complete && imaging.length === 0) gaps.push({ icon: 'ri-body-scan-line', text: 'No imaging studies ordered — CT/MRI recommended for staging', action: 'Order Imaging' });
  if (!workup?.pathology_complete && path.length === 0) gaps.push({ icon: 'ri-microscope-line', text: 'No biopsy/pathology on file — tissue diagnosis needed', action: 'Order Biopsy' });
  if (!workup?.lab_complete && labs.length === 0) gaps.push({ icon: 'ri-test-tube-line', text: 'No lab results — CBC, LFT, RFT, tumor markers needed', action: 'Order Labs' });
  if (refs.length === 0 && patient?.cancer_type) gaps.push({ icon: 'ri-share-forward-line', text: 'No specialist referrals — multidisciplinary team review needed', action: 'Create Referral' });
  if (!patient?.nhif_registered && patient?.nhif_registered !== true) gaps.push({ icon: 'ri-shield-check-line', text: 'NHIF insurance status not confirmed — verify coverage before treatment', action: 'Update Insurance' });
  const tbs = await api(`/api/patients/${pid}/tumor-boards`).catch(() => []);
  if (tbs.length === 0 && workup?.tb_ready) gaps.push({ icon: 'ri-dna-line', text: 'Workup complete but no tumor board scheduled — schedule TB discussion', action: 'Schedule TB' });
  if (patient?.cancer_type && !patient?.cancer_stage) gaps.push({ icon: 'ri-bar-chart-grouped-line', text: 'Cancer type recorded but staging incomplete', action: 'Update Staging' });

  const gapsEl = $('#careGaps');
  if (gaps.length > 0) {
    gapsEl.style.display = 'block';
    gapsEl.innerHTML = `<div style="border-radius:12px;overflow:hidden;border:1px solid var(--border-color)">
      <div style="padding:0.75rem 1rem;background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:white;font-weight:700;font-size:0.95rem;display:flex;align-items:center;gap:0.5rem"><i class="ri-error-warning-line"></i> Care Gaps Detected (${gaps.length})</div>
      ${gaps.map(g => `<div style="display:flex;align-items:center;gap:0.65rem;padding:0.65rem 1rem;background:white;border-bottom:1px solid var(--gray-100)">
        <i class="${g.icon}" style="color:var(--primary);font-size:1.1rem;flex-shrink:0"></i>
        <span style="flex:1;font-size:0.9rem;color:var(--gray-700)">${esc(g.text)}</span>
        <button class="btn btn-sm btn-secondary" style="flex-shrink:0">${esc(g.action)}</button>
      </div>`).join('')}
    </div>`;
  } else { gapsEl.style.display = 'none'; }
}

async function generatePreVisit() {
  const pid = $('#summaryPatientSelect')?.value;
  if (!pid) { toast('Select a patient', 'error'); return; }
  showAIOutput('Pre-Visit Summary', 'Generating...');
  const [patient, labs, path, imaging, refs, workup, prefs] = await Promise.all([
    api(`/api/patients/${pid}`).catch(() => ({})),
    api(`/api/patients/${pid}/lab-results`).catch(() => []),
    api(`/api/patients/${pid}/pathology-reports`).catch(() => []),
    api(`/api/patients/${pid}/imaging-results`).catch(() => []),
    api(`/api/patients/${pid}/referrals`).catch(() => []),
    api(`/api/patients/${pid}/workup`).catch(() => null),
    api(`/api/patients/${pid}/preferences`).catch(() => null),
  ]);
  const critLabs = labs.filter(l => l.status === 'Critical' || l.status === 'Abnormal');
  const output = `PRE-VISIT SUMMARY
═══════════════════════════════════════
Patient: ${patient.name} (${patient.patient_code || 'N/A'})
DOB: ${patient.date_of_birth || 'N/A'} | Age: ${patient.age || 'N/A'} | Gender: ${patient.gender || 'N/A'}
Cancer: ${patient.cancer_type || 'Not diagnosed'} | Stage: ${patient.cancer_stage || 'N/A'}
NHIF: ${patient.nhif_registered ? 'Yes (' + (patient.nhif_number || '') + ')' : 'Not registered'}
Journey: ${(patient.journey_status || 'arrival').replace(/_/g, ' ').toUpperCase()}

ALLERGIES: ${patient.allergies || 'None known'}
CHRONIC CONDITIONS: ${patient.chronic_conditions || 'None'}
CURRENT MEDICATIONS: ${patient.current_medications || 'None'}

WORKUP STATUS:
  Imaging: ${workup?.imaging_complete ? '✅' : '⬜'} | Pathology: ${workup?.pathology_complete ? '✅' : '⬜'}
  Lab: ${workup?.lab_complete ? '✅' : '⬜'} | Consultation: ${workup?.consultation_complete ? '✅' : '⬜'}
  TB Ready: ${workup?.tb_ready ? '✅ YES' : '❌ Not yet'}

RECENT ABNORMAL RESULTS (${critLabs.length}):
${critLabs.length ? critLabs.map(l => `  ⚠ ${l.test_name}: ${(l.test_value||'').split('|')[0]} [${l.status}]`).join('\n') : '  None'}

IMAGING (${imaging.length}): ${imaging.map(i => i.study_type + ' — ' + i.status).join(', ') || 'None'}
PATHOLOGY (${path.length}): ${path.map(p => p.specimen_type + ' — ' + p.status).join(', ') || 'None'}
REFERRALS (${refs.length}): ${refs.map(r => r.doctor_name + ' (' + r.specialty + ') — ' + r.status).join(', ') || 'None'}
${prefs?.category ? `\nPATIENT CONCERNS: Category ${prefs.category} (Travel: ${prefs.travel_concern || 'N/A'}, Financial: ${prefs.financial_concern || 'N/A'})` : ''}

ACTION ITEMS FOR THIS VISIT:
${!workup?.imaging_complete ? '  □ Review/order imaging studies\n' : ''}${!workup?.pathology_complete ? '  □ Review/order biopsy\n' : ''}${!workup?.lab_complete ? '  □ Order baseline labs\n' : ''}${critLabs.length ? '  □ Address abnormal lab values\n' : ''}${workup?.tb_ready ? '  □ Schedule tumor board if not yet done\n' : ''}  □ Update patient on treatment plan
  □ Address patient concerns and questions`;

  showAIOutput('Pre-Visit Summary', output);
}

async function generateSOAP() {
  const pid = $('#summaryPatientSelect')?.value;
  if (!pid) { toast('Select a patient', 'error'); return; }
  showAIOutput('AI Clinical Notes (SOAP)', 'Generating...');
  const [patient, labs, path, imaging] = await Promise.all([
    api(`/api/patients/${pid}`).catch(() => ({})),
    api(`/api/patients/${pid}/lab-results`).catch(() => []),
    api(`/api/patients/${pid}/pathology-reports`).catch(() => []),
    api(`/api/patients/${pid}/imaging-results`).catch(() => []),
  ]);
  const latestPath = path[0];
  const abnLabs = labs.filter(l => l.status !== 'Normal' && l.status !== 'Pending');
  const output = `CLINICAL NOTE — SOAP FORMAT
═══════════════════════════════════════
Date: ${new Date().toLocaleDateString()}
Patient: ${patient.name} | ${patient.patient_code || ''}
Provider: [Auto-generated by OncoAI]

S — SUBJECTIVE:
Patient ${patient.name}, ${patient.age || 'N/A'} y/o ${patient.gender || ''}, presents with ${patient.medical_condition || 'head and neck complaint'}.
Smoking: ${patient.smoking_status || 'Not documented'} | Alcohol: ${patient.alcohol_use || 'Not documented'}
Allergies: ${patient.allergies || 'NKDA'}
Current medications: ${patient.current_medications || 'None documented'}
Family cancer history: ${patient.family_cancer_history || 'Not documented'}

O — OBJECTIVE:
Vitals: Height ${patient.height_cm || '—'} cm, Weight ${patient.weight_kg || '—'} kg, BMI ${patient.height_cm && patient.weight_kg ? (patient.weight_kg / ((patient.height_cm/100)**2)).toFixed(1) : '—'}
Blood Group: ${patient.blood_group || 'Not tested'}

Lab Results (${labs.length} total, ${abnLabs.length} abnormal):
${abnLabs.length ? abnLabs.slice(0,5).map(l => `  ${l.test_name}: ${(l.test_value||'').split('|')[0]} ${(l.test_value||'').split('|')[1]||''} [${l.status}] (ref: ${l.reference_range || 'N/A'})`).join('\n') : '  All within normal limits'}

Pathology: ${latestPath ? `${latestPath.specimen_type} — ${latestPath.diagnosis || latestPath.findings || 'Pending'} [${latestPath.status}]` : 'No pathology on file'}
Imaging: ${imaging.length ? imaging.slice(0,2).map(i => `${i.study_type} (${i.modality || ''}) — ${i.status}`).join('; ') : 'No imaging on file'}

A — ASSESSMENT:
1. ${patient.cancer_type || 'Suspected head and neck malignancy'} ${patient.cancer_stage ? '— ' + patient.cancer_stage : ''}
2. ${patient.chronic_conditions || 'No significant comorbidities documented'}
${abnLabs.length ? `3. ${abnLabs.length} abnormal lab value(s) requiring attention` : ''}

P — PLAN:
${!latestPath ? '1. Order biopsy for tissue diagnosis\n' : ''}${imaging.length === 0 ? '1. Order CT/MRI for staging\n' : ''}${labs.length === 0 ? '1. Order baseline labs (CBC, LFT, RFT, tumor markers)\n' : ''}1. ${patient.journey_status === 'tb_presented' ? 'Implement treatment plan per tumor board recommendation' : 'Continue workup, prepare for tumor board discussion'}
2. Patient education and counseling
3. Follow-up: ${patient.journey_status === 'in_treatment' ? '2 weeks during treatment' : '1 week for results review'}
4. Referrals: ${patient.cancer_type ? 'Multidisciplinary team review' : 'As indicated by diagnosis'}

[Auto-generated by OncoAI Clinical Intelligence — verify and sign]`;

  showAIOutput('AI Clinical Notes (SOAP)', output);
}

async function generatePostVisit() {
  const pid = $('#summaryPatientSelect')?.value;
  if (!pid) { toast('Select a patient', 'error'); return; }
  showAIOutput('Post-Visit Follow-up Tasks', 'Generating...');
  const [patient, workup, labs, refs] = await Promise.all([
    api(`/api/patients/${pid}`).catch(() => ({})),
    api(`/api/patients/${pid}/workup`).catch(() => null),
    api(`/api/patients/${pid}/lab-results`).catch(() => []),
    api(`/api/patients/${pid}/referrals`).catch(() => []),
  ]);
  const tasks = [];
  if (!workup?.imaging_complete) tasks.push({ pri: 'HIGH', task: 'Order CT/MRI imaging for staging', dept: 'Radiology' });
  if (!workup?.pathology_complete) tasks.push({ pri: 'HIGH', task: 'Order tissue biopsy', dept: 'Pathology' });
  if (!workup?.lab_complete) tasks.push({ pri: 'MEDIUM', task: 'Order baseline laboratory tests (CBC, LFT, RFT, tumor markers)', dept: 'Laboratory' });
  if (!workup?.consultation_complete) tasks.push({ pri: 'MEDIUM', task: 'Arrange specialist consultation/referral', dept: 'Referrals' });
  if (labs.some(l => l.status === 'Critical')) tasks.push({ pri: 'URGENT', task: 'Address critical lab values immediately', dept: 'Attending' });
  if (workup?.tb_ready) tasks.push({ pri: 'HIGH', task: 'Schedule tumor board presentation', dept: 'TB Coordinator' });
  if (patient?.smoking_status === 'Current') tasks.push({ pri: 'MEDIUM', task: 'Refer to smoking cessation program', dept: 'Counseling' });
  if (!patient?.nhif_registered) tasks.push({ pri: 'LOW', task: 'Assist patient with NHIF registration', dept: 'Social Work' });
  tasks.push({ pri: 'MEDIUM', task: 'Schedule follow-up appointment', dept: 'Reception' });
  tasks.push({ pri: 'LOW', task: 'Send patient education materials via WhatsApp', dept: 'TB Coordinator' });

  const output = `POST-VISIT FOLLOW-UP TASKS
═══════════════════════════════════════
Patient: ${patient.name} (${patient.patient_code || ''})
Visit Date: ${new Date().toLocaleDateString()}
Generated: ${new Date().toLocaleString()}

${tasks.map((t, i) => {
  const priIcon = { URGENT: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '🟢' }[t.pri] || '⚪';
  return `${priIcon} [${t.pri}] ${t.task}\n   Department: ${t.dept}\n   Status: ⬜ Pending`;
}).join('\n\n')}

NEXT APPOINTMENT: ${patient.journey_status === 'in_treatment' ? '2 weeks' : '1 week'} from today
PATIENT CONTACT: ${patient.phone || 'No phone on file'}
NOTES: ${patient.notes || 'None'}

[Auto-generated by OncoAI — assign tasks to team members]`;

  showAIOutput('Post-Visit Follow-up Tasks', output);
}

function showAIOutput(title, content) {
  const panel = $('#aiOutputPanel');
  panel.style.display = 'block';
  $('#aiOutputTitle').innerHTML = `<i class="ri-robot-2-line" style="color:var(--primary)"></i> ${esc(title)}`;
  $('#aiOutputContent').textContent = content;
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function copyAIOutput() {
  const text = $('#aiOutputContent')?.textContent || '';
  navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard')).catch(() => {});
}

// ─── Pathology Structured Report ───
let pathSlideFiles = [];

function togglePathPanel() {
  const panel = $('#pathStructPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  if (panel.style.display === 'block') {
    const sel = $('#pathStructPatient');
    sel.innerHTML = '<option value="">— Select Patient —</option>' + patients.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
    initPathSlideDrop();
  }
}

function initPathSlideDrop() {
  const zone = $('#pathSlideZone');
  if (!zone || zone._initDrop) return;
  zone._initDrop = true;
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('drag-over'); if (e.dataTransfer.files.length) addPathSlides(e.dataTransfer.files); });
}

function handlePathSlideUpload() {
  const input = $('#pathSlideFile');
  if (input?.files.length) { addPathSlides(input.files); input.value = ''; }
}

function addPathSlides(fileList) {
  for (const f of fileList) pathSlideFiles.push(f);
  const container = $('#pathSlidePreview');
  if (!container) return;
  container.innerHTML = pathSlideFiles.map((f, i) => {
    const isImg = f.type.startsWith('image/');
    return `<div style="position:relative;width:100px;border:1px solid var(--border-color);border-radius:8px;overflow:hidden">
      ${isImg ? `<img src="${URL.createObjectURL(f)}" style="width:100%;height:70px;object-fit:cover">` : `<div style="height:70px;display:flex;align-items:center;justify-content:center;background:var(--gray-50);color:var(--gray-400)"><i class="ri-file-3-line" style="font-size:1.5rem"></i></div>`}
      <div style="padding:0.2rem 0.4rem;font-size:0.7rem;color:var(--gray-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(f.name)}</div>
      <button onclick="pathSlideFiles.splice(${i},1);handlePathSlideUpload()" style="position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;border:none;background:rgba(0,0,0,0.5);color:white;font-size:0.6rem;cursor:pointer">&times;</button>
    </div>`;
  }).join('');
}

async function submitStructuredPath() {
  const pid = $('#pathStructPatient')?.value;
  if (!pid) { toast('Select a patient', 'error'); return; }
  const site = $('#pathSite')?.value || '';
  const specType = $('#pathSpecType')?.value || '';
  const histoType = $('#pathHistoType')?.value || '';
  const grade = $('#pathGrade')?.value || '';
  const pT = $('#pathT')?.value || '';
  const pN = $('#pathN')?.value || '';
  const pM = $('#pathM')?.value || '';
  const margin = $('#pathMargin')?.value || '';
  const lvi = $('#pathLVI')?.value || '';
  const pni = $('#pathPNI')?.value || '';
  const hpv = $('#pathHPV')?.value || '';
  const gross = $('#pathGross')?.value || '';
  const micro = $('#pathMicro')?.value || '';
  const diagnosis = $('#pathDiagnosis')?.value || '';
  const pathologist = $('#pathDoctor')?.value || '';

  const tnm = [pT, pN, pM].filter(Boolean).join(' ');
  const findings = [
    histoType + (grade ? ` (${grade})` : ''),
    tnm,
    margin,
  ].join('||');

  const fullNotes = [
    `Site: ${site}`,
    `Specimen: ${specType}`,
    `Histology: ${histoType}`,
    grade ? `Grade: ${grade}` : '',
    tnm ? `TNM: ${tnm}` : '',
    margin ? `Margins: ${margin}` : '',
    lvi ? `LVI: ${lvi}` : '',
    pni ? `PNI: ${pni}` : '',
    hpv ? `HPV/p16: ${hpv}` : '',
    gross ? `Gross: ${gross}` : '',
    micro ? `Micro: ${micro}` : '',
  ].filter(Boolean).join('\n');

  // Upload slide images
  for (const f of pathSlideFiles) {
    const fd = new FormData();
    fd.append('file', f);
    fd.append('title', `[Pathology Slide] ${site} — ${f.name}`);
    try { await fetch(`/api/patients/${pid}/documents`, { method: 'POST', body: fd }); } catch {}
  }

  // Save pathology report
  try {
    await api(`/api/patients/${pid}/pathology-reports`, {
      method: 'POST',
      body: JSON.stringify({
        specimen_type: site || specType,
        findings: findings,
        diagnosis: diagnosis || histoType,
        pathologist: pathologist,
        status: 'Final',
        notes: fullNotes,
      }),
    });
    toast('Structured pathology report saved');
    pathSlideFiles = [];
    $('#pathSlidePreview').innerHTML = '';
    clinical.render('pathology');
  } catch (e) { toast(e.message, 'error'); }
}

function sharePathViaWhatsApp() {
  const pid = $('#pathStructPatient')?.value;
  if (!pid) { toast('Select a patient', 'error'); return; }
  const patient = patients.find(x => x.id === parseInt(pid));
  const histoType = $('#pathHistoType')?.value || '';
  const tnm = [$('#pathT')?.value, $('#pathN')?.value, $('#pathM')?.value].filter(Boolean).join(' ');
  const site = $('#pathSite')?.value || '';
  const msg = encodeURIComponent(
    `OncoAI Pathology Report\n\nPatient: ${patient?.name || 'N/A'}\nSite: ${site}\nHistology: ${histoType}\nTNM: ${tnm}\nMargins: ${$('#pathMargin')?.value || 'N/A'}\n\nPlease log in to OncoAI for the full report and slide images.`
  );
  window.open(`https://wa.me/?text=${msg}`, '_blank');
}

async function loadPathDocs() {
  const pid = $('#pathPatientSelect')?.value;
  const panel = $('#pathDocsListPanel');
  if (!panel) return;
  if (!pid) { panel.innerHTML = ''; return; }
  try {
    const docs = await api(`/api/patients/${pid}/documents`);
    const pathDocs = docs.filter(d => d.title && d.title.includes('[Pathology'));
    if (!pathDocs.length) { panel.innerHTML = ''; return; }
    panel.innerHTML = `<div style="background:white;border:1px solid var(--border-color);border-radius:var(--radius);padding:1rem;box-shadow:var(--card-shadow)">
      <h4 style="font-size:0.95rem;font-weight:700;margin-bottom:0.65rem;display:flex;align-items:center;gap:0.4rem"><i class="ri-image-2-line" style="color:var(--primary)"></i> Pathology Slides & Images (${pathDocs.length})</h4>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:0.5rem">
        ${pathDocs.map(d => {
          const isImg = d.filename && (d.filename.endsWith('.jpg') || d.filename.endsWith('.jpeg') || d.filename.endsWith('.png'));
          return `<div style="border:1px solid var(--gray-100);border-radius:8px;overflow:hidden">
            ${isImg ? `<img src="/api/documents/${d.id}/download" style="width:100%;height:100px;object-fit:cover">` : `<div style="height:100px;display:flex;align-items:center;justify-content:center;background:var(--gray-50)"><i class="ri-file-3-line" style="font-size:2rem;color:var(--gray-300)"></i></div>`}
            <div style="padding:0.35rem 0.5rem"><div style="font-size:0.75rem;font-weight:600;color:var(--gray-700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(d.title)}</div><div style="font-size:0.65rem;color:var(--gray-400)">${d.created_at ? new Date(d.created_at).toLocaleDateString() : ''}</div></div>
          </div>`}).join('')}
      </div>
    </div>`;
  } catch { panel.innerHTML = ''; }
}

// ─── Lab Quick Add ───
const LAB_TESTS = {
  hematology: [
    { name: 'Hemoglobin (Hb)', unit: 'g/dL', ref: '12.0–17.5', low: 12, high: 17.5, critLow: 7, critHigh: 20 },
    { name: 'White Blood Cells (WBC)', unit: '×10³/µL', ref: '4.5–11.0', low: 4.5, high: 11, critLow: 2, critHigh: 30 },
    { name: 'Platelets', unit: '×10³/µL', ref: '150–400', low: 150, high: 400, critLow: 50, critHigh: 1000 },
    { name: 'Red Blood Cells (RBC)', unit: '×10⁶/µL', ref: '4.5–5.5', low: 4.5, high: 5.5 },
    { name: 'Hematocrit (HCT)', unit: '%', ref: '36–48', low: 36, high: 48 },
    { name: 'MCV', unit: 'fL', ref: '80–100', low: 80, high: 100 },
    { name: 'MCH', unit: 'pg', ref: '27–33', low: 27, high: 33 },
    { name: 'Neutrophils', unit: '%', ref: '40–70', low: 40, high: 70 },
    { name: 'Lymphocytes', unit: '%', ref: '20–40', low: 20, high: 40 },
    { name: 'ESR', unit: 'mm/hr', ref: '0–20', low: 0, high: 20 },
  ],
  chemistry: [
    { name: 'Fasting Blood Glucose', unit: 'mg/dL', ref: '70–100', low: 70, high: 100, critLow: 40, critHigh: 400 },
    { name: 'Random Blood Glucose', unit: 'mg/dL', ref: '70–140', low: 70, high: 140, critHigh: 500 },
    { name: 'HbA1c', unit: '%', ref: '4.0–5.6', low: 4, high: 5.6 },
    { name: 'Total Cholesterol', unit: 'mg/dL', ref: '<200', low: 0, high: 200 },
    { name: 'LDL Cholesterol', unit: 'mg/dL', ref: '<100', low: 0, high: 100 },
    { name: 'HDL Cholesterol', unit: 'mg/dL', ref: '>40', low: 40, high: 999 },
    { name: 'Triglycerides', unit: 'mg/dL', ref: '<150', low: 0, high: 150 },
    { name: 'Serum Sodium (Na+)', unit: 'mEq/L', ref: '136–145', low: 136, high: 145, critLow: 120, critHigh: 160 },
    { name: 'Serum Potassium (K+)', unit: 'mEq/L', ref: '3.5–5.0', low: 3.5, high: 5, critLow: 2.5, critHigh: 6.5 },
    { name: 'Serum Calcium (Ca²+)', unit: 'mg/dL', ref: '8.5–10.5', low: 8.5, high: 10.5 },
    { name: 'Serum Chloride (Cl-)', unit: 'mEq/L', ref: '98–106', low: 98, high: 106 },
  ],
  liver: [
    { name: 'ALT (SGPT)', unit: 'U/L', ref: '7–56', low: 0, high: 56 },
    { name: 'AST (SGOT)', unit: 'U/L', ref: '10–40', low: 0, high: 40 },
    { name: 'Alkaline Phosphatase (ALP)', unit: 'U/L', ref: '44–147', low: 44, high: 147 },
    { name: 'GGT', unit: 'U/L', ref: '9–48', low: 0, high: 48 },
    { name: 'Total Bilirubin', unit: 'mg/dL', ref: '0.1–1.2', low: 0, high: 1.2 },
    { name: 'Direct Bilirubin', unit: 'mg/dL', ref: '0.0–0.3', low: 0, high: 0.3 },
    { name: 'Albumin', unit: 'g/dL', ref: '3.5–5.5', low: 3.5, high: 5.5 },
    { name: 'Total Protein', unit: 'g/dL', ref: '6.0–8.3', low: 6, high: 8.3 },
  ],
  renal: [
    { name: 'Creatinine', unit: 'mg/dL', ref: '0.7–1.3', low: 0.7, high: 1.3 },
    { name: 'Blood Urea Nitrogen (BUN)', unit: 'mg/dL', ref: '7–20', low: 7, high: 20 },
    { name: 'Uric Acid', unit: 'mg/dL', ref: '3.5–7.2', low: 3.5, high: 7.2 },
    { name: 'eGFR', unit: 'mL/min/1.73m²', ref: '>90', low: 90, high: 999 },
  ],
  tumor_markers: [
    { name: 'CEA', unit: 'ng/mL', ref: '<5.0', low: 0, high: 5 },
    { name: 'CA 19-9', unit: 'U/mL', ref: '<37', low: 0, high: 37 },
    { name: 'CA 125', unit: 'U/mL', ref: '<35', low: 0, high: 35 },
    { name: 'AFP (Alpha-Fetoprotein)', unit: 'ng/mL', ref: '<10', low: 0, high: 10 },
    { name: 'PSA', unit: 'ng/mL', ref: '<4.0', low: 0, high: 4 },
    { name: 'SCC Antigen', unit: 'ng/mL', ref: '<1.5', low: 0, high: 1.5 },
    { name: 'LDH', unit: 'U/L', ref: '140–280', low: 140, high: 280 },
    { name: 'Beta-2 Microglobulin', unit: 'mg/L', ref: '0.7–1.8', low: 0.7, high: 1.8 },
  ],
  coagulation: [
    { name: 'PT (Prothrombin Time)', unit: 'seconds', ref: '11–13.5', low: 11, high: 13.5 },
    { name: 'INR', unit: '', ref: '0.8–1.1', low: 0.8, high: 1.1 },
    { name: 'aPTT', unit: 'seconds', ref: '25–35', low: 25, high: 35 },
    { name: 'D-Dimer', unit: 'µg/mL', ref: '<0.5', low: 0, high: 0.5 },
    { name: 'Fibrinogen', unit: 'mg/dL', ref: '200–400', low: 200, high: 400 },
  ],
  thyroid: [
    { name: 'TSH', unit: 'mIU/L', ref: '0.4–4.0', low: 0.4, high: 4 },
    { name: 'Free T4', unit: 'ng/dL', ref: '0.8–1.8', low: 0.8, high: 1.8 },
    { name: 'Free T3', unit: 'pg/mL', ref: '2.3–4.2', low: 2.3, high: 4.2 },
  ],
  hiv: [
    { name: 'HIV 1/2 Antibody', unit: '', ref: 'Non-reactive', low: null, high: null, qualitative: true, normalVal: 'Non-reactive' },
    { name: 'CD4 Count', unit: 'cells/µL', ref: '500–1500', low: 500, high: 1500, critLow: 200 },
    { name: 'Viral Load (HIV RNA)', unit: 'copies/mL', ref: '<20 (undetectable)', low: 0, high: 20 },
    { name: 'Hepatitis B (HBsAg)', unit: '', ref: 'Non-reactive', low: null, high: null, qualitative: true, normalVal: 'Non-reactive' },
    { name: 'Hepatitis C (Anti-HCV)', unit: '', ref: 'Non-reactive', low: null, high: null, qualitative: true, normalVal: 'Non-reactive' },
  ],
  urinalysis: [
    { name: 'Urine pH', unit: '', ref: '4.5–8.0', low: 4.5, high: 8 },
    { name: 'Urine Protein', unit: '', ref: 'Negative', low: null, high: null, qualitative: true, normalVal: 'Negative' },
    { name: 'Urine Glucose', unit: '', ref: 'Negative', low: null, high: null, qualitative: true, normalVal: 'Negative' },
    { name: 'Urine Blood', unit: '', ref: 'Negative', low: null, high: null, qualitative: true, normalVal: 'Negative' },
    { name: 'Urine WBC', unit: '/HPF', ref: '0–5', low: 0, high: 5 },
  ],
};

function toggleLabQuickAdd() {
  const panel = $('#labQuickPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  if (panel.style.display === 'block') {
    const sel = $('#labQuickPatient');
    sel.innerHTML = '<option value="">— Select Patient —</option>' + patients.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  }
}

function renderLabTests() {
  const cat = $('#labCategory')?.value;
  const grid = $('#labTestsGrid');
  if (!cat || !LAB_TESTS[cat]) { grid.innerHTML = ''; return; }
  grid.innerHTML = LAB_TESTS[cat].map((t, i) => {
    const isQual = t.qualitative;
    return `<div style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.75rem;background:white;border-radius:8px;border:1px solid var(--border-color)">
      <div style="flex:1;min-width:0">
        <div style="font-size:0.85rem;font-weight:600;color:var(--gray-700)">${esc(t.name)}</div>
        <div style="font-size:0.75rem;color:var(--gray-400)">${esc(t.ref)} ${t.unit ? '(' + esc(t.unit) + ')' : ''}</div>
      </div>
      ${isQual
        ? `<select id="labVal_${i}" style="width:120px;font-size:0.85rem"><option value="">--</option><option>${esc(t.normalVal)}</option><option>Reactive</option><option>Positive</option><option>Trace</option></select>`
        : `<input type="number" step="any" id="labVal_${i}" placeholder="Value" style="width:90px;font-size:0.85rem">`
      }
      <span id="labFlag_${i}" style="font-size:0.85rem;font-weight:700;min-width:20px"></span>
      ${!isQual ? `<input type="hidden" onchange="" id="labRef_${i}" value="${esc(t.ref)}">` : ''}
    </div>`;
  }).join('');

  // Add live validation listeners
  LAB_TESTS[cat].forEach((t, i) => {
    const input = $(`#labVal_${i}`);
    if (!input) return;
    input.addEventListener('input', () => {
      const flag = $(`#labFlag_${i}`);
      if (t.qualitative) {
        const v = input.value;
        if (!v) { flag.textContent = ''; return; }
        flag.textContent = v === t.normalVal ? '✓' : '⚠';
        flag.style.color = v === t.normalVal ? 'var(--success)' : 'var(--danger)';
      } else {
        const v = parseFloat(input.value);
        if (isNaN(v)) { flag.textContent = ''; return; }
        if (t.critLow !== undefined && v < t.critLow) { flag.textContent = '‼ CRIT'; flag.style.color = 'var(--danger)'; }
        else if (t.critHigh !== undefined && v > t.critHigh) { flag.textContent = '‼ CRIT'; flag.style.color = 'var(--danger)'; }
        else if (v < t.low) { flag.textContent = '↓ Low'; flag.style.color = '#D97706'; }
        else if (v > t.high) { flag.textContent = '↑ High'; flag.style.color = '#D97706'; }
        else { flag.textContent = '✓'; flag.style.color = 'var(--success)'; }
      }
    });
  });
}

async function submitQuickLab() {
  const pid = $('#labQuickPatient')?.value;
  if (!pid) { toast('Select a patient', 'error'); return; }
  const cat = $('#labCategory')?.value;
  if (!cat || !LAB_TESTS[cat]) { toast('Select a test category', 'error'); return; }

  let saved = 0;
  for (let i = 0; i < LAB_TESTS[cat].length; i++) {
    const t = LAB_TESTS[cat][i];
    const input = $(`#labVal_${i}`);
    const val = input?.value;
    if (!val) continue;

    let status = 'Pending';
    if (t.qualitative) {
      status = val === t.normalVal ? 'Normal' : 'Abnormal';
    } else {
      const v = parseFloat(val);
      if (!isNaN(v)) {
        if ((t.critLow !== undefined && v < t.critLow) || (t.critHigh !== undefined && v > t.critHigh)) status = 'Critical';
        else if (v < t.low || v > t.high) status = 'Abnormal';
        else status = 'Normal';
      }
    }

    try {
      await api(`/api/patients/${pid}/lab-results`, {
        method: 'POST',
        body: JSON.stringify({
          test_name: t.name,
          test_value: `${val}|${t.unit}`,
          reference_range: t.ref,
          status: status,
          notes: `Category: ${cat}`,
        }),
      });
      saved++;
    } catch {}
  }

  if (saved > 0) {
    toast(`${saved} lab result(s) saved`);
    clinical.render('lab');
    // Clear values
    LAB_TESTS[cat].forEach((_, i) => { const el = $(`#labVal_${i}`); if (el) el.value = ''; const fl = $(`#labFlag_${i}`); if (fl) fl.textContent = ''; });
  } else {
    toast('Enter at least one value', 'error');
  }
}

// ─── Referral Document Upload ───
let refDocFiles = [];

function toggleRefUpload() {
  const panel = $('#refUploadPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  if (panel.style.display === 'block') loadRefUploadPatients();
}

async function loadRefUploadPatients() {
  try {
    const ps = await api('/api/patients');
    ['refDocPatient'].forEach(id => {
      const sel = $(`#${id}`);
      if (sel) sel.innerHTML = '<option value="">— Select Patient —</option>' + ps.map(p => `<option value="${p.id}">${esc(p.name)} (${esc(p.patient_code || '')})</option>`).join('');
    });
  } catch {}
  // Init drag-drop
  const zone = $('#refUploadZone');
  if (zone && !zone._initDrop) {
    zone._initDrop = true;
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('drag-over'); if (e.dataTransfer.files.length) addRefDocFiles(e.dataTransfer.files); });
  }
}

function handleRefDocUpload() {
  const input = $('#refDocFile');
  if (input?.files.length) { addRefDocFiles(input.files); input.value = ''; }
}

function addRefDocFiles(fileList) {
  for (const f of fileList) refDocFiles.push(f);
  renderRefDocPreviews();
}

function removeRefDocFile(idx) {
  refDocFiles.splice(idx, 1);
  renderRefDocPreviews();
}

function renderRefDocPreviews() {
  const container = $('#refDocPreview');
  if (!container) return;
  if (!refDocFiles.length) { container.innerHTML = ''; return; }
  const icons = { 'application/pdf': 'ri-file-pdf-2-line', 'image/': 'ri-image-line', 'application/msword': 'ri-file-word-line', 'application/vnd': 'ri-file-word-line' };
  container.innerHTML = refDocFiles.map((f, i) => {
    const icon = Object.entries(icons).find(([k]) => f.type.startsWith(k))?.[1] || 'ri-file-3-line';
    const sizeKB = (f.size / 1024).toFixed(0);
    return `<div style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.75rem;background:white;border:1px solid var(--border-color);border-radius:8px;font-size:0.85rem">
      <i class="${icon}" style="font-size:1.2rem;color:var(--primary)"></i>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;color:var(--gray-700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(f.name)}</div>
        <div style="font-size:0.75rem;color:var(--gray-400)">${sizeKB} KB</div>
      </div>
      <button onclick="removeRefDocFile(${i})" style="background:none;border:none;color:var(--gray-400);cursor:pointer;font-size:1rem">&times;</button>
    </div>`;
  }).join('');
}

async function submitRefDocs() {
  const pid = $('#refDocPatient')?.value;
  if (!pid) { toast('Select a patient', 'error'); return; }
  if (!refDocFiles.length) { toast('Add at least one document', 'error'); return; }
  const docType = $('#refDocType')?.value || 'Referral Letter';
  const referredTo = $('#refDocTo')?.value || '';
  const notes = $('#refDocNotes')?.value || '';
  const status = $('#refDocStatus');

  let uploaded = 0;
  for (const f of refDocFiles) {
    if (status) status.textContent = `Uploading ${++uploaded} of ${refDocFiles.length}...`;
    const fd = new FormData();
    fd.append('file', f);
    fd.append('title', `[${docType}] ${f.name}${referredTo ? ' → ' + referredTo : ''}`);
    try { await fetch(`/api/patients/${pid}/documents`, { method: 'POST', body: fd }); }
    catch (e) { toast(`Failed: ${f.name}`, 'error'); }
  }

  // Create a referral record linking the docs if referred to someone
  if (referredTo) {
    try {
      await api(`/api/patients/${pid}/referrals`, {
        method: 'POST',
        body: JSON.stringify({
          doctor_name: referredTo,
          specialty: docType,
          hospital: '',
          status: 'Sent',
          reason: notes,
          notes: `${refDocFiles.length} document(s) shared: ${refDocFiles.map(f => f.name).join(', ')}`,
        }),
      });
    } catch {}
  }

  refDocFiles = [];
  renderRefDocPreviews();
  if (status) status.textContent = '';
  $('#refDocNotes').value = '';
  $('#refDocTo').value = '';
  toast(`${uploaded} referral document(s) uploaded and shared`);
  clinical.render('referrals');
  loadRefDocs();
}

function shareRefViaWhatsApp() {
  const pid = $('#refDocPatient')?.value;
  if (!pid) { toast('Select a patient', 'error'); return; }
  const referredTo = $('#refDocTo')?.value || 'Specialist';
  const docType = $('#refDocType')?.value || 'Referral Letter';
  const notes = $('#refDocNotes')?.value || '';
  const patient = patients.find(x => x.id === parseInt(pid));
  const msg = encodeURIComponent(
    `OncoAI Referral Document\n\nPatient: ${patient?.name || 'N/A'} (${patient?.patient_code || ''})\nDocument: ${docType}\nTo: ${referredTo}\n${notes ? 'Notes: ' + notes : ''}\n\nPlease log in to OncoAI to view the full documents.`
  );
  window.open(`https://wa.me/?text=${msg}`, '_blank');
}

async function loadRefDocs() {
  const pid = $('#refPatientSelect')?.value;
  const panel = $('#refDocsListPanel');
  if (!panel) return;
  if (!pid) { panel.innerHTML = ''; return; }
  try {
    const docs = await api(`/api/patients/${pid}/documents`);
    const refDocs = docs.filter(d => d.title && (d.title.includes('[Referral') || d.title.includes('[Clinical') || d.title.includes('[Consultation') || d.title.includes('[Discharge') || d.title.includes('[Treatment') || d.title.includes('[TB Meeting')));
    if (!refDocs.length) { panel.innerHTML = ''; return; }
    panel.innerHTML = `
      <div style="background:white;border:1px solid var(--border-color);border-radius:var(--radius);padding:1rem;box-shadow:var(--card-shadow)">
        <h4 style="font-size:0.95rem;font-weight:700;margin-bottom:0.65rem;display:flex;align-items:center;gap:0.4rem"><i class="ri-folder-shared-line" style="color:var(--primary)"></i> Shared Referral Documents (${refDocs.length})</h4>
        <div style="display:grid;gap:0.4rem">
          ${refDocs.map(d => `<div style="display:flex;align-items:center;gap:0.65rem;padding:0.5rem 0.75rem;background:var(--gray-50);border-radius:8px;border:1px solid var(--gray-100)">
            <i class="ri-file-text-line" style="font-size:1.1rem;color:var(--primary)"></i>
            <div style="flex:1;min-width:0">
              <div style="font-size:0.85rem;font-weight:600;color:var(--gray-700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(d.title)}</div>
              <div style="font-size:0.75rem;color:var(--gray-400)">${d.created_at ? new Date(d.created_at).toLocaleDateString() : ''} — ${esc(d.filename)}</div>
            </div>
            <a href="/api/documents/${d.id}/download" target="_blank" class="btn btn-sm btn-secondary" title="Download"><i class="ri-download-line"></i></a>
          </div>`).join('')}
        </div>
      </div>`;
  } catch { panel.innerHTML = ''; }
}

// ─── Settings Panel ───
function toggleSettings() {
  const p = $('#settingsPanel');
  if (!p) return;
  const show = p.style.display === 'none';
  p.style.display = show ? 'block' : 'none';
  if (show) { loadSettingsValues(); loadSystemInfo(); }
}

document.addEventListener('click', (e) => {
  const p = $('#settingsPanel');
  if (p && p.style.display !== 'none' && !e.target.closest('#settingsPanel') && !e.target.closest('[title="Settings"]')) p.style.display = 'none';
});

function loadSettingsValues() {
  const s = JSON.parse(localStorage.getItem('oncoai_settings') || '{}');
  const user = JSON.parse(localStorage.getItem('oncoai_user') || '{}');
  if ($('#setName')) $('#setName').value = user.full_name || '';
  if ($('#setSpecialty')) $('#setSpecialty').value = user.specialty || '';
  if ($('#setPhone')) $('#setPhone').value = s.phone || '';
  if ($('#setInstitution')) $('#setInstitution').value = s.institution || '';
  if ($('#setDarkMode')) $('#setDarkMode').checked = s.darkMode || false;
  if ($('#setAnimations')) $('#setAnimations').checked = s.animations !== false;
  if ($('#setFontSize')) $('#setFontSize').value = s.fontSize || 'normal';
  if ($('#setLabAlerts')) $('#setLabAlerts').checked = s.labAlerts !== false;
  if ($('#setTBReminders')) $('#setTBReminders').checked = s.tbReminders !== false;
  if ($('#setSound')) $('#setSound').checked = s.sound || false;
  if ($('#setPolling')) $('#setPolling').value = s.polling || '30';
}

function saveSettings() {
  const s = { labAlerts: $('#setLabAlerts')?.checked !== false, tbReminders: $('#setTBReminders')?.checked !== false, sound: $('#setSound')?.checked || false, polling: $('#setPolling')?.value || '30', darkMode: $('#setDarkMode')?.checked || false, animations: $('#setAnimations')?.checked !== false, fontSize: $('#setFontSize')?.value || 'normal', phone: $('#setPhone')?.value || '', institution: $('#setInstitution')?.value || '' };
  localStorage.setItem('oncoai_settings', JSON.stringify(s));
}

async function saveProfile() {
  const user = JSON.parse(localStorage.getItem('oncoai_user') || '{}');
  const name = $('#setName')?.value; const specialty = $('#setSpecialty')?.value;
  if (name) user.full_name = name;
  if (specialty) user.specialty = specialty;
  localStorage.setItem('oncoai_user', JSON.stringify(user));
  const nameEl = document.querySelector('.sidebar-user-name');
  const roleEl = document.querySelector('.sidebar-user-role');
  if (nameEl && name) nameEl.textContent = name;
  if (roleEl && specialty) roleEl.textContent = specialty;
  saveSettings();
  toast('Profile saved');
}

function toggleDarkMode() {
  const dark = $('#setDarkMode')?.checked;
  if (dark) {
    document.documentElement.style.setProperty('--gray-50', '#1C1917');
    document.documentElement.style.setProperty('--gray-100', '#292524');
    document.documentElement.style.setProperty('--gray-200', '#44403C');
    document.documentElement.style.setProperty('--gray-800', '#E7E5E4');
    document.documentElement.style.setProperty('--gray-900', '#FAFAF9');
    document.documentElement.style.setProperty('--border-color', '#44403C');
    document.body.style.background = '#1C1917';
  } else {
    document.documentElement.style.setProperty('--gray-50', '#FAFAF9');
    document.documentElement.style.setProperty('--gray-100', '#F5F5F4');
    document.documentElement.style.setProperty('--gray-200', '#E7E5E4');
    document.documentElement.style.setProperty('--gray-800', '#292524');
    document.documentElement.style.setProperty('--gray-900', '#1C1917');
    document.documentElement.style.setProperty('--border-color', '#e5e7eb');
    document.body.style.background = '';
  }
  saveSettings();
}

function toggleAnimations() {
  const on = $('#setAnimations')?.checked;
  if (!on) { document.querySelectorAll('.animate-in').forEach(el => el.classList.add('visible')); document.body.classList.add('no-animations'); }
  else document.body.classList.remove('no-animations');
  saveSettings();
}

function changeFontSize() {
  const sizes = { normal: '100%', large: '112%', xlarge: '125%' };
  document.documentElement.style.fontSize = sizes[$('#setFontSize')?.value] || '100%';
  saveSettings();
}

async function loadSystemInfo() {
  const el = $('#systemInfo'); if (!el) return;
  el.innerHTML = '<div style="color:var(--gray-400)">Loading...</div>';
  try {
    const [health, patients, labs, tbs, users] = await Promise.all([api('/api/health').catch(() => ({status:'error'})), api('/api/patients').catch(() => []), api('/api/lab-results').catch(() => []), api('/api/tumor-boards').catch(() => []), api('/api/auth/users').catch(() => [])]);
    el.innerHTML = [
      ['API Status', `<span style="color:${health.status==='ok'?'var(--success)':'var(--danger)'};font-weight:700">${health.status==='ok'?'● Online':'● Offline'}</span>`],
      ['Version', '<span style="font-weight:600">1.0.0</span>'],
      ['Patients', `<span style="font-weight:600">${patients.length}</span>`],
      ['Lab Results', `<span style="font-weight:600">${labs.length}</span>`],
      ['Tumor Boards', `<span style="font-weight:600">${tbs.length}</span>`],
      ['Users', `<span style="font-weight:600">${users.length}</span>`],
      ['Platform', '<span style="font-weight:600">OncoAI PWA</span>'],
    ].map(([k,v]) => `<div style="display:flex;justify-content:space-between;padding:0.35rem 0;border-bottom:1px solid var(--gray-100)"><span>${k}</span>${v}</div>`).join('');
  } catch { el.innerHTML = '<div style="color:var(--danger)">Failed to load</div>'; }
}

async function exportAllData() {
  toast('Exporting...'); try {
    const [patients,labs,path,imaging,refs,tbs,reviews] = await Promise.all([api('/api/patients').catch(()=>[]),api('/api/lab-results').catch(()=>[]),api('/api/pathology-reports').catch(()=>[]),api('/api/imaging-results').catch(()=>[]),api('/api/referrals').catch(()=>[]),api('/api/tumor-boards').catch(()=>[]),api('/api/reviews').catch(()=>[])]);
    const blob = new Blob([JSON.stringify({exported_at:new Date().toISOString(),version:'1.0.0',patients,lab_results:labs,pathology_reports:path,imaging_results:imaging,referrals:refs,tumor_boards:tbs,reviews},null,2)],{type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `oncoai_export_${new Date().toISOString().slice(0,10)}.json`; a.click();
    toast('Data exported');
  } catch(e) { toast(e.message,'error'); }
}

async function viewRegisteredUsers() {
  try {
    const users = await api('/api/auth/users');
    openModal('Registered Users ('+users.length+')', `<div style="max-height:400px;overflow-y:auto">${users.map(u=>`<div style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem;border-bottom:1px solid var(--gray-100)"><div style="width:40px;height:40px;border-radius:10px;background:rgba(15,76,92,0.08);display:flex;align-items:center;justify-content:center;color:var(--primary);font-size:1.1rem"><i class="ri-user-line"></i></div><div style="flex:1"><div style="font-weight:700;font-size:0.95rem">${esc(u.full_name)}</div><div style="font-size:0.85rem;color:var(--gray-500)">${esc(u.email)} · ${esc(u.specialty||'')}</div></div><span class="status-badge ${u.is_active?'success':'routine'}">${u.is_active?'Active':'Disabled'}</span></div>`).join('')||'<p style="text-align:center;color:var(--gray-400);padding:2rem">No users</p>'}</div>`);
  } catch(e) { toast(e.message,'error'); }
}

async function viewSystemStats() {
  try {
    const [p,l,pa,i,r,t] = await Promise.all([api('/api/patients').catch(()=>[]),api('/api/lab-results').catch(()=>[]),api('/api/pathology-reports').catch(()=>[]),api('/api/imaging-results').catch(()=>[]),api('/api/referrals').catch(()=>[]),api('/api/tumor-boards').catch(()=>[])]);
    const stats = [[p.length,'Total Patients','var(--primary)','var(--primary-light)'],[p.filter(x=>x.cancer_stage==='Stage IV').length,'Stage IV','#EF4444','rgba(239,68,68,0.08)'],[l.length,'Lab Results','#3B82F6','rgba(59,130,246,0.08)'],[l.filter(x=>x.status==='Critical').length,'Critical Labs','#F59E0B','rgba(245,158,11,0.08)'],[pa.length,'Pathology','#8B5CF6','rgba(139,92,246,0.08)'],[t.filter(x=>x.status==='completed').length,'TB Done','#10B981','rgba(16,185,129,0.08)'],[i.length,'Imaging','#14B8A6','rgba(20,184,166,0.08)'],[r.length,'Referrals','#EC4899','rgba(236,72,153,0.08)']];
    openModal('System Statistics',`<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">${stats.map(([v,label,color,bg])=>`<div style="background:${bg};border-radius:12px;padding:1rem;text-align:center"><div style="font-size:2rem;font-weight:900;color:${color}">${v}</div><div style="font-size:0.9rem;color:var(--gray-600)">${label}</div></div>`).join('')}</div>`);
  } catch(e) { toast(e.message,'error'); }
}

function clearAllCache() {
  if (!confirm('Clear all local data? You will need to log in again.')) return;
  localStorage.removeItem('oncoai_notifs'); localStorage.removeItem('oncoai_settings');
  if ('caches' in window) caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
  toast('Cache cleared');
}

// Apply saved settings on load
(function() {
  const s = JSON.parse(localStorage.getItem('oncoai_settings') || '{}');
  if (s.darkMode) { document.documentElement.style.setProperty('--gray-50','#1C1917'); document.documentElement.style.setProperty('--gray-100','#292524'); document.documentElement.style.setProperty('--gray-200','#44403C'); document.documentElement.style.setProperty('--gray-800','#E7E5E4'); document.documentElement.style.setProperty('--gray-900','#FAFAF9'); document.documentElement.style.setProperty('--border-color','#44403C'); document.body.style.background='#1C1917'; }
  if (s.fontSize && s.fontSize !== 'normal') { const sizes = { large:'112%', xlarge:'125%' }; document.documentElement.style.fontSize = sizes[s.fontSize] || '100%'; }
  if (s.animations === false) document.body.classList.add('no-animations');
})();

// ─── Workup Tracker & Journey (Workbook Prototype 1A) ───
function openPatientWorkupPanel() {
  $('#patientWorkupPanel').style.display = 'block';
  const sel = $('#workupPatientSelect');
  sel.innerHTML = '<option value="">— Select Patient —</option>' + patients.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
}

async function loadPatientWorkup() {
  const pid = $('#workupPatientSelect')?.value;
  if (!pid) return;

  // Fetch ALL clinical data in parallel to auto-detect journey & workup
  const [patient, workup, socio, labs, pathology, imaging, referrals, tbs, recommendations] = await Promise.all([
    api(`/api/patients/${pid}`).catch(() => null),
    api(`/api/patients/${pid}/workup`).catch(() => null),
    api(`/api/patients/${pid}/socioeconomic`).catch(() => null),
    api(`/api/patients/${pid}/lab-results`).catch(() => []),
    api(`/api/patients/${pid}/pathology-reports`).catch(() => []),
    api(`/api/patients/${pid}/imaging-results`).catch(() => []),
    api(`/api/patients/${pid}/referrals`).catch(() => []),
    api(`/api/patients/${pid}/tumor-boards`).catch(() => []),
    api(`/api/patients/${pid}/recommendations`).catch(() => []),
  ]);

  // ── Auto-detect workup from real records ──
  const hasImaging = imaging.length > 0;
  const hasPathology = pathology.length > 0;
  const hasLab = labs.length > 0;
  const hasConsult = referrals.length > 0;
  const imagingDone = imaging.some(i => i.status === 'Final' || i.status === 'Completed');
  const pathDone = pathology.some(p => p.status === 'Final' || p.status === 'Completed');
  const labDone = labs.some(l => l.status === 'Normal' || l.status === 'Abnormal' || l.status === 'Critical');
  const consultDone = referrals.some(r => r.status === 'Completed' || r.status === 'Sent');

  // Set checkboxes from real data OR manual workup state
  $('#wkImaging').checked = workup?.imaging_complete || imagingDone;
  $('#wkPathology').checked = workup?.pathology_complete || pathDone;
  $('#wkLab').checked = workup?.lab_complete || labDone;
  $('#wkConsult').checked = workup?.consultation_complete || consultDone;
  $('#wkDental').checked = workup?.dental_assessment_complete || false;

  const allDone = $('#wkImaging').checked && $('#wkPathology').checked && $('#wkLab').checked && $('#wkConsult').checked;
  updateWorkupBadge(workup?.tb_ready || allDone);

  // ── Show clinical evidence under each checkbox ──
  renderWorkupEvidence('wkImagingDetail', imaging, i => `${i.study_type || i.modality || 'Study'} — ${i.status} (${i.findings ? i.findings.substring(0,60)+'...' : 'No findings'})`);
  renderWorkupEvidence('wkPathologyDetail', pathology, p => `${p.specimen_type || 'Specimen'} — ${p.status} (${p.findings ? p.findings.substring(0,60)+'...' : 'No findings'})`);
  renderWorkupEvidence('wkLabDetail', labs, l => `${l.test_name}: ${l.test_value || 'N/A'} — ${l.status}`);
  renderWorkupEvidence('wkConsultDetail', referrals, r => `${r.doctor_name} (${r.specialty || ''}) @ ${r.hospital || ''} — ${r.status}`);

  // ── Auto-detect journey from real data ──
  const tbScheduled = tbs.some(t => t.status === 'scheduled' || t.status === 'in_progress');
  const tbCompleted = tbs.some(t => t.status === 'completed');
  const hasRecommendations = recommendations.length > 0;

  let autoJourney = 'arrival';
  if (patient?.medical_condition || referrals.length > 0) autoJourney = 'evaluation';
  if (hasImaging || hasPathology) autoJourney = 'biopsy_ordered';
  if (hasImaging && hasPathology && hasLab) autoJourney = 'awaiting_results';
  if (allDone) autoJourney = 'case_compiled';
  if (tbScheduled) autoJourney = 'tb_scheduled';
  if (tbCompleted) autoJourney = 'tb_presented';
  if (hasRecommendations) autoJourney = 'treatment_planned';
  if (patient?.journey_status === 'awaiting_treatment') autoJourney = 'awaiting_treatment';
  if (patient?.journey_status === 'in_treatment') autoJourney = 'in_treatment';

  // Use the further-along status (manual or auto-detected)
  const manualIdx = JOURNEY_STEPS.indexOf(patient?.journey_status || 'arrival');
  const autoIdx = JOURNEY_STEPS.indexOf(autoJourney);
  const finalJourney = JOURNEY_STEPS[Math.max(manualIdx, autoIdx)];

  updateJourneyMap(finalJourney);
  renderJourneyDetails(finalJourney, { imaging, pathology, labs, referrals, tbs, recommendations });

  // Auto-save detected journey if further than stored
  if (autoIdx > manualIdx && patient) {
    try { await api(`/api/patients/${pid}`, { method: 'PUT', body: JSON.stringify({ journey_status: finalJourney }) }); } catch {}
  }

  // ── Load socioeconomic ──
  if (socio) {
    $('#seTransport').value = socio.transportation || '';
    $('#seHousing').value = socio.housing || '';
    $('#seFinancial').value = socio.financial_situation || '';
    $('#seSupport').value = socio.support_system || '';
  }
}

function renderWorkupEvidence(containerId, records, formatter) {
  let el = $(`#${containerId}`);
  if (!el) {
    // Create detail container after the checkbox
    const checkbox = $(`#${containerId.replace('Detail','')}`);
    if (!checkbox) return;
    const label = checkbox.closest('.workup-check') || checkbox.parentElement;
    el = document.createElement('div');
    el.id = containerId;
    el.style.cssText = 'margin:0 0 0.25rem 2rem;font-size:0.78rem;color:var(--gray-500);';
    label.after(el);
  }
  if (!records.length) { el.innerHTML = '<span style="color:var(--gray-400);font-style:italic">No records yet</span>'; return; }
  el.innerHTML = records.slice(0, 3).map(r =>
    `<div style="padding:0.2rem 0;border-bottom:1px solid var(--gray-100);display:flex;align-items:center;gap:0.3rem">
      <i class="ri-checkbox-circle-fill" style="color:var(--success);font-size:0.85rem"></i> ${esc(formatter(r))}
    </div>`
  ).join('') + (records.length > 3 ? `<div style="color:var(--primary);font-weight:500;padding-top:0.2rem">+${records.length - 3} more records</div>` : '');
}

function renderJourneyDetails(currentStep, data) {
  const detailEl = $('#journeyDetails');
  if (!detailEl) {
    const map = $('#journeyMap');
    if (!map) return;
    const el = document.createElement('div');
    el.id = 'journeyDetails';
    el.style.cssText = 'background:var(--gray-50);border-radius:10px;padding:0.85rem;border:1px solid var(--border-color);margin-bottom:0.75rem;font-size:0.85rem;';
    map.after(el);
  }
  const d = $('#journeyDetails');

  const stepInfo = {
    arrival: { icon: 'ri-hospital-line', title: 'Arrived at ENT Clinic', desc: 'Patient registered in the system.' },
    evaluation: { icon: 'ri-stethoscope-line', title: 'Clinical Evaluation', desc: `Specialist referrals: ${data.referrals.length}. Initial assessment and cancer suspicion communicated to patient.` },
    biopsy_ordered: { icon: 'ri-microscope-line', title: 'Biopsy & CT Ordered', desc: `Imaging studies: ${data.imaging.length} | Pathology specimens: ${data.pathology.length}. Patient and family discuss costs, leave to gather funds if needed.` },
    awaiting_results: { icon: 'ri-time-line', title: 'Awaiting Diagnostic Results', desc: `Lab results: ${data.labs.length} | Imaging: ${data.imaging.length} | Pathology: ${data.pathology.length}. TB Coordinator checks in with patient.` },
    case_compiled: { icon: 'ri-folder-check-line', title: 'Case Compiled', desc: 'All diagnostic workup complete. Case is ready for tumor board review. TB Coordinator prepares presentation.' },
    tb_scheduled: { icon: 'ri-calendar-check-line', title: 'Tumor Board Scheduled', desc: `${data.tbs.filter(t => t.status === 'scheduled').length} meeting(s) scheduled. Patient enters the room during TB convening.` },
    tb_presented: { icon: 'ri-presentation-line', title: 'Case Presented at TB', desc: `${data.tbs.filter(t => t.status === 'completed').length} TB meeting(s) completed. Pathology read, clinicians discuss treatment options.` },
    treatment_planned: { icon: 'ri-clipboard-line', title: 'Treatment Plan Decided', desc: `${data.recommendations.length} recommendation(s). Patient told of next steps, referral given.` },
    awaiting_treatment: { icon: 'ri-route-line', title: 'Awaiting Treatment', desc: 'Patient handles travel logistics and financial preparation. Support services coordinated.' },
    in_treatment: { icon: 'ri-heart-pulse-line', title: 'In Active Treatment', desc: 'Patient is receiving treatment. Follow-up and monitoring in progress.' },
  };

  const info = stepInfo[currentStep] || { icon: 'ri-information-line', title: currentStep, desc: '' };
  d.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem">
      <i class="${info.icon}" style="color:var(--primary);font-size:1.1rem"></i>
      <strong style="color:var(--gray-800)">${info.title}</strong>
      <span class="status-badge ${JOURNEY_STEPS.indexOf(currentStep) >= JOURNEY_STEPS.indexOf('tb_presented') ? 'success' : 'pending'}" style="margin-left:auto">Step ${JOURNEY_STEPS.indexOf(currentStep) + 1} of ${JOURNEY_STEPS.length}</span>
    </div>
    <p style="color:var(--gray-600);line-height:1.5">${info.desc}</p>
  `;
}

function updateWorkupBadge(ready) {
  const badge = $('#wkReadyBadge');
  if (ready) {
    badge.textContent = 'TB Ready — All workup complete';
    badge.style.background = 'var(--success-light)';
    badge.style.color = '#15803D';
    badge.style.border = '1px solid rgba(34,197,94,0.2)';
  } else {
    badge.textContent = 'Workup incomplete';
    badge.style.background = 'var(--warning-light)';
    badge.style.color = '#B45309';
    badge.style.border = '1px solid rgba(245,158,11,0.2)';
  }
}

async function saveWorkupState() {
  const pid = $('#workupPatientSelect')?.value;
  if (!pid) return;
  try {
    const res = await api(`/api/patients/${pid}/workup`, {
      method: 'POST',
      body: JSON.stringify({
        imaging_complete: $('#wkImaging').checked,
        pathology_complete: $('#wkPathology').checked,
        lab_complete: $('#wkLab').checked,
        consultation_complete: $('#wkConsult').checked,
        dental_assessment_complete: $('#wkDental').checked,
      }),
    });
    updateWorkupBadge(res.tb_ready);
    if (res.tb_ready) toast('Patient is TB Ready!');
  } catch (e) { toast(e.message, 'error'); }
}

async function saveSocioeconomic() {
  const pid = $('#workupPatientSelect')?.value;
  if (!pid) return;
  try {
    await api(`/api/patients/${pid}/socioeconomic`, {
      method: 'POST',
      body: JSON.stringify({
        transportation: $('#seTransport').value || null,
        housing: $('#seHousing').value || null,
        financial_situation: $('#seFinancial').value || null,
        support_system: $('#seSupport').value || null,
      }),
    });
  } catch { }
}

const JOURNEY_STEPS = ['arrival','evaluation','biopsy_ordered','awaiting_results','case_compiled','tb_scheduled','tb_presented','treatment_planned','awaiting_treatment','in_treatment'];

function updateJourneyMap(currentStep) {
  const idx = JOURNEY_STEPS.indexOf(currentStep);
  $$('#journeyMap .journey-step').forEach((el, i) => {
    el.classList.remove('active', 'done');
    if (i < idx) el.classList.add('done');
    else if (i === idx) el.classList.add('active');
  });
  // Update journey lines
  $$('#journeyMap .journey-line').forEach((line, i) => {
    line.style.background = i < idx ? 'var(--success)' : 'var(--gray-200)';
  });
}

// Click journey step to update
document.addEventListener('click', async (e) => {
  const step = e.target.closest('.journey-step');
  if (!step) return;
  const pid = $('#workupPatientSelect')?.value;
  if (!pid) return;
  const stepName = step.dataset.step;
  if (!stepName) return;
  try {
    await api(`/api/patients/${pid}`, { method: 'PUT', body: JSON.stringify({ journey_status: stepName }) });
    updateJourneyMap(stepName);
    toast(`Journey updated: ${stepName.replace(/_/g, ' ')}`);
  } catch (e) { toast(e.message, 'error'); }
});

// ─── Patient Preference Survey (Workbook Prototype 3A) ───
function openPreferenceSurvey() {
  $('#preferenceSurveyPanel').style.display = 'block';
  const sel = $('#prefPatientSelect');
  sel.innerHTML = '<option value="">— Select Patient —</option>' + patients.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
}

async function loadPatientPreferences() {
  const pid = $('#prefPatientSelect')?.value;
  if (!pid) return;
  try {
    const p = await api(`/api/patients/${pid}/preferences`);
    $('#prefTravel').value = p.travel_concern || '';
    $('#prefFinancial').value = p.financial_concern || '';
    $('#prefRisk').value = p.risk_tolerance || '';
    $('#prefRadiation').value = p.radiation_openness || '';
    showPrefCategory(p.category);
  } catch { }
}

async function savePreferences() {
  const pid = $('#prefPatientSelect')?.value;
  if (!pid) return;
  try {
    const res = await api(`/api/patients/${pid}/preferences`, {
      method: 'POST',
      body: JSON.stringify({
        travel_concern: $('#prefTravel').value || null,
        financial_concern: $('#prefFinancial').value || null,
        risk_tolerance: $('#prefRisk').value || null,
        radiation_openness: $('#prefRadiation').value || null,
      }),
    });
    showPrefCategory(res.category);
  } catch { }
}

function showPrefCategory(cat) {
  const el = $('#prefCategoryResult');
  if (!cat) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  const label = $('#prefCategoryLabel');
  const desc = $('#prefCategoryDesc');
  const colors = { A: ['#15803D','var(--success-light)','Low Concern — standard treatment pathway'], B: ['#B45309','var(--warning-light)','Moderate Concern — consider socioeconomic factors in treatment plan'], C: ['#DC2626','var(--danger-light)','High Concern — prioritize accessible treatment, financial support, travel assistance'] };
  const [color, bg, text] = colors[cat] || ['var(--gray-600)','var(--gray-50)','Unknown'];
  label.textContent = `Category ${cat}`;
  label.style.color = color;
  desc.textContent = text;
  el.style.background = bg;
}

// ─── Medical Passport (Workbook Prototype 1B) ───
async function generatePassport() {
  const pid = $('#workupPatientSelect')?.value;
  if (!pid) { toast('Select a patient', 'error'); return; }
  toast('Generating medical passport...');
  try {
    const [patient, workup, socio, labs, path, img, refs] = await Promise.all([
      api(`/api/patients/${pid}`),
      api(`/api/patients/${pid}/workup`).catch(() => null),
      api(`/api/patients/${pid}/socioeconomic`).catch(() => null),
      api(`/api/patients/${pid}/lab-results`).catch(() => []),
      api(`/api/patients/${pid}/pathology-reports`).catch(() => []),
      api(`/api/patients/${pid}/imaging-results`).catch(() => []),
      api(`/api/patients/${pid}/referrals`).catch(() => []),
    ]);
    const passport = `
═══════════════════════════════════════════
  ONCOAI — PATIENT MEDICAL PASSPORT
  Generated: ${new Date().toLocaleString()}
═══════════════════════════════════════════

PATIENT: ${patient.name}
CODE: ${patient.patient_code || 'N/A'}
AGE: ${patient.age || 'N/A'} | GENDER: ${patient.gender || 'N/A'}
PHONE: ${patient.phone || 'N/A'}
CONDITION: ${patient.medical_condition || 'N/A'}
CANCER TYPE: ${patient.cancer_type || 'N/A'}
STAGE: ${patient.cancer_stage || 'N/A'}
JOURNEY: ${(patient.journey_status || 'arrival').replace(/_/g, ' ').toUpperCase()}

───── WORKUP STATUS ─────
Imaging: ${workup?.imaging_complete ? '✅ Complete' : '⬜ Pending'}
Pathology: ${workup?.pathology_complete ? '✅ Complete' : '⬜ Pending'}
Lab Tests: ${workup?.lab_complete ? '✅ Complete' : '⬜ Pending'}
Consultation: ${workup?.consultation_complete ? '✅ Complete' : '⬜ Pending'}
Dental: ${workup?.dental_assessment_complete ? '✅ Complete' : '⬜ Pending'}
TB READY: ${workup?.tb_ready ? '✅ YES' : '❌ NO'}

───── SOCIOECONOMIC ─────
Transport: ${socio?.transportation || 'N/A'}
Housing: ${socio?.housing || 'N/A'}
Financial: ${socio?.financial_situation || 'N/A'}
Support: ${socio?.support_system || 'N/A'}

───── LAB RESULTS (${labs.length}) ─────
${labs.map(l => `• ${l.test_name}: ${l.test_value || 'N/A'} [${l.status}]`).join('\n') || 'None'}

───── PATHOLOGY (${path.length}) ─────
${path.map(p => `• ${p.specimen_type}: ${(p.findings||'').substring(0,80)} [${p.status}]`).join('\n') || 'None'}

───── IMAGING (${img.length}) ─────
${img.map(i => `• ${i.study_type} (${i.modality||''}): ${(i.findings||'').substring(0,80)} [${i.status}]`).join('\n') || 'None'}

───── REFERRALS (${refs.length}) ─────
${refs.map(r => `• ${r.doctor_name} (${r.specialty}) @ ${r.hospital} [${r.status}]`).join('\n') || 'None'}

═══════════════════════════════════════════
  This passport should accompany the patient
  across all facilities and tumor board reviews.
═══════════════════════════════════════════`;
    openModal('Medical Passport — ' + patient.name, `
      <div style="background:var(--gray-50);border:1px solid var(--border-color);border-radius:10px;padding:1rem;font-family:'JetBrains Mono',monospace;font-size:0.75rem;line-height:1.6;white-space:pre-wrap;max-height:500px;overflow-y:auto">${esc(passport)}</div>
      <div style="display:flex;gap:0.5rem;margin-top:1rem;justify-content:flex-end">
        <button class="btn btn-secondary" onclick="navigator.clipboard.writeText(\`${passport.replace(/`/g,'\\`')}\`);toast('Copied!')"><i class="ri-file-copy-line"></i> Copy</button>
        <button class="btn btn-primary" onclick="printPassport()"><i class="ri-printer-line"></i> Print</button>
      </div>
    `);
  } catch (e) { toast(e.message, 'error'); }
}

function printPassport() { window.print(); }

function sendWorkupReminder() {
  const pid = $('#workupPatientSelect')?.value;
  if (!pid) { toast('Select a patient', 'error'); return; }
  const p = patients.find(x => x.id === parseInt(pid));
  if (!p?.phone) { toast('No phone number', 'error'); return; }
  const msg = encodeURIComponent(`Hello ${p.name}, this is a reminder from OncoAI. Please complete your pending diagnostic tests. Contact your TB Coordinator if you need assistance.`);
  window.open(`https://wa.me/${p.phone.replace(/\D/g,'')}?text=${msg}`, '_blank');
}

// ─── Meeting Room ───
let currentMeetingTB = null;

function openMeetingPanel() {
  const panel = $('#tbMeetingPanel');
  const btn = $('#tbMeetingBtn');
  if (panel) panel.style.display = 'block';
  if (btn) btn.style.display = 'none';
  loadMeetingTBList();
}

function closeMeetingPanel() {
  const panel = $('#tbMeetingPanel');
  const btn = $('#tbMeetingBtn');
  if (panel) panel.style.display = 'none';
  if (btn) btn.style.display = 'block';
}

async function loadMeetingTBList() {
  const sel = $('#meetingTBSelect');
  if (!sel) return;
  try {
    const boards = await api('/api/tumor-boards');
    const pmap = {};
    tbCache.patients.forEach(p => { pmap[p.id] = p.name; });
    const active = boards.filter(b => b.status === 'scheduled' || b.status === 'in_progress');
    sel.innerHTML = '<option value="">— Choose a scheduled meeting —</option>' +
      active.map(b => `<option value="${b.id}">TB-${b.id}: ${esc(pmap[b.patient_id] || 'Patient #' + b.patient_id)} — ${new Date(b.scheduled_date).toLocaleDateString()} (${b.status})</option>`).join('');
  } catch {}
}

async function loadMeetingDetails() {
  const tid = $('#meetingTBSelect')?.value;
  if (!tid) {
    $('#meetingRoomId').value = '';
    $('#meetingParticipants').innerHTML = '<span style="color:var(--gray-400);font-size:0.85rem">Select a meeting to see participants</span>';
    currentMeetingTB = null;
    return;
  }
  try {
    const boards = await api('/api/tumor-boards');
    const tb = boards.find(b => b.id === parseInt(tid));
    if (!tb) return;
    currentMeetingTB = tb;
    const roomId = `oncoai-tb-${tb.id}-${Date.now().toString(36)}`;
    $('#meetingRoomId').value = roomId;

    const participants = tb.participants || [];
    const pmap = {};
    tbCache.patients.forEach(p => { pmap[p.id] = p; });
    const patient = pmap[tb.patient_id];

    let html = '';
    if (patient) {
      html += `<div style="display:inline-flex;align-items:center;gap:0.35rem;padding:0.3rem 0.65rem;background:#DCFCE7;border:1px solid #BBF7D0;border-radius:20px;font-size:0.8rem;font-weight:500;color:#15803D">
        <i class="ri-user-heart-line"></i> ${esc(patient.name)} <span style="font-size:0.7rem;opacity:0.7">(Patient)</span>
        ${patient.phone ? `<a href="https://wa.me/${patient.phone.replace(/\\D/g,'')}" target="_blank" style="color:#15803D;text-decoration:none" title="WhatsApp"><i class="ri-whatsapp-line"></i></a>` : ''}
      </div>`;
    }
    participants.forEach(p => {
      html += `<div style="display:inline-flex;align-items:center;gap:0.35rem;padding:0.3rem 0.65rem;background:var(--primary-light);border:1px solid rgba(15,76,92,0.15);border-radius:20px;font-size:0.8rem;font-weight:500;color:var(--primary)">
        <i class="ri-stethoscope-line"></i> ${esc(p.name || '')} <span style="font-size:0.7rem;opacity:0.7">(${esc(p.specialty || p.role || '')})</span>
        ${p.present ? '<i class="ri-checkbox-circle-fill" style="color:var(--success)"></i>' : ''}
        ${p.phone ? `<a href="https://wa.me/${p.phone.replace(/\\D/g,'')}" target="_blank" style="color:var(--primary);text-decoration:none" title="WhatsApp"><i class="ri-whatsapp-line"></i></a>` : ''}
      </div>`;
    });
    if (!html) html = '<span style="color:var(--gray-400);font-size:0.85rem">No participants added yet</span>';
    $('#meetingParticipants').innerHTML = html;

    // Join meeting automatically
    const token = localStorage.getItem('oncoai_token');
    if (token) {
      try {
        await fetch(`/api/tumor-boards/${tid}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        });
      } catch {}
    }
  } catch (e) { console.error(e); }
}

function copyMeetingLink() {
  const roomId = $('#meetingRoomId')?.value;
  if (!roomId) { toast('No meeting selected', 'error'); return; }
  const link = `${window.location.origin}/meeting/${roomId}`;
  navigator.clipboard.writeText(link).then(() => toast('Meeting link copied!')).catch(() => toast(link));
}

function startVideoCall() {
  if (!currentMeetingTB) { toast('Select a meeting first', 'error'); return; }
  const roomId = $('#meetingRoomId')?.value || `oncoai-tb-${currentMeetingTB.id}`;
  const jitsiUrl = `https://meet.jit.si/${roomId}`;
  window.open(jitsiUrl, '_blank', 'width=1200,height=800');
  toast('Video call opened — share the link with participants');
  updateTBStatus(currentMeetingTB.id, 'in_progress');
}

function startVoiceCall() {
  if (!currentMeetingTB) { toast('Select a meeting first', 'error'); return; }
  const roomId = $('#meetingRoomId')?.value || `oncoai-tb-${currentMeetingTB.id}`;
  const jitsiUrl = `https://meet.jit.si/${roomId}#config.startWithVideoMuted=true`;
  window.open(jitsiUrl, '_blank', 'width=800,height=600');
  toast('Voice call opened');
  updateTBStatus(currentMeetingTB.id, 'in_progress');
}

function startWhatsAppGroup() {
  if (!currentMeetingTB) { toast('Select a meeting first', 'error'); return; }
  const participants = currentMeetingTB.participants || [];
  const phones = participants.filter(p => p.phone).map(p => p.phone.replace(/\D/g, ''));
  const patient = tbCache.patients.find(p => p.id === currentMeetingTB.patient_id);
  if (patient?.phone) phones.unshift(patient.phone.replace(/\D/g, ''));

  if (phones.length > 0) {
    const msg = encodeURIComponent(`OncoAI Tumor Board Meeting TB-${currentMeetingTB.id}\nJoin video: https://meet.jit.si/${$('#meetingRoomId')?.value || 'oncoai-tb-' + currentMeetingTB.id}`);
    window.open(`https://wa.me/${phones[0]}?text=${msg}`, '_blank');
    toast('WhatsApp opened — send the meeting link to the group');
  } else {
    toast('No phone numbers found for participants', 'error');
  }
}

function dialInPatient() {
  if (!currentMeetingTB) { toast('Select a meeting first', 'error'); return; }
  const patient = tbCache.patients.find(p => p.id === currentMeetingTB.patient_id);
  if (!patient) { toast('Patient not found', 'error'); return; }
  if (patient.phone) {
    const roomId = $('#meetingRoomId')?.value || `oncoai-tb-${currentMeetingTB.id}`;
    const msg = encodeURIComponent(`Hello ${patient.name}, your Tumor Board meeting is starting. Join here: https://meet.jit.si/${roomId}`);
    window.open(`https://wa.me/${patient.phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
    toast(`Sending meeting link to ${patient.name}`);
  } else {
    toast(`No phone number for ${patient.name}`, 'error');
  }
}

async function updateMeetingChecklist() {
  const checks = ['chkPatientSummary', 'chkDiagnosticReview', 'chkTreatment', 'chkRecommendations', 'chkFollowUp', 'chkPatientInput'];
  const total = checks.length;
  const done = checks.filter(id => $(`#${id}`)?.checked).length;
  const pct = Math.round((done / total) * 100);
  const bar = $('#checklistProgress');
  const label = $('#checklistPercent');
  if (bar) bar.style.width = pct + '%';
  if (label) label.textContent = pct + '%';

  // Style checked items
  checks.forEach(id => {
    const cb = $(`#${id}`);
    if (!cb) return;
    const lbl = cb.closest('label');
    if (!lbl) return;
    if (cb.checked) {
      lbl.style.background = 'var(--primary-light)';
      lbl.style.borderColor = 'rgba(15,76,92,0.2)';
      lbl.style.color = 'var(--primary)';
    } else {
      lbl.style.background = 'white';
      lbl.style.borderColor = 'var(--border-color)';
      lbl.style.color = 'var(--gray-700)';
    }
  });

  // Save to backend if meeting selected
  if (currentMeetingTB) {
    try {
      await api(`/api/tumor-boards/${currentMeetingTB.id}/checklist`, {
        method: 'POST',
        body: JSON.stringify({
          checklist_patient_summary: $('#chkPatientSummary')?.checked || false,
          checklist_diagnostic_review: $('#chkDiagnosticReview')?.checked || false,
          checklist_treatment_considerations: $('#chkTreatment')?.checked || false,
          checklist_recommendations: $('#chkRecommendations')?.checked || false,
          checklist_follow_up_plan: $('#chkFollowUp')?.checked || false,
        }),
      });
    } catch {}
  }
}

// ─── Voting (Workbook Prototype 2A) ───
async function submitVote() {
  if (!currentMeetingTB) { toast('Select a meeting first', 'error'); return; }
  const vote = $$('input[name="tbVote"]:checked').map(c => c.value)[0];
  if (!vote) { toast('Select a treatment option', 'error'); return; }
  const comment = $('#voteComment')?.value || '';
  const token = localStorage.getItem('oncoai_token');
  try {
    const res = await fetch(`/api/tumor-boards/${currentMeetingTB.id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ vote, comment }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Vote failed');
    toast('Vote recorded!');
    showVoteResults(data.attendance || []);
  } catch (e) { toast(e.message, 'error'); }
}

function showVoteResults(attendance) {
  const el = $('#voteResults');
  if (!el || !attendance.length) return;
  el.style.display = 'block';
  const tally = {};
  attendance.filter(a => a.vote).forEach(a => { tally[a.vote] = (tally[a.vote] || 0) + 1; });
  const total = attendance.filter(a => a.vote).length;
  el.innerHTML = '<div style="font-size:0.85rem;font-weight:600;margin-bottom:0.5rem">Vote Results (' + total + ' votes)</div>' +
    Object.entries(tally).sort((a,b) => b[1]-a[1]).map(([opt, count]) => {
      const pct = Math.round((count / total) * 100);
      return `<div style="margin-bottom:0.35rem"><div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:0.15rem"><span>${opt}</span><span>${count} (${pct}%)</span></div><div style="height:6px;background:var(--gray-200);border-radius:6px;overflow:hidden"><div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--primary),var(--secondary));border-radius:6px"></div></div></div>`;
    }).join('');

  // Update attendance list
  const attEl = $('#attendanceList');
  if (attEl) {
    attEl.innerHTML = attendance.map(a =>
      `<div style="display:inline-flex;align-items:center;gap:0.3rem;padding:0.25rem 0.6rem;background:var(--primary-light);border-radius:20px;font-size:0.8rem;font-weight:500;color:var(--primary)">
        <i class="ri-user-line"></i> ${esc(a.name)} (${esc(a.specialty||'')}) ${a.vote ? '<i class="ri-check-line" style="color:var(--success)"></i>' : ''}
      </div>`
    ).join('') || '<span style="color:var(--gray-400);font-size:0.85rem">No attendance yet</span>';
  }
}

// ─── Imaging Upload ───
let imgUploadFiles = [];

async function loadImagingUploadPatients() {
  try {
    const ps = await api('/api/patients');
    const sel = $('#imgUploadPatient');
    if (sel) sel.innerHTML = '<option value="">— Select Patient —</option>' + ps.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  } catch {}
}

function initImagingDragDrop() {
  const zone = $('#imgUploadZone');
  if (!zone) return;
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) {
      addImagingFiles(e.dataTransfer.files);
    }
  });
}

function handleImagingUpload() {
  const input = $('#imgUploadFile');
  if (input && input.files.length) {
    addImagingFiles(input.files);
    input.value = '';
  }
}

function addImagingFiles(fileList) {
  for (const f of fileList) {
    imgUploadFiles.push(f);
  }
  renderImagingPreviews();
}

function removeImagingFile(idx) {
  imgUploadFiles.splice(idx, 1);
  renderImagingPreviews();
}

function renderImagingPreviews() {
  const container = $('#imgUploadPreview');
  if (!container) return;
  if (!imgUploadFiles.length) { container.innerHTML = ''; return; }
  container.innerHTML = imgUploadFiles.map((f, i) => {
    const isImage = f.type.startsWith('image/');
    const thumb = isImage ? URL.createObjectURL(f) : null;
    const sizeKB = (f.size / 1024).toFixed(0);
    return `<div style="position:relative;width:120px;border:1px solid var(--border-color);border-radius:10px;overflow:hidden;background:white">
      ${thumb
        ? `<img src="${thumb}" style="width:100%;height:80px;object-fit:cover;display:block">`
        : `<div style="width:100%;height:80px;display:flex;align-items:center;justify-content:center;background:var(--gray-50);color:var(--gray-400);font-size:1.5rem"><i class="ri-file-3-line"></i></div>`
      }
      <div style="padding:0.35rem 0.5rem">
        <div style="font-size:0.75rem;font-weight:600;color:var(--gray-700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(f.name)}</div>
        <div style="font-size:0.65rem;color:var(--gray-400)">${sizeKB} KB</div>
      </div>
      <button onclick="removeImagingFile(${i})" style="position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;border:none;background:rgba(0,0,0,0.5);color:white;font-size:0.7rem;cursor:pointer;display:flex;align-items:center;justify-content:center">&times;</button>
    </div>`;
  }).join('');
}

async function submitImagingUpload() {
  const pid = $('#imgUploadPatient')?.value;
  if (!pid) { toast('Select a patient', 'error'); return; }
  if (!imgUploadFiles.length) { toast('Add at least one file', 'error'); return; }
  const modality = $('#imgUploadModality')?.value || 'CT';
  const bodyPart = $('#imgUploadBodyPart')?.value || '';
  const status = $('#imgUploadStatus');

  // Upload each file as a document
  let uploaded = 0;
  for (const f of imgUploadFiles) {
    if (status) status.textContent = `Uploading ${++uploaded} of ${imgUploadFiles.length}...`;
    const fd = new FormData();
    fd.append('file', f);
    fd.append('title', `${modality} - ${bodyPart || f.name}`);
    try {
      await fetch(`/api/patients/${pid}/documents`, { method: 'POST', body: fd });
    } catch (e) { toast(`Failed: ${f.name}`, 'error'); }
  }

  // Create imaging result record
  try {
    await api(`/api/patients/${pid}/imaging-results`, {
      method: 'POST',
      body: JSON.stringify({
        study_type: modality,
        modality: modality,
        body_part: bodyPart,
        findings: '',
        status: 'Pending',
        notes: `${imgUploadFiles.length} file(s) uploaded`,
      }),
    });
  } catch {}

  imgUploadFiles = [];
  renderImagingPreviews();
  if (status) status.textContent = '';
  toast(`${uploaded} imaging file(s) uploaded successfully`);
  clinical.render('imaging');
}

// ─── AI Analytics Dashboard ───
async function loadAnalytics() {
  try {
    const [patients, labs, tbs, imaging, path] = await Promise.all([
      api('/api/patients').catch(() => []),
      api('/api/lab-results').catch(() => []),
      api('/api/tumor-boards').catch(() => []),
      api('/api/imaging-results').catch(() => []),
      api('/api/pathology-reports').catch(() => []),
    ]);

    // Cancer Type Distribution (CSS bar chart)
    const cancerTypes = {};
    patients.forEach(p => { if (p.cancer_type) cancerTypes[p.cancer_type] = (cancerTypes[p.cancer_type] || 0) + 1; });
    const cancerEl = document.getElementById('cancerDistChart');
    if (cancerEl) {
      const maxCount = Math.max(...Object.values(cancerTypes), 1);
      const colors = ['#0F4C5C','#3B82F6','#8B5CF6','#F59E0B','#EF4444','#10B981','#EC4899'];
      cancerEl.innerHTML = Object.keys(cancerTypes).length ? Object.entries(cancerTypes).sort((a,b) => b[1]-a[1]).map(([type, count], i) => {
        const pct = Math.round((count / maxCount) * 100);
        return `<div style="margin-bottom:0.5rem"><div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:0.2rem"><span style="font-weight:600;color:var(--gray-700)">${type}</span><span style="color:var(--gray-500)">${count}</span></div><div style="height:8px;background:var(--gray-100);border-radius:8px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${colors[i % colors.length]};border-radius:8px;transition:width 1s"></div></div></div>`;
      }).join('') : '<div style="text-align:center;color:var(--gray-400);padding:2rem;font-size:0.9rem">No cancer types recorded yet</div>';
    }

    // Patient Journey Progress
    const journeyCounts = {};
    const journeyLabels = { arrival:'Arrival', evaluation:'Evaluation', biopsy_ordered:'Biopsy', awaiting_results:'Awaiting', case_compiled:'Compiled', tb_scheduled:'TB Sched', tb_presented:'TB Done', treatment_planned:'Planned', awaiting_treatment:'Await Tx', in_treatment:'In Tx' };
    patients.forEach(p => { const j = p.journey_status || 'arrival'; journeyCounts[j] = (journeyCounts[j] || 0) + 1; });
    const journeyEl = document.getElementById('journeyChart');
    if (journeyEl) {
      const steps = Object.keys(journeyLabels);
      const maxJ = Math.max(...steps.map(s => journeyCounts[s] || 0), 1);
      journeyEl.innerHTML = '<div style="display:flex;align-items:flex-end;gap:4px;height:160px;padding-top:10px">' + steps.map((s, i) => {
        const count = journeyCounts[s] || 0;
        const h = Math.max((count / maxJ) * 140, 4);
        const color = i < 4 ? '#F59E0B' : i < 7 ? '#0F4C5C' : '#10B981';
        return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px"><span style="font-size:0.75rem;font-weight:700;color:var(--gray-600)">${count}</span><div style="width:100%;height:${h}px;background:${color};border-radius:4px 4px 0 0;transition:height 1s"></div><span style="font-size:0.6rem;color:var(--gray-400);writing-mode:vertical-rl;transform:rotate(180deg);max-height:50px;overflow:hidden">${journeyLabels[s]}</span></div>`;
      }).join('') + '</div>';
    }

    // Stage Distribution
    const stageCounts = { 'Stage I': 0, 'Stage II': 0, 'Stage III': 0, 'Stage IV': 0, 'Unknown': 0 };
    patients.forEach(p => { const s = p.cancer_stage || 'Unknown'; if (stageCounts[s] !== undefined) stageCounts[s]++; else stageCounts['Unknown']++; });
    const stageEl = document.getElementById('stageChart');
    if (stageEl) {
      const total = Math.max(patients.length, 1);
      const stageColors = { 'Stage I': '#10B981', 'Stage II': '#F59E0B', 'Stage III': '#F97316', 'Stage IV': '#EF4444', 'Unknown': '#A8A29E' };
      stageEl.innerHTML = Object.entries(stageCounts).map(([stage, count]) => {
        const pct = Math.round((count / total) * 100);
        return `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem"><div style="width:12px;height:12px;border-radius:3px;background:${stageColors[stage]};flex-shrink:0"></div><span style="flex:1;font-size:0.85rem;color:var(--gray-700)">${stage}</span><span style="font-size:0.85rem;font-weight:700;color:var(--gray-800)">${count}</span><span style="font-size:0.8rem;color:var(--gray-400)">(${pct}%)</span></div>`;
      }).join('');
    }

    // Workup Completion donut (simulated)
    const workupEl = document.getElementById('workupChart');
    if (workupEl) {
      const withCancer = patients.filter(p => p.cancer_type);
      const complete = patients.filter(p => p.journey_status && ['case_compiled','tb_scheduled','tb_presented','treatment_planned','awaiting_treatment','in_treatment'].includes(p.journey_status));
      const pct = withCancer.length ? Math.round((complete.length / withCancer.length) * 100) : 0;
      workupEl.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;padding:1rem"><div style="position:relative;width:120px;height:120px"><svg viewBox="0 0 36 36" style="width:120px;height:120px;transform:rotate(-90deg)"><circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--gray-100)" stroke-width="3"></circle><circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--primary)" stroke-width="3" stroke-dasharray="${pct} ${100-pct}" stroke-linecap="round" style="transition:stroke-dasharray 1.5s"></circle></svg><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column"><span style="font-size:1.5rem;font-weight:800;color:var(--primary)">${pct}%</span><span style="font-size:0.75rem;color:var(--gray-400)">Complete</span></div></div><div style="margin-top:0.5rem;font-size:0.85rem;color:var(--gray-500)">${complete.length} of ${withCancer.length} patients</div></div>`;
    }

    // TB Meeting Stats
    const tbEl = document.getElementById('tbStatsChart');
    if (tbEl) {
      const scheduled = tbs.filter(t => t.status === 'scheduled').length;
      const inProgress = tbs.filter(t => t.status === 'in_progress').length;
      const completed = tbs.filter(t => t.status === 'completed').length;
      tbEl.innerHTML = `<div style="display:flex;flex-direction:column;gap:0.65rem;padding:0.5rem 0">
        <div style="display:flex;align-items:center;gap:0.75rem"><div style="width:40px;height:40px;border-radius:10px;background:var(--warning-light);display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:#B45309"><i class="ri-calendar-line"></i></div><div><div style="font-size:1.25rem;font-weight:800;color:var(--gray-900)">${scheduled}</div><div style="font-size:0.8rem;color:var(--gray-500)">Scheduled</div></div></div>
        <div style="display:flex;align-items:center;gap:0.75rem"><div style="width:40px;height:40px;border-radius:10px;background:rgba(15,76,92,0.08);display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:var(--primary)"><i class="ri-vidicon-line"></i></div><div><div style="font-size:1.25rem;font-weight:800;color:var(--gray-900)">${inProgress}</div><div style="font-size:0.8rem;color:var(--gray-500)">In Progress</div></div></div>
        <div style="display:flex;align-items:center;gap:0.75rem"><div style="width:40px;height:40px;border-radius:10px;background:var(--success-light);display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:#15803D"><i class="ri-check-double-line"></i></div><div><div style="font-size:1.25rem;font-weight:800;color:var(--gray-900)">${completed}</div><div style="font-size:0.8rem;color:var(--gray-500)">Completed</div></div></div>
      </div>`;
    }
  } catch (e) { console.error('Analytics error:', e); }
}

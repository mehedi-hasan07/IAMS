import { useEffect, useState } from 'react'
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import './DashboardPage.css'

function calcCompatibility(student, org) {
  const studentSkills = (student.skills ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  const orgSkills = (org.requiredSkills ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  if (studentSkills.length === 0 || orgSkills.length === 0) return 0
  const shared = studentSkills.filter((sk) => orgSkills.includes(sk))
  return Math.round((shared.length / orgSkills.length) * 100)
}

export default function MatchingPage() {
  const [students, setStudents] = useState([])
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [error, setError] = useState('')

  async function loadData() {
    setLoading(true)
    try {
      const [studSnap, orgSnap] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'organisations')),
      ])
      const allStudents = studSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
      const allOrgs = orgSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setStudents(allStudents.filter((s) => s.status !== 'matched'))
      setOrgs(allOrgs.filter((o) => (o.availableSlots ?? 0) > 0))
    } catch (err) {
      console.error(err)
      setError('Failed to load data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  function handleSelectStudent(student) {
    setSelectedStudent((prev) => (prev?.id === student.id ? null : student))
    setSelectedOrg(null)
    setSuccessMsg('')
  }

  function handleSelectOrg(org) {
    if (!selectedStudent) return
    setSelectedOrg((prev) => (prev?.id === org.id ? null : org))
  }

  async function handleConfirmMatch() {
    if (!selectedStudent || !selectedOrg) return
    setError('')
    try {
      await updateDoc(doc(db, 'students', selectedStudent.id), {
        status: 'matched',
        matchedOrgId: selectedOrg.id,
        matchedOrgName: selectedOrg.orgName,
      })
      await updateDoc(doc(db, 'organisations', selectedOrg.id), {
        availableSlots: selectedOrg.availableSlots - 1,
      })
      setSuccessMsg(`${selectedStudent.firstName} ${selectedStudent.lastName} matched with ${selectedOrg.orgName}!`)
      setSelectedStudent(null)
      setSelectedOrg(null)
      await loadData()
    } catch (err) {
      console.error(err)
      setError('Failed to confirm match. Please try again.')
    }
  }

  const sortedOrgs = selectedStudent
    ? [...orgs].sort((a, b) => calcCompatibility(selectedStudent, b) - calcCompatibility(selectedStudent, a))
    : orgs

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Matching</h2>
          <p className="page-sub">Assign unmatched students to available organisations</p>
        </div>
      </div>

      {successMsg && <div className="alert-success" style={{ marginBottom: '1rem' }}>{successMsg}</div>}
      {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {loading ? (
        <div className="empty-state"><p className="empty-text">Loading data…</p></div>
      ) : (
        <>
          <div className="match-layout">
            {/* Left Panel: Unmatched Students */}
            <div className="match-panel">
              <div className="match-panel-header">
                <span className="match-panel-title">Unmatched Students</span>
                <span className="badge badge--default">{students.length}</span>
              </div>
              {students.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎉</div>
                  <p className="empty-text">All students are matched!</p>
                </div>
              ) : (
                students.map((s) => (
                  <div
                    key={s.id}
                    className={`match-item${selectedStudent?.id === s.id ? ' selected' : ''}`}
                    onClick={() => handleSelectStudent(s)}
                  >
                    <div className="match-name">{s.firstName} {s.lastName}</div>
                    <div className="match-meta">
                      {s.studentId && <span>{s.studentId}</span>}
                      {s.location && <span> · {s.location}</span>}
                    </div>
                    {s.skills && (
                      <div style={{ marginTop: '0.25rem' }}>
                        {s.skills.split(',').map((sk) => (
                          <span key={sk} className="tag">{sk.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Right Panel: Available Organisations */}
            <div className="match-panel">
              <div className="match-panel-header">
                <span className="match-panel-title">Available Organisations</span>
                <span className="badge badge--default">{orgs.length}</span>
              </div>
              {!selectedStudent && (
                <p className="muted" style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
                  Select a student on the left to see compatibility scores.
                </p>
              )}
              {orgs.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🏢</div>
                  <p className="empty-text">No organisations with available slots.</p>
                </div>
              ) : (
                sortedOrgs.map((o) => {
                  const score = selectedStudent ? calcCompatibility(selectedStudent, o) : null
                  const isCompatible = score !== null && score >= 50
                  const isSelected = selectedOrg?.id === o.id
                  const isDisabled = !selectedStudent

                  return (
                    <div
                      key={o.id}
                      className={`match-item${isSelected ? ' selected' : ''}${isCompatible ? ' compatible' : ''}${isDisabled ? ' disabled' : ''}`}
                      onClick={() => handleSelectOrg(o)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div className="match-name">{o.orgName}</div>
                        {score !== null && (
                          <span className={`compat-score ${score >= 50 ? 'compat-high' : 'compat-med'}`}>
                            {score}%
                          </span>
                        )}
                      </div>
                      <div className="match-meta">
                        {o.location && <span>{o.location}</span>}
                        {o.industry && <span> · {o.industry}</span>}
                        <span> · {o.availableSlots} slot{o.availableSlots !== 1 ? 's' : ''}</span>
                      </div>
                      {o.requiredSkills && (
                        <div style={{ marginTop: '0.25rem' }}>
                          {o.requiredSkills.split(',').map((sk) => (
                            <span key={sk} className="tag">{sk.trim()}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Confirm Match Box */}
          {selectedStudent && selectedOrg && (
            <div className="match-confirm-box">
              <div className="match-confirm-inner">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Confirm Match</div>
                  <div className="muted" style={{ fontSize: '0.875rem' }}>
                    Assign <strong>{selectedStudent.firstName} {selectedStudent.lastName}</strong> to{' '}
                    <strong>{selectedOrg.orgName}</strong>
                    {' '}({selectedOrg.availableSlots} slot{selectedOrg.availableSlots !== 1 ? 's' : ''} available)
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-primary-sm" onClick={handleConfirmMatch}>
                    Confirm Match
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => { setSelectedStudent(null); setSelectedOrg(null) }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

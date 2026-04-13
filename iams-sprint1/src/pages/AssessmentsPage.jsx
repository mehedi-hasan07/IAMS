import { useEffect, useState } from 'react'
import { collection, getDocs, setDoc, doc, query, where } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import './DashboardPage.css'

function calcGrade(total) {
  if (total >= 90) return 'A+'
  if (total >= 80) return 'A'
  if (total >= 70) return 'B'
  if (total >= 60) return 'C'
  if (total >= 50) return 'D'
  return 'F'
}

function gradeBadgeClass(grade) {
  if (grade === 'A+' || grade === 'A') return 'badge--success'
  if (grade === 'B') return 'badge--blue'
  if (grade === 'C') return 'badge--purple'
  if (grade === 'D') return 'badge--warn'
  return 'badge--danger'
}

export default function AssessmentsPage() {
  const [students, setStudents] = useState([])
  const [scores, setScores] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const studSnap = await getDocs(
          query(collection(db, 'students'), where('status', '==', 'matched'))
        )
        const matched = studSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setStudents(matched)

        const assessSnap = await getDocs(collection(db, 'assessments'))
        const assessMap = {}
        assessSnap.docs.forEach((d) => {
          assessMap[d.id] = d.data()
        })

        const initial = {}
        matched.forEach((s) => {
          const existing = assessMap[s.id] ?? {}
          initial[s.id] = {
            logbookScore: existing.logbookScore ?? '',
            supervisorScore: existing.supervisorScore ?? '',
            uniVisitScore: existing.uniVisitScore ?? '',
          }
        })
        setScores(initial)
      } catch (err) {
        console.error(err)
        setError('Failed to load assessment data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function handleScoreChange(studentId, field, value) {
    setScores((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }))
  }

  function getTotal(studentId) {
    const s = scores[studentId] ?? {}
    const lb = Number(s.logbookScore) || 0
    const sv = Number(s.supervisorScore) || 0
    const uv = Number(s.uniVisitScore) || 0
    return lb + sv + uv
  }

  async function handleSaveAll() {
    setSaving(true)
    setError('')
    setSuccessMsg('')
    try {
      await Promise.all(
        students.map((s) => {
          const sc = scores[s.id] ?? {}
          const total = getTotal(s.id)
          return setDoc(doc(db, 'assessments', s.id), {
            studentId: s.id,
            studentName: `${s.firstName} ${s.lastName}`,
            studentEmail: s.email ?? '',
            logbookScore: Number(sc.logbookScore) || 0,
            supervisorScore: Number(sc.supervisorScore) || 0,
            uniVisitScore: Number(sc.uniVisitScore) || 0,
            total,
            grade: calcGrade(total),
            updatedAt: new Date().toISOString(),
          })
        })
      )
      setSuccessMsg('All grades saved successfully!')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      console.error(err)
      setError('Failed to save grades. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Assessments</h2>
          <p className="page-sub">Record grades for matched students</p>
        </div>
        <button className="btn-primary-sm" onClick={handleSaveAll} disabled={saving || loading}>
          {saving ? 'Saving…' : 'Save All Grades'}
        </button>
      </div>

      {successMsg && <div className="alert-success" style={{ marginBottom: '1rem' }}>{successMsg}</div>}
      {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="card-p0">
        {loading ? (
          <div className="empty-state"><p className="empty-text">Loading students…</p></div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <p className="empty-text">No matched students found.</p>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Student</th>
                <th>Organisation</th>
                <th style={{ textAlign: 'center' }}>Logbook (/ 30)</th>
                <th style={{ textAlign: 'center' }}>Supervisor (/ 40)</th>
                <th style={{ textAlign: 'center' }}>Uni Visit (/ 30)</th>
                <th style={{ textAlign: 'center' }}>Total</th>
                <th style={{ textAlign: 'center' }}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const sc = scores[s.id] ?? {}
                const total = getTotal(s.id)
                const grade = calcGrade(total)
                const lbPct = Math.min(100, ((Number(sc.logbookScore) || 0) / 30) * 100)
                const svPct = Math.min(100, ((Number(sc.supervisorScore) || 0) / 40) * 100)
                const uvPct = Math.min(100, ((Number(sc.uniVisitScore) || 0) / 30) * 100)

                return (
                  <tr key={s.id}>
                    <td className="tbl-name">{s.firstName} {s.lastName}</td>
                    <td className="muted">{s.matchedOrgName ?? '—'}</td>

                    {/* Logbook Score */}
                    <td style={{ textAlign: 'center', minWidth: '100px' }}>
                      <input
                        className="grade-input"
                        type="number"
                        min="0"
                        max="30"
                        value={sc.logbookScore}
                        onChange={(e) => handleScoreChange(s.id, 'logbookScore', e.target.value)}
                        placeholder="0"
                      />
                      <div className="grade-bar">
                        <div className="grade-fill" style={{ width: `${lbPct}%` }} />
                      </div>
                    </td>

                    {/* Supervisor Score */}
                    <td style={{ textAlign: 'center', minWidth: '100px' }}>
                      <input
                        className="grade-input"
                        type="number"
                        min="0"
                        max="40"
                        value={sc.supervisorScore}
                        onChange={(e) => handleScoreChange(s.id, 'supervisorScore', e.target.value)}
                        placeholder="0"
                      />
                      <div className="grade-bar">
                        <div className="grade-fill" style={{ width: `${svPct}%` }} />
                      </div>
                    </td>

                    {/* Uni Visit Score */}
                    <td style={{ textAlign: 'center', minWidth: '100px' }}>
                      <input
                        className="grade-input"
                        type="number"
                        min="0"
                        max="30"
                        value={sc.uniVisitScore}
                        onChange={(e) => handleScoreChange(s.id, 'uniVisitScore', e.target.value)}
                        placeholder="0"
                      />
                      <div className="grade-bar">
                        <div className="grade-fill" style={{ width: `${uvPct}%` }} />
                      </div>
                    </td>

                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{total}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${gradeBadgeClass(grade)}`}>{grade}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && students.length > 0 && (
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={handleSaveAll} disabled={saving}>
            {saving ? 'Saving…' : 'Save All Grades'}
          </button>
        </div>
      )}
    </div>
  )
}

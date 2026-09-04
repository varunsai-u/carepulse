import './App.css'
import { useEffect, useState } from 'react'

function App() {
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patients, setPatients] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [vitals, setVitals] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [aiExplanation, setAiExplanation] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('severity')

  const [showAddPatient, setShowAddPatient] = useState(false)
  const [showAddVital, setShowAddVital] = useState(false)

  const [patientForm, setPatientForm] = useState({
    name: '',
    date_of_birth: '',
    gender: ''
  })

  const [vitalForm, setVitalForm] = useState({
    recorded_at: '',
    hba1c: '',
    systolic_bp: '',
    diastolic_bp: ''
  })

  useEffect(() => {
    loadPatients()
  }, [])

  function loadPatients() {
    fetch('http://localhost:8000/patients/summary')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to load patients')
        }

        return response.json()
      })
      .then((data) => {
        setPatients(data)
      })
      .catch((error) => {
        setError(error.message)
      })
  }

  function handleSelectPatient(patient) {
    setSelectedPatient(patient)
    setAnalysis(null)
    setVitals([])
    setAiExplanation(null)
    setAiError(null)
    setError(null)
    setLoading(true)

    Promise.all([
      fetch(`http://localhost:8000/patients/${patient.id}/analysis`),
      fetch(`http://localhost:8000/patients/${patient.id}/vitals`)
    ])
      .then(async ([analysisResponse, vitalsResponse]) => {
        if (!analysisResponse.ok) {
          throw new Error('No analysis available for this patient')
        }

        if (!vitalsResponse.ok) {
          throw new Error('Unable to load vital records')
        }

        const analysisData = await analysisResponse.json()
        const vitalsData = await vitalsResponse.json()

        return {
          analysisData,
          vitalsData
        }
      })
      .then(({ analysisData, vitalsData }) => {
        setAnalysis(analysisData)
        setVitals(vitalsData)
      })
      .catch((error) => {
        setError(error.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  function generateAIExplanation() {
    if (!selectedPatient) {
      return
    }

    setAiLoading(true)
    setAiExplanation(null)
    setAiError(null)

    fetch(
      `http://localhost:8000/patients/${selectedPatient.id}/ai-explanation`
    )
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => null)
          throw new Error(
            data?.detail || 'Unable to generate AI explanation'
          )
        }

        return response.json()
      })
      .then((data) => {
        setAiExplanation(data.ai_explanation)
      })
      .catch((error) => {
        setAiError(error.message)
      })
      .finally(() => {
        setAiLoading(false)
      })
  }

  function handlePatientFormChange(event) {
    setPatientForm({
      ...patientForm,
      [event.target.name]: event.target.value
    })
  }

  function handleVitalFormChange(event) {
    setVitalForm({
      ...vitalForm,
      [event.target.name]: event.target.value
    })
  }

  function handleAddPatient(event) {
    event.preventDefault()
    setError(null)

    fetch('http://localhost:8000/patients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(patientForm)
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to add patient')
        }

        return response.json()
      })
      .then(() => {
        setPatientForm({
          name: '',
          date_of_birth: '',
          gender: ''
        })

        setShowAddPatient(false)
        loadPatients()
      })
      .catch((error) => {
        setError(error.message)
      })
  }

  function handleAddVital(event) {
    event.preventDefault()
    setError(null)

    fetch(
      `http://localhost:8000/patients/${selectedPatient.id}/vitals`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recorded_at: vitalForm.recorded_at,
          hba1c: Number(vitalForm.hba1c),
          systolic_bp: Number(vitalForm.systolic_bp),
          diastolic_bp: Number(vitalForm.diastolic_bp)
        })
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to add vital record')
        }

        return response.json()
      })
      .then(() => {
        setVitalForm({
          recorded_at: '',
          hba1c: '',
          systolic_bp: '',
          diastolic_bp: ''
        })

        setShowAddVital(false)

        handleSelectPatient(selectedPatient)
        loadPatients()
      })
      .catch((error) => {
        setError(error.message)
      })
  }

  function handleDeletePatient(patient) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${patient.name}? This will also delete all vital records.`
    )

    if (!confirmed) {
      return
    }

    setError(null)

    fetch(`http://localhost:8000/patients/${patient.id}`, {
      method: 'DELETE'
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to delete patient')
        }

        return response.json()
      })
      .then(() => {
        if (selectedPatient?.id === patient.id) {
          setSelectedPatient(null)
          setAnalysis(null)
          setVitals([])
          setAiExplanation(null)
          setAiError(null)
        }

        loadPatients()
      })
      .catch((error) => {
        setError(error.message)
      })
  }

  const filteredPatients = patients
    .filter((patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'severity') {
        const severityOrder = {
          high: 3,
          medium: 2,
          low: 1,
          unknown: 0
        }

        return severityOrder[b.severity] - severityOrder[a.severity]
      }

      if (sortBy === 'score') {
        return b.score - a.score
      }

      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }

      return 0
    })

  return (
    <div className="app">

      <header className="header">
        <div>
          <div className="brand">
            <div className="brand-icon">✚</div>

            <div>
              <h1>CarePulse</h1>
              <p>AI-Powered Patient Health Monitoring</p>
            </div>
          </div>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowAddPatient(true)}
        >
          + Add Patient
        </button>
      </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <section className="patients-section">

        <div className="patients-toolbar">

          <div>
            <h2>Patient Overview</h2>
            <p className="section-subtitle">
              Monitor patient health trends and review priority
            </p>
          </div>

          <div className="controls">

            <div className="search-box">
              <span>⌕</span>

              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="severity">Severity</option>
              <option value="score">Score</option>
              <option value="name">Name</option>
            </select>

          </div>

        </div>

        <div className="patient-table-container">

          <table className="patient-table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Patient</th>
                <th>Gender</th>
                <th>Date of Birth</th>
                <th>Severity</th>
                <th>Score</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {filteredPatients.map((patient) => (
                <tr key={patient.id}>

                  <td className="patient-id">
                    #{patient.id}
                  </td>

                  <td>
                    <strong>{patient.name}</strong>
                  </td>

                  <td>{patient.gender}</td>

                  <td>{patient.date_of_birth}</td>

                  <td>
                    <span className={`severity ${patient.severity}`}>
                      <span className="severity-dot"></span>
                      {patient.severity.toUpperCase()}
                    </span>
                  </td>

                  <td>
                    <strong>{patient.score}</strong>
                  </td>

                  <td>
                    <div className="action-buttons">

                      <button
                        className="view-button"
                        onClick={() => handleSelectPatient(patient)}
                      >
                        View
                      </button>

                      <button
                        className="delete-button"
                        onClick={() => handleDeletePatient(patient)}
                      >
                        Delete
                      </button>

                    </div>
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

          {filteredPatients.length === 0 && (
            <div className="no-results">
              <p>No patients found.</p>
            </div>
          )}

        </div>

      </section>

      {selectedPatient && (
        <section className="patient-details">

          <div className="patient-header">

            <div>
              <span className="patient-label">
                PATIENT #{selectedPatient.id}
              </span>

              <h2>{selectedPatient.name}</h2>

              <p>
                {selectedPatient.gender} · DOB:{' '}
                {selectedPatient.date_of_birth}
              </p>
            </div>

            <button
              className="secondary-button"
              onClick={() => setShowAddVital(true)}
            >
              + Add Vital Record
            </button>

          </div>

          {loading && (
            <div className="status-message">
              <div className="loading-spinner"></div>
              <p>Loading patient data...</p>
            </div>
          )}

          {analysis && (
            <div className="analysis">

              <div className="priority-section">

                <div className="section-title">
                  <div>
                    <h3>Review Priority</h3>
                    <p>Rule-based patient review score</p>
                  </div>
                </div>

                <div className="priority-card">

                  <div className={`priority-icon ${analysis.priority.priority}`}>
                    !
                  </div>

                  <div className="priority-info">
                    <span>Priority Level</span>

                    <strong>
                      {analysis.priority.priority.toUpperCase()}
                    </strong>
                  </div>

                  <div className="priority-score">
                    <span>Priority Score</span>

                    <strong>
                      {analysis.priority.score}
                      <small>/100</small>
                    </strong>
                  </div>

                </div>

              </div>

              <div className="section">

                <div className="section-title">
                  <div>
                    <h3>Latest Measurements</h3>
                    <p>Most recent recorded values</p>
                  </div>
                </div>

                <div className="metrics">

                  <div className="metric-card metric-hba1c">
                    <span className="metric-icon">◉</span>

                    <div>
                      <span className="metric-label">
                        HbA1c
                      </span>

                      <strong>
                        {analysis.latest_values.hba1c}
                      </strong>
                    </div>
                  </div>

                  <div className="metric-card metric-systolic">
                    <span className="metric-icon">♥</span>

                    <div>
                      <span className="metric-label">
                        Systolic BP
                      </span>

                      <strong>
                        {analysis.latest_values.systolic_bp}
                      </strong>
                    </div>
                  </div>

                  <div className="metric-card metric-diastolic">
                    <span className="metric-icon">♥</span>

                    <div>
                      <span className="metric-label">
                        Diastolic BP
                      </span>

                      <strong>
                        {analysis.latest_values.diastolic_bp}
                      </strong>
                    </div>
                  </div>

                </div>

              </div>

              <div className="section">

                <div className="section-title">
                  <div>
                    <h3>Vital Trends</h3>
                    <p>Change from first recorded measurement</p>
                  </div>
                </div>

                <div className="trend-list">

                  <div className="trend-row">
                    <span>HbA1c</span>

                    <strong>
                      {analysis.analysis.hba1c.trend}
                    </strong>

                    <span>
                      Change: {analysis.analysis.hba1c.change}
                    </span>
                  </div>

                  <div className="trend-row">
                    <span>Systolic BP</span>

                    <strong>
                      {analysis.analysis.systolic_bp.trend}
                    </strong>

                    <span>
                      Change: {analysis.analysis.systolic_bp.change}
                    </span>
                  </div>

                  <div className="trend-row">
                    <span>Diastolic BP</span>

                    <strong>
                      {analysis.analysis.diastolic_bp.trend}
                    </strong>

                    <span>
                      Change: {analysis.analysis.diastolic_bp.change}
                    </span>
                  </div>

                </div>

              </div>

              <div className="section">

                <div className="section-title">
                  <div>
                    <h3>Vital History</h3>
                    <p>All recorded measurements</p>
                  </div>
                </div>

                <div className="vitals-table-container">

                  <table className="vitals-table">

                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>HbA1c</th>
                        <th>Systolic BP</th>
                        <th>Diastolic BP</th>
                      </tr>
                    </thead>

                    <tbody>
                      {vitals.map((vital) => (
                        <tr key={vital.id}>
                          <td>{vital.recorded_at}</td>
                          <td>{vital.hba1c}</td>
                          <td>{vital.systolic_bp}</td>
                          <td>{vital.diastolic_bp}</td>
                        </tr>
                      ))}
                    </tbody>

                  </table>

                </div>

              </div>

              <div className="section">

                <div className="section-title">
                  <div>
                    <h3>Priority Reasons</h3>
                    <p>Evidence contributing to the review score</p>
                  </div>
                </div>

                <ul className="reason-list">

                  {analysis.priority.reasons.map((reason) => (
                    <li key={reason}>
                      <span>✓</span>
                      {reason}
                    </li>
                  ))}

                </ul>

              </div>

              <div className="ai-section">

                <div className="ai-heading">
                  <span className="ai-icon">✦</span>

                  <div>
                    <h3>AI Explanation</h3>
                    <p>Evidence-based explanation generated by Azure OpenAI</p>
                  </div>
                </div>

                {!aiExplanation && !aiLoading && (
                  <button
                    className="primary-button"
                    onClick={generateAIExplanation}
                  >
                    ✦ Generate AI Explanation
                  </button>
                )}

                {aiLoading && (
                  <div className="status-message">
                    <div className="loading-spinner"></div>
                    <p>Generating AI explanation...</p>
                  </div>
                )}

                {aiError && (
                  <div className="error-message">
                    {aiError}
                  </div>
                )}

                {aiExplanation && (
                  <>
                    <p>{aiExplanation}</p>

                    <button
                      className="secondary-button"
                      onClick={generateAIExplanation}
                      disabled={aiLoading}
                    >
                      ↻ Generate Again
                    </button>
                  </>
                )}

              </div>

            </div>
          )}

        </section>
      )}

      {showAddPatient && (
        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">
              <div>
                <h2>Add Patient</h2>
                <p>Create a new patient record</p>
              </div>

              <button
                className="close-button"
                onClick={() => setShowAddPatient(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddPatient}>

              <label>
                Name
                <input
                  type="text"
                  name="name"
                  value={patientForm.name}
                  onChange={handlePatientFormChange}
                  required
                />
              </label>

              <label>
                Date of Birth
                <input
                  type="date"
                  name="date_of_birth"
                  value={patientForm.date_of_birth}
                  onChange={handlePatientFormChange}
                  required
                />
              </label>

              <label>
                Gender
                <select
                  name="gender"
                  value={patientForm.gender}
                  onChange={handlePatientFormChange}
                  required
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowAddPatient(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  Add Patient
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {showAddVital && selectedPatient && (
        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <div>
                <h2>Add Vital Record</h2>

                <p>
                  Add a measurement for {selectedPatient.name}
                </p>
              </div>

              <button
                className="close-button"
                onClick={() => setShowAddVital(false)}
              >
                ×
              </button>

            </div>

            <form onSubmit={handleAddVital}>

              <label>
                Date
                <input
                  type="date"
                  name="recorded_at"
                  value={vitalForm.recorded_at}
                  onChange={handleVitalFormChange}
                  required
                />
              </label>

              <label>
                HbA1c
                <input
                  type="number"
                  step="0.1"
                  name="hba1c"
                  value={vitalForm.hba1c}
                  onChange={handleVitalFormChange}
                  required
                />
              </label>

              <label>
                Systolic BP
                <input
                  type="number"
                  name="systolic_bp"
                  value={vitalForm.systolic_bp}
                  onChange={handleVitalFormChange}
                  required
                />
              </label>

              <label>
                Diastolic BP
                <input
                  type="number"
                  name="diastolic_bp"
                  value={vitalForm.diastolic_bp}
                  onChange={handleVitalFormChange}
                  required
                />
              </label>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowAddVital(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  Add Record
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  )
}

export default App
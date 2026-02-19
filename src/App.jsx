import { useState, useEffect } from 'react'
import questionsData from './data/questions.json'
import { getRandomQuestions, calculateScore } from './logic/quizEngine'
import AdminPanel from './components/AdminPanel'
import './App.css'

function App() {
  const [user, setUser] = useState({ firstName: '', lastName: '', email: '' })
  const [isStarted, setIsStarted] = useState(false)
  const [currentQuestions, setCurrentQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [results, setResults] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showAdmin, setShowAdmin] = useState(false)

  const API_URL = window.location.origin + '/api';

  useEffect(() => {
    if (isStarted) {
      const selected = getRandomQuestions(questionsData, 30);
      setCurrentQuestions(selected);
    }
  }, [isStarted]);

  const handleStart = async (e) => {
    e.preventDefault();
    if (user.firstName.trim() && user.lastName.trim() && user.email.trim()) {
      try {
        const response = await fetch(`${API_URL}/check-access`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email })
        });

        if (response.status === 403) {
          const data = await response.json();
          setErrorMessage(data.message);
          return;
        }

        setIsStarted(true);
        setErrorMessage('');
      } catch (error) {
        setErrorMessage('Error de conexión con el servidor. Asegúrate de que el backend esté corriendo.');
      }
    }
  };

  const handleAnswer = async (answer) => {
    const question = currentQuestions[currentIndex];
    const newAnswers = { ...answers, [question.id]: answer };
    setAnswers(newAnswers);
    setInputValue('');

    if (currentIndex < currentQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsSaving(true);
      const finalResults = calculateScore(newAnswers, currentQuestions);

      try {
        await fetch(`${API_URL}/save-result`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            score: finalResults.score,
            total: finalResults.total,
            percentage: finalResults.percentage
          })
        });
      } catch (error) {
        console.error('Error saving result:', error);
      }

      setResults(finalResults);
      setIsSaving(false);
    }
  };

  let content;

  if (isSaving) {
    content = <h1>Guardando tus resultados...</h1>;
  } else if (results) {
    content = (
      <>
        <h1>¡Evaluación Completada!</h1>
        <div className="card">
          <p>Alumno: <strong>{user.firstName} {user.lastName}</strong></p>
          <div className="score-display">{results.score} / {results.total}</div>
          <p style={{ textAlign: 'center', fontSize: '1.2rem' }}>
            Calificación: <strong>{results.percentage.toFixed(1)}%</strong>
          </p>

          <div className="results-list">
            {results.results.map((r, idx) => (
              <div key={idx} className={`result-item ${r.isCorrect ? 'correct' : 'incorrect'}`}>
                <p><strong>P{idx + 1}:</strong> {r.question}</p>
                <p>Tu respuesta: {r.userAnswer || '(En blanco)'}</p>
                {!r.isCorrect && <p style={{ color: 'var(--error)' }}>Respuesta correcta: {r.answer}</p>}
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-block" onClick={() => window.location.reload()}>
            Finalizar
          </button>
        </div>
      </>
    );
  } else if (!isStarted) {
    content = (
      <>
        <h1>Evaluación de Conceptos</h1>
        <div className="card">
          <form onSubmit={handleStart}>
            <p>Por favor, completa tus datos para comenzar la evaluación.</p>

            <div className="input-group">
              <label>Nombre</label>
              <input
                type="text"
                placeholder="Ej: Juan"
                value={user.firstName}
                onChange={(e) => setUser({ ...user, firstName: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label>Apellido</label>
              <input
                type="text"
                placeholder="Ej: Pérez"
                value={user.lastName}
                onChange={(e) => setUser({ ...user, lastName: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label>Correo Electrónico</label>
              <input
                type="email"
                placeholder="Ej: juan.perez@email.com"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                required
              />
            </div>

            {errorMessage && (
              <div style={{ color: 'var(--error)', marginTop: '1rem', textAlign: 'center' }}>
                {errorMessage}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '1.5rem' }}>
              Comenzar Evaluación
            </button>
          </form>
          <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
            <p className="text-muted" style={{ fontSize: '0.8rem' }}>Acceso exclusivo para alumnos registrados.</p>
            <button
              type="button"
              onClick={() => setShowAdmin(true)}
              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', marginTop: '0.5rem', textDecoration: 'underline' }}
            >
              Panel de Administración
            </button>
          </div>
        </div>
      </>
    );
  } else {
    const currentQ = currentQuestions[currentIndex];
    if (!currentQ) {
      content = <div>Cargando preguntas...</div>;
    } else {
      content = (
        <>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentIndex) / currentQuestions.length) * 100}%` }}
            ></div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span className="text-muted">Pregunta {currentIndex + 1} de {currentQuestions.length}</span>
              <span className="text-muted">{user.firstName} {user.lastName}</span>
            </div>
            <h2 style={{ marginBottom: '2rem' }}>{currentQ.question}</h2>

            {currentQ.type === 'multiple-choice' && (
              <div className="option-list">
                {currentQ.options.map((opt, i) => (
                  <button
                    key={i}
                    className="option-btn"
                    onClick={() => handleAnswer(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {currentQ.type === 'yes-no' && (
              <div className="option-list">
                {['SÍ', 'NO'].map((opt) => (
                  <button
                    key={opt}
                    className="option-btn"
                    onClick={() => handleAnswer(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {currentQ.type === 'fill-in-the-blank' && (
              <div>
                <input
                  type="text"
                  placeholder="Escribe tu respuesta..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inputValue.trim()) {
                      handleAnswer(inputValue);
                    }
                  }}
                  autoFocus
                />
                <button
                  className="btn btn-primary btn-block"
                  style={{ marginTop: '1.5rem' }}
                  onClick={() => inputValue.trim() && handleAnswer(inputValue)}
                >
                  Confirmar Respuesta
                </button>
              </div>
            )}
          </div>
        </>
      );
    }
  }

  return (
    <div className="container">
      {content}

      <button
        className="admin-toggle"
        onClick={() => setShowAdmin(true)}
        title="Acceso Administrativo"
      >
        ⚙️ <span style={{ fontSize: '0.6rem', marginLeft: '2px', fontWeight: 'bold' }}>ADMIN</span>
      </button>

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
}

export default App

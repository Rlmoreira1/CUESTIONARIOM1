import { useState, useEffect } from 'react'
import questionsData from './data/questions.json'
import { getRandomQuestions, calculateScore } from './logic/quizEngine'
import { saveResult, downloadCSV } from './logic/db'
import './App.css'

function App() {
  const [studentName, setStudentName] = useState('')
  const [isStarted, setIsStarted] = useState(false)
  const [currentQuestions, setCurrentQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [results, setResults] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isStarted) {
      const selected = getRandomQuestions(questionsData, 30); // Cambiado a 30 según requerimiento
      setCurrentQuestions(selected);
    }
  }, [isStarted]);

  const handleStart = (e) => {
    e.preventDefault();
    if (studentName.trim()) {
      setIsStarted(true);
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

      // Persistencia
      await saveResult({
        student: studentName,
        score: finalResults.score,
        total: finalResults.total,
        percentage: finalResults.percentage
      });

      setResults(finalResults);
      setIsSaving(false);
    }
  };

  if (isSaving) {
    return <div className="container"><h1>Guardando tus resultados...</h1></div>;
  }

  if (results) {
    return (
      <div className="container">
        <h1>¡Evaluación Completada!</h1>
        <div className="card">
          <p>Alumno: <strong>{studentName}</strong></p>
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
            Tomar otra prueba
          </button>
        </div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="container">
        <h1>Evaluación de Conceptos</h1>
        <div className="card">
          <form onSubmit={handleStart}>
            <p>Ingresa tu nombre para comenzar la prueba de 30 preguntas aleatorias.</p>
            <input
              type="text"
              placeholder="Nombre y Apellido"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '1.5rem' }}>
              Comenzar Evaluación
            </button>
          </form>
          <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
            <button
              className="btn"
              style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'transparent' }}
              onClick={downloadCSV}
            >
              📥 Descargar Reporte de Resultados (Excel/CSV)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = currentQuestions[currentIndex];
  if (!currentQ) return <div>Cargando preguntas...</div>;

  return (
    <div className="container">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((currentIndex) / currentQuestions.length) * 100}%` }}
        ></div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <span className="text-muted">Pregunta {currentIndex + 1} de {currentQuestions.length}</span>
          <span className="text-muted">{studentName}</span>
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
    </div>
  );
}

export default App

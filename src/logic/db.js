export const saveResult = async (data) => {
  console.log('Guardando resultado:', data);
  const history = JSON.parse(localStorage.getItem('quiz_history') || '[]');
  history.push({
    ...data,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('quiz_history', JSON.stringify(history));
  return new Promise((resolve) => setTimeout(resolve, 800));
};

export const downloadCSV = () => {
  const history = JSON.parse(localStorage.getItem('quiz_history') || '[]');
  if (history.length === 0) {
    alert('No hay resultados para exportar aún.');
    return;
  }

  const headers = ['Fecha', 'Alumno', 'Aciertos', 'Total', 'Porcentaje'];
  const rows = history.map(h => [
    new Date(h.timestamp).toLocaleString(),
    h.student,
    h.score,
    h.total,
    `${h.percentage.toFixed(1)}%`
  ]);

  const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `resultados_evaluacion_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

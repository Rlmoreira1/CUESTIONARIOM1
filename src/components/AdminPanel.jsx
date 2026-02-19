import React, { useState, useEffect } from 'react';

const AdminPanel = ({ onClose }) => {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3001/api/admin/results', {
                headers: { 'x-admin-password': password }
            });
            if (response.ok) {
                const data = await response.json();
                setResults(data);
                setIsAuthenticated(true);
                setError('');
            } else {
                setError('Contraseña incorrecta');
            }
        } catch (err) {
            setError('Error al conectar con el servidor');
        }
    };

    const downloadReport = () => {
        const headers = ['ID', 'Nombre', 'Apellido', 'Email', 'Aciertos', 'Total', 'Porcentaje', 'Fecha'];
        const rows = results.map(r => [
            r.id,
            r.firstName,
            r.lastName,
            r.email,
            r.score,
            r.total,
            `${r.percentage.toFixed(1)}%`,
            new Date(r.timestamp).toLocaleString()
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "reporte_evaluaciones_completo.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isAuthenticated) {
        return (
            <div className="admin-overlay">
                <div className="card admin-login">
                    <h2>Acceso Administrativo</h2>
                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            placeholder="Contraseña Maestra"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                        />
                        {error && <p style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{error}</p>}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" className="btn btn-primary">Entrar</button>
                            <button type="button" className="btn" onClick={onClose}>Cerrar</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-overlay">
            <div className="container" style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', background: 'white', borderRadius: '1rem', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2>Reporte de Evaluaciones</h2>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-primary" onClick={downloadReport}>📥 Descargar CSV</button>
                        <button className="btn" onClick={onClose}>Cerrar</button>
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '1rem' }}>Alumno</th>
                            <th style={{ padding: '1rem' }}>Email</th>
                            <th style={{ padding: '1rem' }}>Nota</th>
                            <th style={{ padding: '1rem' }}>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((r) => (
                            <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '1rem' }}>{r.firstName} {r.lastName}</td>
                                <td style={{ padding: '1rem' }}>{r.email}</td>
                                <td style={{ padding: '1rem' }}>
                                    <strong>{r.percentage.toFixed(1)}%</strong> ({r.score}/{r.total})
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.8rem' }}>{new Date(r.timestamp).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminPanel;

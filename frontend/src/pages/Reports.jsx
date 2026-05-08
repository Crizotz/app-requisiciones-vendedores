import { useState, useEffect } from 'react';
import api from '../api';

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    api.get('/reports/summary').then(({ data }) => setSummary(data)).catch(() => {});
  }, []);

  const exportExcel = async () => {
    try {
      const params = {};
      if (startDate) params.start = startDate;
      if (endDate) params.end = endDate;
      const { data } = await api.get('/reports/export', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `requisiciones_${startDate || 'todas'}_${endDate || 'ahora'}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error al exportar');
    }
  };

  if (!summary) return <div className="loading">Cargando...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Reportes</h1>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <h3>Total Requisiciones</h3>
          <p className="summary-number">{summary.totalOrders}</p>
        </div>
        <div className="summary-card">
          <h3>Aprobadas</h3>
          <p className="summary-number success">{summary.totalApproved}</p>
        </div>
        <div className="summary-card">
          <h3>Pendientes</h3>
          <p className="summary-number warning">{summary.totalPending}</p>
        </div>
        <div className="summary-card">
          <h3>Ingresos</h3>
          <p className="summary-number">${Number(summary.totalRevenue).toFixed(2)}</p>
        </div>
        <div className="summary-card">
          <h3>Productos</h3>
          <p className="summary-number">{summary.totalProducts}</p>
        </div>
        <div className="summary-card">
          <h3>Vendedores</h3>
          <p className="summary-number">{summary.totalUsers}</p>
        </div>
      </div>

      {summary.topProducts?.length > 0 && (
        <div className="section">
          <h2>Productos Más Vendidos</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Unidades Vendidas</th>
                <th>Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {summary.topProducts.map((p, i) => (
                <tr key={i}>
                  <td>{p.name}</td>
                  <td>{p.total_sold}</td>
                  <td>${Number(p.total_revenue).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="section">
        <h2>Exportar a Excel</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Fecha inicio</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Fecha fin</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={exportExcel}>Exportar a Excel</button>
      </div>
    </div>
  );
}

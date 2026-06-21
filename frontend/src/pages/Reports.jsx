import React, { useState } from 'react';

export default function Reports({ userRole, storeId }) {
  const [reportType, setReportType] = useState('sales');
  const [startDate, setStartDate] = useState('2026-05-13');
  const [endDate, setEndDate] = useState('2026-06-12');

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [animateTable, setAnimateTable] = useState(false);

  // =============================
  // DOWNLOAD ENGINE
  // =============================
  const downloadFile = (data, filename, type) => {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // =============================
  // CSV CONVERTER
  // =============================
  const convertToCSV = (arr) => {
    if (!arr || arr.length === 0) return '';

    const headers = Object.keys(arr[0]);
    let csv = headers.join(',') + '\n';

    arr.forEach(row => {
      const values = headers.map(h =>
        `"${row[h] ?? ''}"`
      );
      csv += values.join(',') + '\n';
    });

    return csv;
  };

  // =============================
  // FETCH REPORTS
  // =============================
  const fetchReport = async (format = 'json') => {
    setLoading(true);
    setErrorMessage('');
    setAnimateTable(false);

    try {
      const res = await fetch(
        `/api/reports/${reportType}?startDate=${startDate}&endDate=${endDate}&storeId=${storeId || ''}`
      );

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to load report');
      }

      const data = result.data || [];

      setReportData(data);
      setTimeout(() => setAnimateTable(true), 50);

      // EXPORT LOGIC
      if (format === 'csv') {
        downloadFile(
          convertToCSV(data),
          `${reportType}_report.csv`,
          'text/csv'
        );
      }

      if (format === 'xlsx') {
        downloadFile(
          convertToCSV(data),
          `${reportType}_report.xlsx`,
          'application/vnd.ms-excel'
        );
      }

    } catch (err) {
      setErrorMessage(err.message);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // UI
  // =============================
  return (
    <div className="p-3" style={{ background: '#0b0f19', minHeight: '100vh', color: '#fff' }}>

      {/* HEADER */}
      <div className="mb-3">
        <h2 style={{ color: '#fff', fontWeight: 700 }}>Reports Dashboard</h2>
        <p style={{ color: '#94a3b8' }}>Generate sales, inventory and customer reports</p>
      </div>

      {/* TABS */}
      <div className="mb-3 d-flex gap-2">
        {['sales', 'inventory', 'customers'].map(type => (
          <button
            key={type}
            onClick={() => {
              setReportType(type);
              setReportData([]);
              setErrorMessage('');
            }}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #2a2f3a',
              background: reportType === type ? '#2563eb' : '#111827',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            {type.toUpperCase()}
          </button>
        ))}
      </div>

      {/* FILTER BOX */}
      <div style={{
        background: '#111827',
        padding: 16,
        borderRadius: 12,
        border: '1px solid #2a2f3a',
        marginBottom: 16
      }}>

        <div className="d-flex gap-3 flex-wrap">

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={inputStyle}
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={inputStyle}
          />

        </div>

        {/* BUTTONS */}
        <div className="d-flex gap-2 mt-3 flex-wrap">

          <button onClick={() => fetchReport('json')} style={btnBlue} disabled={loading}>
            {loading ? 'Loading...' : 'Fetch Report'}
          </button>

          <button
            onClick={() => fetchReport('csv')}
            style={btnGreen}
            disabled={reportData.length === 0}
          >
            Export CSV
          </button>

          <button
            onClick={() => fetchReport('xlsx')}
            style={btnPurple}
            disabled={reportData.length === 0}
          >
            Export Excel
          </button>

        </div>
      </div>

      {/* ERROR */}
      {errorMessage && (
        <div style={{
          background: '#2a1515',
          color: '#ff6b6b',
          padding: 10,
          borderRadius: 8,
          marginBottom: 10
        }}>
          {errorMessage}
        </div>
      )}

      {/* TABLE */}
      <div style={{
        background: '#111827',
        borderRadius: 12,
        border: '1px solid #2a2f3a',
        overflowX: 'auto'
      }}>

        {reportData.length === 0 ? (
          <div style={{ padding: 20, color: '#94a3b8' }}>
            No data loaded yet. Click "Fetch Report"
          </div>
        ) : (
          <table style={{ width: '100%', color: '#fff' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {Object.keys(reportData[0]).map((key) => (
                  <th key={key} style={thStyle}>
                    {key}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {reportData.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1f2937' }}>
                  {Object.values(row).map((val, j) => (
                    <td key={j} style={tdStyle}>
                      {val ?? '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// =============================
// STYLES
// =============================
const inputStyle = {
  background: '#0f172a',
  border: '1px solid #2a2f3a',
  padding: 10,
  borderRadius: 8,
  color: '#fff'
};

const btnBlue = {
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  padding: '10px 14px',
  borderRadius: 8,
  cursor: 'pointer'
};

const btnGreen = {
  background: '#10b981',
  color: '#fff',
  border: 'none',
  padding: '10px 14px',
  borderRadius: 8,
  cursor: 'pointer'
};

const btnPurple = {
  background: '#8b5cf6',
  color: '#fff',
  border: 'none',
  padding: '10px 14px',
  borderRadius: 8,
  cursor: 'pointer'
};

const thStyle = {
  textAlign: 'left',
  padding: 10,
  fontSize: 12,
  color: '#94a3b8'
};

const tdStyle = {
  padding: 10,
  fontSize: 13,
  color: '#fff'
};
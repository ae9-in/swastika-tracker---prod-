import { useEffect, useRef, useState } from 'react';
import { Download, Search, Upload, FileJson, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import { exportToExcel, generateDataPDF, readExcelAsJSON, downloadImportTemplate } from '../utils/exportUtils';

const statusOptions = ['All', 'Contacted', 'Samples Given', 'Follow Up Visit', 'Delivered'];

export default function AffiliatesList() {
  const { token, user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState({ page: 1, pageSize: 10, status: 'All', search: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  async function loadRows() {
    setLoading(true);
    setError('');
    try {
      const res = await api.affiliates.list(token, query);
      setRows(res.data);
      setTotal(res.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, token]);

  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  const handleExportExcel = () => {
    exportToExcel(rows, 'affiliates_list.xlsx');
    setMessage('Excel exported successfully.');
  };

  const handleExportPDF = () => {
    setMessage('Generating PDF...');
    generateDataPDF({
      title: 'Affiliates Directory Report',
      subtitle: `Filter: ${query.status} | Page: ${query.page}`,
      columns: ['name', 'product', 'phone1', 'status'],
      data: rows,
      fileName: 'affiliates_report_structured.pdf'
    });
    setMessage('PDF exported successfully.');
  };

  async function handleImportExcel(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const data = await readExcelAsJSON(file);
      const res = await api.affiliates.importJson(token, data);
      setMessage(`Import complete: ${res.inserted} success, ${res.errorCount} failed.`);
      if (res.errorCount > 0) {
        setError(`Check console for details on the ${res.errorCount} failed rows.`);
        console.error('Import Errors:', res.errors);
      } else {
        setError('');
      }
      await loadRows();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  }

  return (
    <div className="screen-stack">
      <PageHeader
        title="Affiliates"
        subtitle="Search, segment, import/export, and navigate each affiliate profile quickly."
        actions={[
          { label: 'Add Affiliate', to: '/app/affiliates/new' },
        ]}
      />

      <section className="table-toolbar">
        <div className="search-wrap">
          <Search size={16} />
          <input
            type="search"
            value={query.search}
            onChange={(event) => setQuery((prev) => ({ ...prev, page: 1, search: event.target.value }))}
            placeholder="Search name, product, phone"
          />
        </div>

        <select
          value={query.status}
          onChange={(event) => setQuery((prev) => ({ ...prev, page: 1, status: event.target.value }))}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <div className="btn-inline-group">
          {(user?.role === 'admin' || user?.role === 'staff') && (
            <>
              <button type="button" className="secondary-btn" title="Download Import Template" onClick={downloadImportTemplate}>
                <Download size={14} /> Template
              </button>
              <button type="button" className="secondary-btn" title="Export Excel" onClick={handleExportExcel}>
                <FileJson size={14} /> Export Excel
              </button>
              <button type="button" className="secondary-btn" title="Export PDF" onClick={handleExportPDF}>
                <FileText size={14} /> PDF
              </button>
              <button type="button" className="secondary-btn" title="Import Excel/CSV" onClick={() => fileRef.current?.click()}>
                <Upload size={14} /> Import
              </button>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden-input" onChange={handleImportExcel} />
            </>
          )}
        </div>
      </section>

      {message ? <p className="success-banner">{message}</p> : null}
      {error ? <p className="error-banner">{error}</p> : null}

      <section className="table-card" data-export-target="affiliates-table">
        {loading ? <p className="loading-state">Loading affiliates...</p> : null}

        {!loading ? (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Product</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.product}</td>
                  <td>{row.phone1}</td>
                  <td>
                    <span className={`status-pill status-${row.status.replace(/\s+/g, '-').toLowerCase()}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>{new Date(row.updatedAt).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/app/affiliates/${row.id}`} className="table-link">
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>

      <section className="pagination-row">
        <button
          type="button"
          onClick={() => setQuery((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
          disabled={query.page === 1}
        >
          Previous
        </button>
        <p>
          Page {query.page} of {totalPages}
        </p>
        <button
          type="button"
          onClick={() => setQuery((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
          disabled={query.page === totalPages}
        >
          Next
        </button>
      </section>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, statusOrder } from '../services/api';
import PageHeader from '../components/common/PageHeader';

const initialForm = {
  name: '',
  product: '',
  address: '',
  phone1: '',
  phone2: '',
  description: '',
  status: 'Contacted',
};

export default function AffiliateForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const isEdit = Boolean(id);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) {
      return;
    }

    let mounted = true;
    api.affiliates
      .getById(token, id)
      .then((res) => {
        if (mounted) {
          setForm({
            name: res.affiliate.name,
            product: res.affiliate.product,
            address: res.affiliate.address,
            phone1: res.affiliate.phone1,
            phone2: res.affiliate.phone2,
            description: res.affiliate.description,
            status: res.affiliate.status,
          });
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message);
        }
      });

    return () => {
      mounted = false;
    };
  }, [id, isEdit, token]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const phonePattern = /^\d{10}$/;
    if (!phonePattern.test(form.phone1) || !phonePattern.test(form.phone2)) {
      setError('Phone numbers must be exactly 10 digits.');
      setSaving(false);
      return;
    }

    try {
      if (isEdit) {
        await api.affiliates.update(token, id, form);
      } else {
        await api.affiliates.create(token, form);
      }
      navigate('/app/affiliates');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen-stack animate-up">
      <PageHeader
        title={isEdit ? 'Edit Affiliate' : 'Create Affiliate'}
        subtitle={isEdit ? 'Update profile fields with clear and validated data.' : 'Add a new affiliate profile with complete contact information.'}
        actions={[
          { label: 'Back to Affiliates', to: '/app/affiliates', variant: 'secondary' },
          ...(isEdit ? [{ label: 'Open Profile', to: `/app/affiliates/${id}` }] : []),
        ]}
      />

      <section className="form-card">
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Name
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
          </label>

          <label>
            Product
            <input
              value={form.product}
              onChange={(event) => setForm((prev) => ({ ...prev, product: event.target.value }))}
              required
            />
          </label>

          <label>
            Phone 1
            <input
              value={form.phone1}
              onChange={(event) => setForm((prev) => ({ ...prev, phone1: event.target.value }))}
              required
            />
          </label>

          <label>
            Phone 2
            <input
              value={form.phone2}
              onChange={(event) => setForm((prev) => ({ ...prev, phone2: event.target.value }))}
              required
            />
          </label>

          <label>
            Status
            <select
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            >
              {statusOrder.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label>
            Quick Link
            <Link to="/app/reminders" className="secondary-btn inline-btn">Create Reminder</Link>
          </label>

          <label className="full-span">
            Address
            <input
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              required
            />
          </label>

          <label className="full-span">
            Description
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              required
            />
          </label>

          {error ? <p className="error-banner full-span">{error}</p> : null}

          <div className="full-span action-row">
            <button type="button" className="secondary-btn" onClick={() => navigate('/app/affiliates')}>
              Cancel
            </button>
            <button type="submit" className="primary-btn inline-btn" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Affiliate'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

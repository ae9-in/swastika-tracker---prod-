import { Link } from 'react-router-dom';

export default function PageHeader({ title, subtitle, actions = [] }) {
  return (
    <section className="page-header-card">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
      </div>

      {actions.length > 0 ? (
        <div className="page-actions">
          {actions.map((action) => {
            if (action.to) {
              return (
                <Link
                  key={action.label}
                  to={action.to}
                  className={action.variant === 'secondary' ? 'secondary-btn' : 'primary-btn'}
                  style={action.style}
                >
                  {action.label}
                </Link>
              );
            }

            return (
              <button
                key={action.label}
                type="button"
                className={action.variant === 'secondary' ? 'secondary-btn' : 'primary-btn'}
                onClick={action.onClick}
                disabled={action.disabled}
                style={action.style}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

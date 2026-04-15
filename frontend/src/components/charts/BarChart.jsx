export default function BarChart({ data, title }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <section className="chart-card">
      <header>
        <h3>{title}</h3>
      </header>

      <div className="bar-grid">
        {data.map((item, index) => (
          <div key={item.name} className="bar-item">
            <span>{item.name}</span>
            <div className="bar-track">
              <div
                style={{ width: `${(item.value / maxValue) * 100}%`, transitionDelay: `${index * 80}ms` }}
                className="bar-fill"
              />
            </div>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

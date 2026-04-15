export default function LineChart({ data, title }) {
  const width = 360;
  const height = 200;
  const padding = 24;

  const maxValue = Math.max(...data.map((point) => point.value), 1);
  const stepX = (width - padding * 2) / Math.max(data.length - 1, 1);

  const points = data
    .map((point, index) => {
      const x = padding + index * stepX;
      const y = height - padding - ((height - padding * 2) * point.value) / maxValue;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <section className="chart-card">
      <header>
        <h3>{title}</h3>
      </header>
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" role="img" aria-label={title}>
        <polyline points={points} fill="none" stroke="url(#lineGradient)" strokeWidth="4" strokeLinecap="round" />
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f9a642" />
            <stop offset="100%" stopColor="#f26c4f" />
          </linearGradient>
        </defs>
      </svg>
      <div className="chart-label-row">
        {data.map((point) => (
          <span key={point.date}>
            {point.date.slice(5)}
          </span>
        ))}
      </div>
    </section>
  );
}

const colors = ['#f26c4f', '#f9a642', '#f4c76f'];

export default function DonutChart({ data, title }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const total = Math.max(data.reduce((sum, item) => sum + item.value, 0), 1);
  const segments = data.reduce((acc, item) => {
    const prevOffset = acc.length > 0 ? acc[acc.length - 1].nextOffset : 0;
    const ratio = item.value / total;
    const segmentLength = ratio * circumference;
    acc.push({
      ...item,
      ratio,
      offset: prevOffset,
      strokeDasharray: `${segmentLength} ${circumference}`,
      nextOffset: prevOffset + segmentLength,
    });
    return acc;
  }, []);

  return (
    <section className="chart-card">
      <header>
        <h3>{title}</h3>
      </header>

      <div className="donut-wrap">
        <svg viewBox="0 0 160 160" className="donut-svg" role="img" aria-label={title}>
          <circle cx="80" cy="80" r={radius} fill="transparent" stroke="#2c303f" strokeWidth="18" />
          {segments.map((segment, index) => (
            <circle
              key={segment.label}
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke={colors[index % colors.length]}
              strokeWidth="18"
              strokeDasharray={segment.strokeDasharray}
              strokeDashoffset={-segment.offset}
              strokeLinecap="round"
              transform="rotate(-90 80 80)"
            />
          ))}
        </svg>

        <div className="legend-stack">
          {data.map((item, index) => (
            <div key={item.label} className="legend-item">
              <span style={{ background: colors[index % colors.length] }} />
              <p>{item.label}</p>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

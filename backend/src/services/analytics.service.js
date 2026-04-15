import { query } from '../config/db.js';
import { STATUS_ORDER } from '../constants/domain.js';

export async function getDashboardMetrics({ rangeDays = 7 }, auth) {
  const safeRange = [7, 30, 90].includes(Number(rangeDays)) ? Number(rangeDays) : 7;
  const businessId = auth.activeBusinessId;

  // Run all independent queries in parallel
  const [
    { rows: totalRows },
    { rows: statusRows },
    { rows: trendRows },
    { rows: businessRows },
    { rows: remindersRows },
    { rows: activityRows },
  ] = await Promise.all([
    query('select count(*)::int as total from affiliates where business_id = $1', [businessId]),
    query('select status, count(*)::int as value from affiliates where business_id = $1 group by status', [businessId]),
    query(
      `
      select to_char(created_at::date, 'YYYY-MM-DD') as date, count(*)::int as value
      from affiliates
      where business_id = $1
        and created_at::date >= current_date - ($2::int - 1)
      group by created_at::date
      order by created_at::date asc
      `,
      [businessId, safeRange],
    ),
    // Show all active businesses in the system (global context model).
    query(
      `
      select b.id as "businessId", b.name, count(a.id)::int as value
      from businesses b
      left join affiliates a on a.business_id = b.id
      where b.is_active = true
      group by b.id, b.name
      order by b.name
      `,
      [],
    ),
    query(
      `
      select id, title, to_char(due_date, 'YYYY-MM-DD') as "dueDate", priority, status
      from reminders
      where business_id = $1 and status = 'pending'
      order by due_date asc
      limit 5
      `,
      [businessId],
    ),
    query(
      `
      select id, message, type, created_at as "createdAt"
      from activities
      where business_id = $1
      order by created_at desc
      limit 6
      `,
      [businessId],
    ),
  ]);

  const statusCounts = STATUS_ORDER.reduce((acc, status) => ({ ...acc, [status]: 0 }), {});
  statusRows.forEach((row) => {
    statusCounts[row.status] = row.value;
  });

  const trendMap = new Map(trendRows.map((row) => [row.date, row.value]));
  const trendSeries = [];
  for (let i = safeRange - 1; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    trendSeries.push({ date: key, value: trendMap.get(key) || 0 });
  }

  return {
    totals: {
      totalAffiliates: totalRows[0]?.total || 0,
      contacted: statusCounts['Contacted'],
      samplesGiven: statusCounts['Samples Given'],
      followUpVisit: statusCounts['Follow Up Visit'],
    },
    statusCounts,
    trendSeries,
    businessBreakdown: businessRows,
    upcomingReminders: remindersRows,
    recentActivities: activityRows,
  };
}


import { query } from '../config/db.js';

export async function listActivities({ limit = 30 }, auth) {
  const safeLimit = Math.min(200, Math.max(1, Number(limit) || 30));

  const values = [auth.activeBusinessId, safeLimit];
  const filters = ['ac.business_id = $1'];

  // Hard filter: Staff cannot see system/admin activity types
  if (auth.role !== 'admin') {
    filters.push("ac.type not in ('affiliate_deleted', 'affiliate_imported', 'bulk_update')");
  }

  const { rows } = await query(
    `
    select ac.id, ac.business_id as "businessId", ac.actor_user_id as "actorUserId", ac.type, ac.message, ac.metadata,
           ac.created_at as "createdAt", a.name as "affiliateName"
    from activities ac
    left join affiliates a on a.id::text = ac.metadata->>'affiliateId'
    where ${filters.join(' and ')}
    order by ac.created_at desc
    limit $2
    `,
    values,
  );

  return { data: rows };
}

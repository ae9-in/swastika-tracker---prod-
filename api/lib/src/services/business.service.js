import { query } from '../config/db.js';

export async function listAllActiveBusinesses() {
  const { rows } = await query(
    `
    select id, code, name
    from businesses
    where is_active = true
    order by name
    `,
  );

  return rows;
}

export async function listBusinessesForUser(userId) {
  const { rows } = await query(
    `
    select b.id, b.code, b.name
    from user_business_access uba
    join businesses b on b.id = uba.business_id
    where uba.user_id = $1
    order by b.name
    `,
    [userId],
  );

  return rows;
}

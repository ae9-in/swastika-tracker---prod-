import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { badRequest, notFound, unauthorized } from '../utils/errors.js';
import { signToken } from '../utils/jwt.js';
import { listAllActiveBusinesses } from './business.service.js';

function formatUserRow(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
  };
}

export async function findUserWithBusinessesByEmail(email) {
  const { rows } = await query(
    `
    select
      u.id,
      u.name,
      u.email,
      u.role,
      u.password_hash,
      coalesce(
        json_agg(
          json_build_object('id', b.id, 'code', b.code, 'name', b.name)
          order by b.name
        ) filter (where b.id is not null),
        '[]'::json
      ) as businesses
    from app_users u
    left join user_business_access uba on uba.user_id = u.id
    left join businesses b on b.id = uba.business_id
    where lower(u.email) = lower($1)
      and u.is_active = true
    group by u.id
    `,
    [email],
  );

  return rows[0] || null;
}

export async function findUserWithBusinessesById(userId) {
  const { rows } = await query(
    `
    select
      u.id,
      u.name,
      u.email,
      u.role,
      coalesce(
        json_agg(
          json_build_object('id', b.id, 'code', b.code, 'name', b.name)
          order by b.name
        ) filter (where b.id is not null),
        '[]'::json
      ) as businesses
    from app_users u
    left join user_business_access uba on uba.user_id = u.id
    left join businesses b on b.id = uba.business_id
    where u.id = $1
      and u.is_active = true
    group by u.id
    `,
    [userId],
  );

  return rows[0] || null;
}

export async function registerUser(name, email, password) {
  // Check if email exists
  const existing = await findUserWithBusinessesByEmail(email);
  if (existing) {
    throw badRequest('Email already in use');
  }

  const hash = await bcrypt.hash(password, 10);

  // Create user as 'staff' default
  const { rows } = await query(
    `
    insert into app_users (name, email, password_hash, role)
    values ($1, $2, $3, 'staff')
    returning id, name, email, role
    `,
    [name, email, hash]
  );

  const newUser = rows[0];

  // New users are registered but have ZERO business access by default for strict control.
  // An Admin must manually assign them to a business in the user_business_access table.

  const allBusinesses = await listAllActiveBusinesses();
  const allBusinessIds = allBusinesses.map((item) => item.id);

  const token = signToken({
    sub: newUser.id,
    role: newUser.role,
    allowedBusinessIds: allBusinessIds,
    activeBusinessId: null,
  });

  return {
    token,
    user: newUser,
    allowedBusinesses: allBusinesses,
    activeBusiness: null,
    message: 'Registered successfully.',
  };
}

export async function loginUser(email, password) {
  const row = await findUserWithBusinessesByEmail(email);
  if (!row) {
    throw unauthorized('Invalid email or password');
  }

  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) {
    throw unauthorized('Invalid email or password');
  }

  const allBusinesses = await listAllActiveBusinesses();
  const allowedBusinessIds = allBusinesses.map((item) => item.id);
  const token = signToken({
    sub: row.id,
    role: row.role,
    allowedBusinessIds,
    activeBusinessId: null,
  });

  return {
    token,
    user: formatUserRow(row),
    allowedBusinesses: allBusinesses,
  };
}

export async function selectBusiness(userId, businessId) {
  const row = await findUserWithBusinessesById(userId);
  if (!row) {
    throw notFound('User not found');
  }

  const allBusinesses = await listAllActiveBusinesses();
  const allowedBusinessIds = allBusinesses.map((item) => item.id);
  if (!allowedBusinessIds.includes(businessId)) {
    throw unauthorized('Selected business is not available');
  }

  const token = signToken({
    sub: row.id,
    role: row.role,
    allowedBusinessIds,
    activeBusinessId: businessId,
  });

  const activeBusiness = allBusinesses.find((item) => item.id === businessId) || null;

  return {
    token,
    user: formatUserRow(row),
    allowedBusinesses: allBusinesses,
    activeBusiness,
  };
}

export async function getMe(userId, activeBusinessId) {
  const row = await findUserWithBusinessesById(userId);
  if (!row) {
    throw notFound('User not found');
  }

  const allBusinesses = await listAllActiveBusinesses();

  return {
    user: formatUserRow(row),
    allowedBusinesses: allBusinesses,
    activeBusiness: allBusinesses.find((item) => item.id === activeBusinessId) || null,
  };
}

export async function savePushSubscription(userId, subscription) {
  const endpoint = subscription.endpoint;
  await query('delete from push_subscriptions where subscription_json->>\'endpoint\' = $1', [endpoint]);
  await query('insert into push_subscriptions (user_id, subscription_json) values ($1, $2)', [userId, JSON.stringify(subscription)]);
  return { success: true };
}

/**
 * Returns all active employees who have access to a given business.
 * Used to populate the "Assign Employee" dropdown for follow-up scheduling.
 */
export async function listEmployeesForBusiness(businessId) {
  void businessId;
  const { rows } = await query(
    `
    select u.id, u.name, u.email, u.role
    from app_users u
    where u.is_active = true
    order by u.name asc
    `,
  );
  return rows;
}

import bcrypt from 'bcryptjs';
import { pool } from '../src/config/db.js';

const users = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Central Admin',
    email: 'admin@swastika.in',
    password: 'Admin@123',
    role: 'super_admin',
    businesses: ['hw', 'pooja'],
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'H&W Manager',
    email: 'hw@swastika.in',
    password: 'Admin@123',
    role: 'business_user',
    businesses: ['hw', 'pooja'],
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Pooja Manager',
    email: 'pooja@swastika.in',
    password: 'Admin@123',
    role: 'business_user',
    businesses: ['hw', 'pooja'],
  },
];

const businesses = [
  { id: 'hw', code: 'HW', name: 'H&W' },
  { id: 'pooja', code: 'POOJA', name: 'Pooja' },
];

async function main() {
  const client = await pool.connect();
  try {
    await client.query('begin');

    for (const business of businesses) {
      await client.query(
        `
        insert into businesses (id, code, name)
        values ($1, $2, $3)
        on conflict (id) do update set code = excluded.code, name = excluded.name
        `,
        [business.id, business.code, business.name],
      );
    }

    for (const user of users) {
      const hash = await bcrypt.hash(user.password, 10);
      await client.query(
        `
        insert into app_users (id, name, email, password_hash, role)
        values ($1, $2, $3, $4, $5)
        on conflict (id) do update
          set name = excluded.name,
              email = excluded.email,
              password_hash = excluded.password_hash,
              role = excluded.role,
              updated_at = now()
        `,
        [user.id, user.name, user.email, hash, user.role],
      );

      await client.query('delete from user_business_access where user_id = $1', [user.id]);
      for (const businessId of user.businesses) {
        await client.query(
          `
          insert into user_business_access (user_id, business_id)
          values ($1, $2)
          on conflict (user_id, business_id) do nothing
          `,
          [user.id, businessId],
        );
      }
    }

    await client.query('commit');
    // eslint-disable-next-line no-console
    console.log('Seed completed successfully.');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

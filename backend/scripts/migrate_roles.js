import { query, pool } from '../src/config/db.js';

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('begin');

        // Drop existing check constraint if exists
        try {
            await client.query('alter table app_users drop constraint app_users_role_check;');
        } catch (e) {
            // Ignore if doesn't exist
        }

        // Update existing roles
        await client.query("update app_users set role = 'admin' where role = 'super_admin';");
        await client.query("update app_users set role = 'staff' where role = 'business_user';");

        // Add check constraint
        await client.query("alter table app_users add constraint app_users_role_check check (role in ('admin', 'staff'));");

        // Add registration_date column
        await client.query('alter table app_users add column if not exists registration_date timestamp with time zone default now();');

        await client.query('commit');
        console.log('Role migration successful.');
    } catch (err) {
        await client.query('rollback');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();

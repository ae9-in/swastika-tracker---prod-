import { query } from './src/config/db.js';

async function countUsers() {
    try {
        const { rows } = await query('SELECT count(*) FROM app_users');
        console.log('Total users:', rows[0].count);
    } catch (err) {
        console.error('Error querying users:', err);
    } finally {
        process.exit();
    }
}

countUsers();

import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const filesToProcess = [
    'src/services/affiliate.service.js',
    'src/services/reminder.service.js',
    'src/services/auth.service.js',
    'src/middleware/auth.js',
    'src/controllers/auth.controller.js'
];

filesToProcess.forEach(relPath => {
    const fullPath = path.join(rootDir, relPath);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = content.replace(/super_admin/g, 'admin');
        content = content.replace(/business_user/g, 'staff');
        fs.writeFileSync(fullPath, content);
        console.log(`Updated roles in ${relPath}`);
    } else {
        console.log(`File not found: ${relPath}`);
    }
});

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.join(__dirname, '../../.env');

function generateSecret() {
    return crypto.randomBytes(32).toString('hex');
}

function updateEnv() {
    let content = '';
    if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf8');
    }

    if (content.includes('JWT_SECRET=') && !content.includes('JWT_SECRET=\n') && !content.endsWith('JWT_SECRET=')) {
        console.log('JWT_SECRET already exists in .env. Skipping...');
        return;
    }

    const secret = generateSecret();
    const newEntry = `JWT_SECRET=${secret}`;

    if (content.includes('JWT_SECRET=')) {
        // Replace empty or placeholder JWT_SECRET
        content = content.replace(/JWT_SECRET=.*/, newEntry);
    } else {
        // Append to end
        content += `\n# Generated Secret\n${newEntry}\n`;
    }

    fs.writeFileSync(envPath, content);
    console.log('Successfully generated and saved new JWT_SECRET to .env');
}

updateEnv();

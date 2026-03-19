require('dotenv').config({ path: 'backend/.env' });
const { sendOTP } = require('./backend/utils/emailService');

async function test() {
    console.log('Testing email sending...');
    const result = await sendOTP('test@example.com', '123456');
    console.log('Result:', result);
    process.exit(result ? 0 : 1);
}

test();

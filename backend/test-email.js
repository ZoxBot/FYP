require('dotenv').config();
const { sendOTP } = require('./utils/emailService');

async function test() {
    console.log('Testing email sending...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER); // Just to check if it's loaded
    const result = await sendOTP('test@example.com', '123456');
    console.log('Result:', result);
    process.exit(result ? 0 : 1);
}

test();

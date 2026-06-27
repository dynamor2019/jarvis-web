
const nodemailer = require('nodemailer');

// 从环境变量读取配置，方便在服务器直接运行测试
const host = process.env.SMTP_HOST || 'smtp.qq.com';
const port = parseInt(process.env.SMTP_PORT || '465', 10);
const user = process.env.SMTP_USER || '9370611@qq.com';
const pass = process.env.SMTP_PASS; // 必须通过环境变量传入
const to = process.env.TEST_TO || user; // 默认发给自己

console.log('Testing SMTP Configuration:');
console.log(`Host: ${host}`);
console.log(`Port: ${port}`);
console.log(`User: ${user}`);
console.log(`Pass: ${pass ? '******' : '(missing)'}`);

if (!pass) {
    console.error('Error: SMTP_PASS environment variable is missing.');
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: { user, pass },
});

async function main() {
    try {
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('✅ Connection verification successful!');

        console.log(`Sending test email to ${to}...`);
        const info = await transporter.sendMail({
            from: `"Jarvis Test" <${user}>`,
            to: to,
            subject: 'Jarvis SMTP Test',
            text: 'If you see this, SMTP is working correctly.',
            html: '<b>If you see this, SMTP is working correctly.</b>',
        });

        console.log('✅ Message sent: %s', info.messageId);
    } catch (error) {
        console.error('❌ Error occurred:');
        console.error(error);
    }
}

main();

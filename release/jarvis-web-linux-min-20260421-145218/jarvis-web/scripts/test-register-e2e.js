const BASE_URL = 'http://localhost:3000';

async function testRegistration() {
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    const username = `user${timestamp}`;
    const password = 'Password123!';
    const name = 'Test User';

    console.log(`[1] Sending verification code to ${email}...`);
    try {
        const sendRes = await fetch(`${BASE_URL}/api/auth/send-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const sendData = await sendRes.json();
        
        if (!sendRes.ok) {
            console.error('Failed to send code:', sendData);
            return;
        }

        const code = sendData.debugCode;
        if (!code) {
            console.error('No debug code received. Ensure NODE_ENV is not production.');
            return;
        }
        console.log(`[Success] Code sent. Debug Code: ${code}`);

        console.log(`[2] Registering user ${username}...`);
        const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                username,
                password,
                name,
                code,
                referralCode: '' // Optional
            })
        });

        const regData = await regRes.json();

        if (regRes.ok) {
            console.log('[Success] Registration successful!');
            console.log('User:', regData.user);
            console.log('Token:', regData.token ? 'Received' : 'Missing');
        } else {
            console.error('[Failed] Registration failed:', regData);
        }

    } catch (error) {
        console.error('Error during test:', error);
    }
}

testRegistration();

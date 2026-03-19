const axios = require('axios');

async function testLogin() {
  const payload = {
    username: 'admin',
    password: 'admin123'
  };

  try {
    console.log('Testing login with:', payload);
    const response = await axios.post('http://localhost:5000/api/auth/login', payload);
    console.log('Login successful! Status:', response.status);
    console.log('Token received:', response.data.token ? 'YES' : 'NO');
  } catch (err) {
    console.error('Login failed!');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Message:', err.response.data.message || err.response.data.error);
    } else {
      console.error('Error:', err.message);
    }
    console.log('\n--- Troubleshooting ---');
    console.log('1. Is the backend server running on http://localhost:5000?');
    console.log('2. If you just updated .env, did you RESTART the backend server?');
  }
}

testLogin();

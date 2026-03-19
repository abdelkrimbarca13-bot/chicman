const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    console.log('Login response:', loginRes.data);
    
    const token = loginRes.data.token;
    
    const itemsRes = await axios.get('http://localhost:5000/api/items', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Items count:', itemsRes.data.length);
    console.log('First 3 items:', itemsRes.data.slice(0, 3));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

test();

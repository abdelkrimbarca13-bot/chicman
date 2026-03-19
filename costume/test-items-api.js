const axios = require('axios');

async function testItemsEndpoint() {
  try {
    // 1. Login to get token
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    const token = loginRes.data.token;
    console.log('Login successful, token obtained');

    // 2. Fetch items
    const itemsRes = await axios.get('http://localhost:5000/api/items', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Status code:', itemsRes.status);
    console.log('Is array:', Array.isArray(itemsRes.data));
    console.log('Items count:', itemsRes.data.length);
    if (itemsRes.data.length > 0) {
        console.log('First item sample:', JSON.stringify(itemsRes.data[0], null, 2));
    }
  } catch (err) {
    console.error('Error testing endpoint:', err.response?.data || err.message);
  }
}

testItemsEndpoint();

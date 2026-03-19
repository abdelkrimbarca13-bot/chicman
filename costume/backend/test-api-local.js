const axios = require('axios');

async function testAPI() {
  const baseURL = 'http://localhost:5000/api';
  
  try {
    console.log('Testing login...');
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginRes.data.token;
    console.log('Login successful, token received.');
    
    console.log('Fetching items...');
    const itemsRes = await axios.get(`${baseURL}/items`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`Success! Found ${itemsRes.data.length} items.`);
    if (itemsRes.data.length > 0) {
      console.log('First item:', itemsRes.data[0].name);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('ERROR: Backend server is not running on port 5000!');
    } else {
      console.error('API Error:', error.response?.data || error.message);
    }
  }
}

testAPI();

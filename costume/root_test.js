async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Logged in, token obtained');

    const itemsRes = await fetch('http://localhost:5000/api/items', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const itemsData = await itemsRes.json();
    console.log('Items Count:', itemsData.length);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();

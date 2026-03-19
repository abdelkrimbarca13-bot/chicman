const http = require('http');

const baseURL = 'localhost';
const port = 5000;

function post(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: baseURL,
      port: port,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: baseURL,
      port: port,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  try {
    console.log('Logging in...');
    const loginRes = await post('/api/auth/login', { username: 'admin', password: 'admin123' });
    if (!loginRes.token) {
        console.log('Login failed:', loginRes);
        return;
    }
    console.log('Fetching items...');
    const items = await get('/api/items', loginRes.token);
    console.log(`Success! Found ${items.length} items.`);
    if (items.length > 0) {
        console.log('First item:', items[0].name);
    }
  } catch (e) {
    if (e.code === 'ECONNREFUSED') {
        console.log('BACKEND SERVER IS NOT RUNNING on port 5000');
    } else {
        console.log('Error:', e.message);
    }
  }
}

run();

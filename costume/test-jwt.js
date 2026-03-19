const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './backend/.env' });

const payload = { userId: 1, role: 'ADMIN' };
const secret = process.env.JWT_SECRET;
console.log('Secret:', secret);

const token = jwt.sign(payload, secret, { expiresIn: '1h' });
console.log('Generated Token:', token);

try {
  const decoded = jwt.verify(token, secret);
  console.log('Verify with SAME secret: SUCCESS');
} catch (err) {
  console.log('Verify with SAME secret: FAILED', err.message);
}

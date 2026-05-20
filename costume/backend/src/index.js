require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const customerRoutes = require('./routes/customerRoutes');
const rentalRoutes = require('./routes/rentalRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const cashRoutes = require('./routes/cashRoutes');
const auditRoutes = require('./routes/auditRoutes');
const saleRoutes = require('./routes/saleRoutes');
const perfumeRoutes = require('./routes/perfumeRoutes');
const productRoutes = require('./routes/productRoutes');
require('./utils/cron');

const app = express();

// Secure CORS - allow customization via env
const allowedOrigin = process.env.CLIENT_URL || '*';
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Protect against massive payloads (Denial of Service)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(compression());

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/cash', cashRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/perfumes', perfumeRoutes);
app.use('/api/products', productRoutes);

const PORT = process.env.PORT || 5000;

// Security Warning for Default/Weak JWT Secrets in Production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'super-secret-key-123') {
    console.warn('\x1b[31m%s\x1b[0m', 'CRITICAL SECURITY WARNING: Insecure JWT_SECRET detected! Please change it in production .env.');
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

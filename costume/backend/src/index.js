require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const customerRoutes = require('./routes/customerRoutes');
const rentalRoutes = require('./routes/rentalRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const cashRoutes = require('./routes/cashRoutes');
const auditRoutes = require('./routes/auditRoutes');
require('./utils/cron');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/cash', cashRoutes);
app.use('/api/audit', auditRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

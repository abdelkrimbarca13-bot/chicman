const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, auditController.getAuditLogs);

module.exports = router;

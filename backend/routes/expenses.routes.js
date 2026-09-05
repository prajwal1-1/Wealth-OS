const express = require('express');
const router = express.Router();
const { requireWealthUser } = require('../middleware/auth.middleware');
const expensesController = require('../controllers/expenses.controller');

// All expense routes require authentication
router.use(requireWealthUser);

// GET /api/wealth/cashflow/expenses
router.get('/', expensesController.getExpenses);

// POST /api/wealth/cashflow/expenses
router.post('/', expensesController.createExpense);

// GET /api/wealth/cashflow/summary
router.get('/summary', expensesController.getCashFlowSummary);

// GET /api/wealth/cashflow/trends
router.get('/trends', expensesController.getCashFlowTrends);

// GET /api/wealth/cashflow/analytics
router.get('/analytics', expensesController.getAnalytics);

// GET /api/wealth/cashflow/ca-export
router.get('/ca-export', expensesController.exportToCA);

// PUT /api/wealth/cashflow/:id
router.put('/:id', expensesController.updateExpense);

// DELETE /api/wealth/cashflow/:id
router.delete('/:id', expensesController.deleteExpense);

const multer = require('multer');
const upload = multer({ dest: 'tmp/uploads' });
router.post('/upload-statement', upload.single('statement'), expensesController.uploadStatement);

module.exports = router;


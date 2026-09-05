const express = require('express');
const router = express.Router();
const { requireWealthUser, requireCa } = require('../middleware/auth.middleware');
const { readWealthDb, writeWealthDb, auditWealth } = require('../db/database');
const { cleanWealthData } = require('../utils/helpers');

router.use(requireWealthUser);
router.use(requireCa);

router.get('/clients', (req, res) => {
  const allUsers = req.wealthDb.users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    type: u.type,
    createdAt: u.createdAt,
    lastLogin: u.lastLogin
  }));
  res.json({ success: true, clients: allUsers });
});

router.get('/clients/:id', (req, res) => {
  const targetUser = req.wealthDb.users.find(u => u.id === req.params.id);
  if (!targetUser) return res.status(404).json({ error: 'Client not found.' });
  res.json({ success: true, client: targetUser, data: targetUser.data || {} });
});

router.post('/clients/:id/data', (req, res) => {
  const targetUserId = req.params.id;
  const user = req.wealthDb.users.find(u => u.id === targetUserId);
  if (!user) return res.status(404).json({ error: 'Client not found.' });
  
  user.data = cleanWealthData(req.body);
  auditWealth(req.wealthDb, user.id, 'data.saved.by_ca', { caId: req.wealthUser.id });
  writeWealthDb(req.wealthDb);
  res.json({ success: true, message: 'Client data saved successfully.' });
});

module.exports = router;

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '20mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

app.use('/api/wealth/auth', require('./routes/auth.routes'));
app.use('/api/wealth/data', require('./routes/data.routes'));
app.use('/api/wealth/ca', require('./routes/ca.routes'));
app.use('/api/wealth/files', require('./routes/files.routes'));
app.use('/api/wealth/tax-integration', require('./routes/taxIntegration.routes'));
app.use('/api/consents', require('./routes/consents.routes'));
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/wealth/tax-calculator', require('./routes/calculator.routes'));
app.use('/api/wealth/cashflow', require('./routes/expenses.routes'));

app.use(express.static(path.join(__dirname, '..')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'wealth-os.html')));

app.listen(PORT, () => {
  console.log(`Wealth OS Backend v2 running on port ${PORT}`);
});

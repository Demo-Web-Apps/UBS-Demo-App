const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = 'supersecretkey'; // In production, use env vars
const DATA_FILE = path.join(__dirname, 'data.json');

function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load data.json:', e);
    }
  }
  return { users: [], accounts: [], transactions: [] };
}
function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ users, accounts, transactions }, null, 2));
}

// Replace in-memory data with persistent data
let { users, accounts, transactions } = loadData();

// Helper: find user by email
function findUser(email) {
  return users.find(u => u.email === email);
}

const authenticate = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Register endpoint
app.post('/api/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required.' });
  }
  if (findUser(email)) {
    return res.status(409).json({ error: 'User already exists.' });
  }
  const user = { email, password };
  users.push(user);
  // Create a default account for the user
  const account = { email, balance: 1000, accountNumber: 'TD' + (accounts.length + 1).toString().padStart(6, '0') };
  accounts.push(account);
  saveData(); // Save after registration
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token });
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = findUser(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token });
});

// Get account info and recent transactions
app.get('/api/account', authenticate, (req, res) => {
  const { email } = req.user;
  const account = accounts.find(a => a.email === email);
  if (!account) return res.status(404).json({ error: 'Account not found' });
  const recent = transactions.filter(t => t.email === email).slice(-5).reverse();
  res.json({ account, recentTransactions: recent });
});

// Transfer funds between accounts
app.post('/api/transfer', authenticate, (req, res) => {
  const { toAccountNumber, amount } = req.body;
  const { email } = req.user;
  const fromAccount = accounts.find(a => a.email === email);
  const toAccount = accounts.find(a => a.accountNumber === toAccountNumber);
  if (!fromAccount || !toAccount) return res.status(404).json({ error: 'Account not found.' });
  if (fromAccount.accountNumber === toAccountNumber) return res.status(400).json({ error: 'Cannot transfer to the same account.' });
  if (amount <= 0) return res.status(400).json({ error: 'Amount must be positive.' });
  if (fromAccount.balance < amount) return res.status(400).json({ error: 'Insufficient funds.' });
  fromAccount.balance -= amount;
  toAccount.balance += amount;
  const date = new Date().toLocaleString();
  transactions.push({ email, type: 'Transfer Out', amount, date, to: toAccountNumber });
  transactions.push({ email: toAccount.email, type: 'Transfer In', amount, date, from: fromAccount.accountNumber });
  saveData(); // Save after transfer
  res.json({ success: true });
});

// Pay a bill
app.post('/api/paybill', authenticate, (req, res) => {
  const { biller, amount } = req.body;
  const { email } = req.user;
  const account = accounts.find(a => a.email === email);
  if (!account) return res.status(404).json({ error: 'Account not found.' });
  if (amount <= 0) return res.status(400).json({ error: 'Amount must be positive.' });
  if (account.balance < amount) return res.status(400).json({ error: 'Insufficient funds.' });
  account.balance -= amount;
  const date = new Date().toLocaleString();
  transactions.push({ email, type: 'Bill Payment', amount, date, biller });
  saveData(); // Save after bill payment
  res.json({ success: true });
});

// Get full transaction history
app.get('/api/history', authenticate, (req, res) => {
  const { email } = req.user;
  const history = transactions.filter(t => t.email === email).reverse();
  res.json({ history });
});

// Get user profile info
app.get('/api/profile', authenticate, (req, res) => {
  const { email } = req.user;
  const user = users.find(u => u.email === email);
  const account = accounts.find(a => a.email === email);
  if (!user || !account) return res.status(404).json({ error: 'User not found.' });
  res.json({ email: user.email, accountNumber: account.accountNumber });
});

// Update user email
app.post('/api/profile', authenticate, (req, res) => {
  const { email } = req.user;
  const { newEmail } = req.body;
  if (!newEmail) return res.status(400).json({ error: 'New email required.' });
  if (findUser(newEmail)) return res.status(409).json({ error: 'Email already in use.' });
  const user = users.find(u => u.email === email);
  const account = accounts.find(a => a.email === email);
  if (!user || !account) return res.status(404).json({ error: 'User not found.' });
  user.email = newEmail;
  account.email = newEmail;
  req.user.email = newEmail;
  saveData(); // Save after profile update
  res.json({ success: true, email: newEmail });
});

// Change password
app.post('/api/change-password', authenticate, (req, res) => {
  const { email } = req.user;
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Old and new password required.' });
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (user.password !== oldPassword) return res.status(401).json({ error: 'Incorrect old password.' });
  user.password = newPassword;
  saveData(); // Save after password change
  res.json({ success: true });
});

app.get('/', (req, res) => {
  res.send('Banking API running');
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
}); 
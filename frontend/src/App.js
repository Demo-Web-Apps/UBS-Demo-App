import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import './App.css';
import { Routes, Route, Navigate, useNavigate, NavLink } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

const API_URL = 'http://localhost:4000/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed.');
      } else {
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="login-page">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} data-testid="login-form" aria-label="Login form">
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          data-testid="login-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="username"
          required
          aria-required="true"
          aria-label="Email address"
          aria-describedby="login-email-desc"
        />
        <span id="login-email-desc" style={{display:'none'}}>Enter your email address</span>
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          data-testid="login-password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          aria-required="true"
          aria-label="Password"
          aria-describedby="login-password-desc"
        />
        <span id="login-password-desc" style={{display:'none'}}>Enter your password</span>
        {error && <div data-testid="login-error" style={{color: 'red'}} role="alert" aria-live="assertive">{error}</div>}
        <button type="submit" data-testid="login-submit" disabled={loading} aria-label="Login">{loading ? 'Logging in...' : 'Login'}</button>
      </form>
      <button onClick={() => navigate('/register')} data-testid="to-register" aria-label="Go to registration page">Don't have an account? Register</button>
    </div>
  );
};

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed.');
      } else {
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="register-page">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} data-testid="register-form" aria-label="Registration form">
        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          data-testid="register-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="username"
          required
          aria-required="true"
          aria-label="Email address"
          aria-describedby="register-email-desc"
        />
        <span id="register-email-desc" style={{display:'none'}}>Enter your email address</span>
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          data-testid="register-password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          aria-required="true"
          aria-label="Password"
          aria-describedby="register-password-desc"
        />
        <span id="register-password-desc" style={{display:'none'}}>Enter your password</span>
        <label htmlFor="register-confirm-password">Confirm Password</label>
        <input
          id="register-confirm-password"
          data-testid="register-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
          aria-required="true"
          aria-label="Confirm password"
          aria-describedby="register-confirm-password-desc"
        />
        <span id="register-confirm-password-desc" style={{display:'none'}}>Re-enter your password to confirm</span>
        {error && <div data-testid="register-error" style={{color: 'red'}} role="alert" aria-live="assertive">{error}</div>}
        <button type="submit" data-testid="register-submit" disabled={loading} aria-label="Register">{loading ? 'Registering...' : 'Register'}</button>
      </form>
      <button onClick={() => navigate('/login')} data-testid="to-login" aria-label="Go to login page">Already have an account? Login</button>
    </div>
  );
};

const Dashboard = ({ refreshTrigger }) => {
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/account', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.status === 401) { localStorage.removeItem('token'); navigate('/login', { replace: true }); return; }
      if (!res.ok) {
        setError('Failed to load account data.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setAccount(data.account);
      setTransactions(data.transactions || data.recentTransactions || []);
      setError('');
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData, refreshTrigger]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) return <div data-testid="dashboard-page"><h2>Dashboard</h2><div>Loading...</div></div>;
  if (!account && !error) return null;

  return (
    <div data-testid="dashboard-page" aria-label="Dashboard">
      <h2>Dashboard</h2>
      {error && <div data-testid="dashboard-error" style={{color:'#d32f2f',marginBottom:12}} role="alert" aria-live="assertive">{error}</div>}
      {account && (
        <>
          <div data-testid="account-info" style={{marginBottom:24}} aria-label="Account information">
            <div><strong>Account Number:</strong> <span data-testid="account-number" aria-label="Account number">{account.accountNumber}</span></div>
            <div><strong>Balance:</strong> <span data-testid="account-balance" aria-label="Account balance">${account.balance.toFixed(2)}</span></div>
          </div>
          <div data-testid="recent-transactions" aria-label="Recent transactions" role="region" aria-live="polite">
            <strong>Recent Transactions</strong>
            {transactions.length === 0 ? (
              <div data-testid="no-transactions">No recent transactions.</div>
            ) : (
              <ul>
                {transactions.map((t, i) => (
                  <li key={i} data-testid="transaction-item" aria-label={`Transaction: ${t.type}, $${t.amount.toFixed(2)}, ${t.date}`}> 
                    <span>{t.type} </span>
                    <span>${t.amount.toFixed(2)} </span>
                    <span>{t.date}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
      <button onClick={handleLogout} data-testid="logout-btn" style={{marginTop:24}} aria-label="Log out">Log out</button>
    </div>
  );
};
const Transfer = ({ onSuccess }) => {
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [biller, setBiller] = useState('');
  const [tab, setTab] = useState('transfer');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const showToast = useToast();

  const handleTransfer = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    if (!toAccount || !amount) {
      setError('Please fill in all fields.'); return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ toAccountNumber: toAccount, amount: Number(amount) })
      });
      if (res.status === 401) { localStorage.removeItem('token'); navigate('/login', { replace: true }); return; }
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Transfer failed.');
        showToast(data.error || 'Transfer failed.', 'error');
      } else {
        setMessage('Transfer successful!');
        showToast('Transfer successful!', 'success');
        setToAccount(''); setAmount('');
        if (onSuccess) onSuccess();
      }
    } catch {
      setError('Network error. Please try again.');
      showToast('Network error. Please try again.', 'error');
    }
    setLoading(false);
  };

  const handleBill = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    if (!biller || !amount) {
      setError('Please fill in all fields.'); return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/bill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ biller, amount: Number(amount) })
      });
      if (res.status === 401) { localStorage.removeItem('token'); navigate('/login', { replace: true }); return; }
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Bill payment failed.');
        showToast(data.error || 'Bill payment failed.', 'error');
      } else {
        setMessage('Bill payment successful!');
        showToast('Bill payment successful!', 'success');
        setBiller(''); setAmount('');
        if (onSuccess) onSuccess();
      }
    } catch {
      setError('Network error. Please try again.');
      showToast('Network error. Please try again.', 'error');
    }
    setLoading(false);
  };

  return (
    <div data-testid="transfer-page" aria-label="Transfer and Bill Payment">
      <h2>Transfer & Bill Payment</h2>
      <div style={{display:'flex',justifyContent:'center',gap:16,marginBottom:24}} role="tablist" aria-label="Transfer or Bill Payment tabs" data-testid="tablist">
        <button data-testid="tab-transfer" style={{background:tab==='transfer'?'#53b848':'#e0e0e0',color:tab==='transfer'?'#fff':'#333',border:'none',borderRadius:8,padding:'8px 24px',fontWeight:600,cursor:'pointer'}} onClick={()=>{setTab('transfer');setMessage('');setError('')}} role="tab" aria-selected={tab==='transfer'} aria-controls="transfer-panel" id="tab-transfer-btn">Transfer</button>
        <button data-testid="tab-bill" style={{background:tab==='bill'?'#53b848':'#e0e0e0',color:tab==='bill'?'#fff':'#333',border:'none',borderRadius:8,padding:'8px 24px',fontWeight:600,cursor:'pointer'}} onClick={()=>{setTab('bill');setMessage('');setError('')}} role="tab" aria-selected={tab==='bill'} aria-controls="bill-panel" id="tab-bill-btn">Pay Bill</button>
      </div>
      {tab === 'transfer' ? (
        <form onSubmit={handleTransfer} data-testid="transfer-form" id="transfer-panel" aria-labelledby="tab-transfer-btn" aria-label="Transfer form" style={{maxWidth:350,margin:'0 auto',background:'#f8f8f8',padding:24,borderRadius:12,boxShadow:'0 2px 12px rgba(0,101,58,0.06)',display:'flex',flexDirection:'column',gap:12}}>
          <label htmlFor="to-account">To Account Number</label>
          <input id="to-account" data-testid="to-account" value={toAccount} onChange={e=>setToAccount(e.target.value)} required aria-required="true" aria-label="To account number" />
          <label htmlFor="transfer-amount">Amount</label>
          <input id="transfer-amount" data-testid="transfer-amount" type="number" min="1" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} required aria-required="true" aria-label="Transfer amount" />
          {error && <div data-testid="transfer-error" style={{color:'#d32f2f'}} role="alert" aria-live="assertive">{error}</div>}
          {message && <div data-testid="transfer-success" style={{color:'#388e3c'}} role="status" aria-live="polite">{message}</div>}
          <button type="submit" data-testid="transfer-submit" disabled={loading} aria-label="Submit transfer">{loading?'Transferring...':'Transfer'}</button>
        </form>
      ) : (
        <form onSubmit={handleBill} data-testid="bill-form" id="bill-panel" aria-labelledby="tab-bill-btn" aria-label="Bill payment form" style={{maxWidth:350,margin:'0 auto',background:'#f8f8f8',padding:24,borderRadius:12,boxShadow:'0 2px 12px rgba(0,101,58,0.06)',display:'flex',flexDirection:'column',gap:12}}>
          <label htmlFor="biller">Biller Name</label>
          <input id="biller" data-testid="biller" value={biller} onChange={e=>setBiller(e.target.value)} required aria-required="true" aria-label="Biller name" />
          <label htmlFor="bill-amount">Amount</label>
          <input id="bill-amount" data-testid="bill-amount" type="number" min="1" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} required aria-required="true" aria-label="Bill amount" />
          {error && <div data-testid="bill-error" style={{color:'#d32f2f'}} role="alert" aria-live="assertive">{error}</div>}
          {message && <div data-testid="bill-success" style={{color:'#388e3c'}} role="status" aria-live="polite">{message}</div>}
          <button type="submit" data-testid="bill-submit" disabled={loading} aria-label="Submit bill payment">{loading?'Paying...':'Pay Bill'}</button>
        </form>
      )}
    </div>
  );
};
const Profile = ({ userEmail }) => {
  const [email, setEmail] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const showToast = useToast();

  // Move fetchProfile to top-level so it can be reused
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.status === 401) { localStorage.removeItem('token'); navigate('/login', { replace: true }); return; }
      if (!res.ok) { setError('Failed to load profile.'); setLoading(false); return; }
      const data = await res.json();
      setEmail(data.email);
      setAccountNumber(data.accountNumber);
      setNewEmail('');
      setError('');
    } catch { setError('Network error. Please try again.'); }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    if (!newEmail) return;
    setMessage(''); setError('');
    try {
      const res = await fetch('http://localhost:4000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email: newEmail })
      });
      if (res.status === 401) { localStorage.removeItem('token'); navigate('/login', { replace: true }); return; }
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to update email.');
        showToast(data.error || 'Failed to update email.', 'error');
      } else {
        setMessage('Email updated successfully!');
        showToast('Email updated successfully!', 'success');
        setNewEmail('');
        fetchProfile();
      }
    } catch {
      setError('Network error. Please try again.');
      showToast('Network error. Please try again.', 'error');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;
    setMessage(''); setError('');
    try {
      const res = await fetch('http://localhost:4000/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      if (res.status === 401) { localStorage.removeItem('token'); navigate('/login', { replace: true }); return; }
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to change password.');
        showToast(data.error || 'Failed to change password.', 'error');
      } else {
        setMessage('Password changed successfully!');
        showToast('Password changed successfully!', 'success');
        setOldPassword(''); setNewPassword('');
      }
    } catch {
      setError('Network error. Please try again.');
      showToast('Network error. Please try again.', 'error');
    }
  };

  if (loading) return <div data-testid="profile-page"><h2>Profile</h2><div>Loading...</div></div>;

  return (
    <div data-testid="profile-page" aria-label="Profile">
      <div className="profile-avatar" aria-label="User avatar" data-testid="profile-avatar">
        {getInitials(userEmail || email)}
      </div>
      <h2>Profile</h2>
      {error && <div data-testid="profile-error" style={{color:'#d32f2f',marginBottom:12}} role="alert" aria-live="assertive">{error}</div>}
      {message && <div data-testid="profile-success" style={{color:'#388e3c',marginBottom:12}} role="status" aria-live="polite">{message}</div>}
      <div style={{background:'linear-gradient(120deg,#fff 60%,#e0f7fa 100%)',borderRadius:18,boxShadow:'0 4px 24px rgba(0,101,58,0.08)',padding:32,maxWidth:420,margin:'0 auto 24px auto',border:'1.5px solid #e0e0e0'}} aria-label="Profile information">
        <div><strong>Email:</strong> <span data-testid="profile-email" aria-label="Email address">{email}</span></div>
        <div><strong>Account Number:</strong> <span data-testid="profile-account" aria-label="Account number">{accountNumber}</span></div>
      </div>
      <form onSubmit={handleEmailUpdate} data-testid="email-form" style={{maxWidth:420,margin:'0 auto 24px auto',background:'#f8f8f8',padding:24,borderRadius:12,boxShadow:'0 2px 12px rgba(0,101,58,0.06)',display:'flex',flexDirection:'column',gap:12}} aria-label="Update email form">
        <label htmlFor="new-email">Update Email</label>
        <input id="new-email" data-testid="new-email" type="email" value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="New email" required aria-required="true" aria-label="New email address" />
        <button type="submit" data-testid="update-email-btn" aria-label="Update email">Update Email</button>
      </form>
      <form onSubmit={handlePasswordChange} data-testid="password-form" style={{maxWidth:420,margin:'0 auto',background:'#f8f8f8',padding:24,borderRadius:12,boxShadow:'0 2px 12px rgba(0,101,58,0.06)',display:'flex',flexDirection:'column',gap:12}} aria-label="Change password form">
        <label htmlFor="old-password">Current Password</label>
        <input id="old-password" data-testid="old-password" type="password" value={oldPassword} onChange={e=>setOldPassword(e.target.value)} placeholder="Current password" required aria-required="true" aria-label="Current password" />
        <label htmlFor="new-password">New Password</label>
        <input id="new-password" data-testid="new-password" type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="New password" required aria-required="true" aria-label="New password" />
        <button type="submit" data-testid="change-password-btn" aria-label="Change password">Change Password</button>
      </form>
    </div>
  );
};
const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:4000/api/history', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.status === 401) { localStorage.removeItem('token'); navigate('/login', { replace: true }); return; }
        if (!res.ok) {
          setError('Failed to load transaction history.');
          setLoading(false);
          return;
        }
        const data = await res.json();
        setHistory(data.history || []);
        setError('');
      } catch {
        setError('Network error. Please try again.');
      }
      setLoading(false);
    };
    fetchHistory();
  }, [navigate]);

  const filtered = history.filter(t => {
    const matchesType = type ? t.type === type : true;
    const matchesSearch = search ? (
      t.type.toLowerCase().includes(search.toLowerCase()) ||
      (t.amount + '').includes(search) ||
      (t.date && t.date.toLowerCase().includes(search.toLowerCase())) ||
      (t.biller && t.biller.toLowerCase().includes(search.toLowerCase())) ||
      (t.to && t.to.toLowerCase().includes(search.toLowerCase())) ||
      (t.from && t.from.toLowerCase().includes(search.toLowerCase()))
    ) : true;
    return matchesType && matchesSearch;
  });

  // Export CSV logic
  function exportCSV() {
    if (!filtered.length) return;
    const headers = ["Type", "Amount", "Date", "Biller", "To", "From"];
    const rows = filtered.map(t => [
      t.type,
      t.amount,
      t.date,
      t.biller || '',
      t.to || '',
      t.from || ''
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0,10);
    a.download = `transactions-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }

  return (
    <div data-testid="history-page" aria-label="Transaction History">
      <h2>Transaction History</h2>
      <div style={{maxWidth:420,margin:'0 auto 24px auto',display:'flex',gap:12}}>
        <input
          data-testid="history-search"
          type="text"
          placeholder="Search by type, amount, date, biller..."
          value={search}
          onChange={e=>setSearch(e.target.value)}
          style={{flex:1,padding:10,borderRadius:6,border:'1.5px solid #b2b2b2'}}
          aria-label="Search transactions"
        />
        <select data-testid="history-type" value={type} onChange={e=>setType(e.target.value)} style={{padding:10,borderRadius:6,border:'1.5px solid #b2b2b2'}} aria-label="Filter by transaction type">
          <option value="">All Types</option>
          <option value="Transfer Out">Transfer Out</option>
          <option value="Transfer In">Transfer In</option>
          <option value="Bill Payment">Bill Payment</option>
        </select>
        <button
          type="button"
          onClick={exportCSV}
          style={{background:'#53b848',color:'#fff',border:'none',borderRadius:8,padding:'10px 18px',fontWeight:600,cursor:'pointer',transition:'background 0.2s'}} 
          aria-label="Export transaction history as CSV"
          data-testid="export-csv-btn"
          disabled={filtered.length === 0}
        >
          Export CSV
        </button>
      </div>
      <div data-testid="history-list" style={{background:'linear-gradient(120deg,#fff 60%,#e0f7fa 100%)',borderRadius:18,boxShadow:'0 4px 24px rgba(0,101,58,0.08)',padding:32,maxWidth:420,margin:'0 auto',border:'1.5px solid #e0e0e0'}} aria-label="Transaction list" role="region" aria-live="polite">
        {error && <div data-testid="history-error" style={{color:'#d32f2f',marginBottom:12}} role="alert" aria-live="assertive">{error}</div>}
        {loading ? <div>Loading...</div> : filtered.length === 0 ? <div data-testid="no-history">No transactions found.</div> : (
          <ul style={{listStyle:'none',padding:0,margin:0}}>
            {filtered.map((t,i) => (
              <li key={i} data-testid="history-item" style={{display:'flex',flexDirection:'column',gap:2,padding:'12px 0',borderBottom:'1px solid #e0e0e0'}} aria-label={`Transaction: ${t.type}, $${t.amount.toFixed(2)}, ${t.date}`}> 
                <span><strong>{t.type}</strong> <span style={{color:'#00653a'}}>${t.amount.toFixed(2)}</span></span>
                <span style={{color:'#888',fontSize:'0.98rem'}}>{t.date}</span>
                {t.biller && <span>Biller: {t.biller}</span>}
                {t.to && <span>To: {t.to}</span>}
                {t.from && <span>From: {t.from}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// Add helper to get initials from email
function getInitials(email) {
  if (!email) return 'U';
  const [name] = email.split('@');
  if (!name) return email[0].toUpperCase();
  const parts = name.split(/[._-]/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Toast context and provider
const ToastContext = createContext();
export function useToast() { return useContext(ToastContext); }

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const showToast = (message, type = 'info', duration = 3500) => {
    const id = toastId.current++;
    setToasts(ts => [...ts, { id, message, type }]);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), duration);
  };

  const removeToast = id => setToasts(ts => ts.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          tabIndex={0}
          role="status"
          onClick={() => onRemove(t.id)}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onRemove(t.id)}
          aria-label={t.message}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

function App() {
  const [refresh, setRefresh] = useState(0);
  const isLoggedIn = !!localStorage.getItem('token');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const [userEmail, setUserEmail] = useState('');
  const showToast = useToast();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch user email for avatar
  useEffect(() => {
    if (!isLoggedIn) { setUserEmail(''); return; }
    fetch('http://localhost:4000/api/profile', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setUserEmail(data.email || ''))
      .catch(() => setUserEmail(''));
  }, [isLoggedIn]);

  // Session timeout/auto-logout
  useEffect(() => {
    if (!isLoggedIn) return;
    let timeout;
    const logout = () => {
      localStorage.removeItem('token');
      showToast('Session expired. Please log in again.', 'error');
      window.location.href = '/login';
    };
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(logout, 15 * 60 * 1000); // 15 minutes
    };
    // Listen for user activity
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('mousedown', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    resetTimer();
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('mousedown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
    };
  }, [isLoggedIn, showToast]);

  return (
    <ToastProvider>
      <div className="App" data-testid="app-root">
        <header className="App-header">
          <img src="/ubs-logo.png" className="App-logo" alt="UBS Bank Logo" />
          <h1 id="bank-title">UBS Bank Demo</h1>
          <p id="bank-tagline">Modern Banking Experience</p>
        </header>
        {isLoggedIn && (
          <nav className="App-nav" data-testid="nav-bar" aria-label="Main navigation">
            {isMobile ? (
              <button
                className="burger-menu-btn"
                aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-controls="mobile-menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(m => !m)}
                data-testid="burger-menu-btn"
              >
                <span className="burger-icon" aria-hidden="true" data-testid="burger-icon">
                  <span data-testid="burger-bar-1"></span><span data-testid="burger-bar-2"></span><span data-testid="burger-bar-3"></span>
                </span>
              </button>
            ) : (
              <>
                <span className="nav-avatar" aria-label="User avatar" data-testid="nav-avatar">
                  {getInitials(userEmail)}
                </span>
                <NavLink to="/dashboard" data-testid="nav-dashboard" className={({isActive})=>isActive?"nav-link active":"nav-link"}>Dashboard</NavLink>
                <NavLink to="/transfer" data-testid="nav-transfer" className={({isActive})=>isActive?"nav-link active":"nav-link"}>Transfer</NavLink>
                <NavLink to="/history" data-testid="nav-history" className={({isActive})=>isActive?"nav-link active":"nav-link"}>History</NavLink>
                <NavLink to="/profile" data-testid="nav-profile" className={({isActive})=>isActive?"nav-link active":"nav-link"}>Profile</NavLink>
              </>
            )}
          </nav>
        )}
        {/* Mobile menu and backdrop rendered at root level */}
        {isMobile && isLoggedIn && (
          <>
            <div
              className="mobile-menu-backdrop"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
              data-testid="mobile-menu-backdrop"
              style={{ display: menuOpen ? 'block' : 'none' }}
            />
            <div
              id="mobile-menu"
              className={`mobile-menu${menuOpen ? ' open' : ''}`}
              role="menu"
              aria-label="Mobile navigation menu"
              style={{ display: menuOpen ? 'flex' : 'none' }}
              data-testid="mobile-menu"
            >
              <span className="nav-avatar mobile" aria-label="User avatar" data-testid="nav-avatar-mobile">
                {getInitials(userEmail)}
              </span>
              <NavLink to="/dashboard" data-testid="nav-dashboard-mobile" className={({isActive})=>isActive?"nav-link active":"nav-link"} role="menuitem" onClick={()=>setMenuOpen(false)}>Dashboard</NavLink>
              <NavLink to="/transfer" data-testid="nav-transfer-mobile" className={({isActive})=>isActive?"nav-link active":"nav-link"} role="menuitem" onClick={()=>setMenuOpen(false)}>Transfer</NavLink>
              <NavLink to="/history" data-testid="nav-history-mobile" className={({isActive})=>isActive?"nav-link active":"nav-link"} role="menuitem" onClick={()=>setMenuOpen(false)}>History</NavLink>
              <NavLink to="/profile" data-testid="nav-profile-mobile" className={({isActive})=>isActive?"nav-link active":"nav-link"} role="menuitem" onClick={()=>setMenuOpen(false)}>Profile</NavLink>
            </div>
          </>
        )}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard refreshTrigger={refresh} /></ProtectedRoute>} />
          <Route path="/transfer" element={<ProtectedRoute><Transfer onSuccess={()=>setRefresh(r=>r+1)} /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile userEmail={userEmail} /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>
    </ToastProvider>
  );
}

export default App;

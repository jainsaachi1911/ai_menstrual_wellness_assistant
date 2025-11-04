const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Dummy user store
const users = [];

// /signup endpoint
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  users.push({ username, password });
  res.json({ success: true, message: 'Signup successful' });
});

// /login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  res.json({ success: true, message: 'Login successful', user });
});

// /user endpoint
app.get('/user', (req, res) => {
  // For demo, return all users
  res.json({ users });
});

app.put('/user', (req, res) => {
  // For demo, update user info
  const { username, newData } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).json({ error: 'User not found' });
  Object.assign(user, newData);
  res.json({ success: true, user });
});

// /analysis endpoint
app.post('/analysis', (req, res) => {
  // Forward to Python backend or mock response
  // For now, just echo the data
  res.json({ success: true, results: req.body });
});

// /home endpoint
app.get('/home', (req, res) => {
  // Serve the React app's index.html
  res.sendFile(require('path').join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});

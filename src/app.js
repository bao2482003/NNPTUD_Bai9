const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

app.use('/auth', require('./routes/authRoutes'));
app.use('/messages', require('./routes/messageRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'Message API đang chạy ✓' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route không tồn tại' });
});

module.exports = app;

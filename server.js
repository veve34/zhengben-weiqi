require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/member');
const articleRoutes = require('./routes/articles');
const adminRoutes = require('./routes/admin');
const adminMembersRoutes = require('./routes/adminMembers');
const listingRoutes = require('./routes/listings');
const adminListingsRoutes = require('./routes/adminListings');

if (!process.env.JWT_SECRET || !process.env.ADMIN_PASSWORD) {
  console.error('请先复制 .env.example 为 .env，并设置 JWT_SECRET 与 ADMIN_PASSWORD');
  process.exit(1);
}

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/member', memberRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/members', adminMembersRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/admin/listings', adminListingsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log('正本围棋后端已启动：http://localhost:' + PORT);
});

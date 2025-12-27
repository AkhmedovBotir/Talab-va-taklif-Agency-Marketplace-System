require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/database');
const { initializeSocket } = require('./config/socket');
const { connectRedis } = require('./config/redis');

// Import routes
const adminRoutes = require('./routes/adminRoutes');
const regionRoutes = require('./routes/regionRoutes');
const contragentRoutes = require('./routes/contragentRoutes');
const contragentOrderRoutes = require('./routes/contragentOrderRoutes');
const agentRoutes = require('./routes/agentRoutes');
const agentOrderRoutes = require('./routes/agentOrderRoutes');
const punktRoutes = require('./routes/punktRoutes');
const punktOrderRoutes = require('./routes/punktOrderRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const vacancyAuthRoutes = require('./routes/vacancyAuthRoutes');
const vacancyApplicationRoutes = require('./routes/vacancyApplicationRoutes');
const vacancyProfileRoutes = require('./routes/vacancyProfileRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const agentFinanceRoutes = require('./routes/agentFinanceRoutes');
const adminFinanceRoutes = require('./routes/adminFinanceRoutes');
const adminKpiPaymentRoutes = require('./routes/adminKpiPaymentRoutes');
const adminContragentPaymentRoutes = require('./routes/adminContragentPaymentRoutes');
const contragentTypeRoutes = require('./routes/contragentTypeRoutes');
const deviceVerificationRoutes = require('./routes/deviceVerificationRoutes');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);

// Connect to MongoDB
connectDB();

// Connect to Redis
connectRedis();


// Middleware
app.use(cors());
app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ extended: true, limit: '1gb' }));

// Routes
app.use('/api/admins', adminRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/contragents', contragentRoutes);
app.use('/api/contragent', contragentOrderRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/agent', agentOrderRoutes);
app.use('/api/punkts', punktRoutes);
app.use('/api/punkt', punktOrderRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/product', productRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/vacancy-auth', vacancyAuthRoutes);
app.use('/api/vacancy', vacancyApplicationRoutes);
app.use('/api/vacancy-profile', vacancyProfileRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/agent-finance', agentFinanceRoutes);
app.use('/api/admin-finance', adminFinanceRoutes);
app.use('/api/admin-kpi-payments', adminKpiPaymentRoutes);
app.use('/api/admin-contragent-payments', adminContragentPaymentRoutes);
app.use('/api/contragent-types', contragentTypeRoutes);
app.use('/api/device-verification', deviceVerificationRoutes);
// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server ishlamoqda',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route topilmadi',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server xatosi',
  });
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = { app, io };


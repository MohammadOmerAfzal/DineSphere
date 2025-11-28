const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { redisClient } = require('./redis');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();

  io.adapter(createAdapter(pubClient, subClient));

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    socket.on('join-tenant', (tenantId) => {
      socket.join(`tenant:${tenantId}`);
      console.log(`👥 Socket ${socket.id} joined tenant: ${tenantId}`);
    });

    socket.on('join-order', (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`📦 Socket ${socket.id} joined order: ${orderId}`);
    });

    socket.on('leave-tenant', (tenantId) => {
      socket.leave(`tenant:${tenantId}`);
      console.log(`🚪 Socket ${socket.id} left tenant: ${tenantId}`);
    });

    socket.on('leave-order', (orderId) => {
      socket.leave(`order:${orderId}`);
      console.log(`🚪 Socket ${socket.id} left order: ${orderId}`);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });

  console.log('✅ Socket.IO server initialized with Redis adapter');
  return io;
};

const emitOrderUpdate = async (targetId, data) => {
  if (io) {
    if (data.type === 'ORDER_CREATED') {
      io.to(`tenant:${targetId}`).emit('order_update', data);
      console.log(`📢 Order created event emitted to tenant: ${targetId}`);
    }
    
    if (data.type === 'ORDER_STATUS_UPDATED') {
      io.to(`tenant:${targetId}`).emit('order_update', data);

      io.to(`order:${data.orderId}`).emit('order_update', data);
      
      console.log(`🔄 Order status update emitted to tenant: ${targetId} and order: ${data.orderId}`);
    }
    
    if (['RIDER_ASSIGNED', 'ORDER_CANCELLED', 'PAYMENT_UPDATED'].includes(data.type)) {
      io.to(`tenant:${targetId}`).emit('order_update', data);
      io.to(`order:${data.orderId}`).emit('order_update', data);
      console.log(`📢 ${data.type} event emitted to tenant: ${targetId} and order: ${data.orderId}`);
    }
  }
};

const emitMetricsUpdate = async (tenantId, metrics) => {
  if (io) {
    io.to(`tenant:${tenantId}`).emit('metrics_update', {
      ...metrics,
      tenantId: tenantId,
      timestamp: new Date().toISOString()
    });
    console.log(`📊 Metrics update emitted to tenant: ${tenantId}`);
  }
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
  emitOrderUpdate,
  emitMetricsUpdate
};
const Order  =require("../models/orderModel.js");

const orderRepository = {
  // Create new order
  async create(orderData) {
    const order = new Order(orderData);
    return await order.save();
  },

  // Find order by ID
  async findById(orderId, populateFields = []) {
    let query = Order.findById(orderId);
    
    if (populateFields.includes('customer')) {
      query = query.populate('customerId', 'email profile firstName lastName phone');
    }
    
    if (populateFields.includes('restaurant')) {
      query = query.populate('restaurantId', 'basicInfo contact address settings');
    }
    
    if (populateFields.includes('rider')) {
      query = query.populate('riderInfo.riderId', 'email profile firstName lastName phone');
    }
    
    return await query;
  },

  // Find order by order number
  async findByOrderNumber(orderNumber) {
    return await Order.findOne({ orderNumber })
      .populate('customerId', 'email profile firstName lastName phone')
      .populate('restaurantId', 'basicInfo contact address settings')
      .populate('riderInfo.riderId', 'email profile firstName lastName phone');
  },

  // Find orders by customer
  async findByCustomer(customerId, options = {}) {
    const {
      page = 1,
      limit = 20,
      sort = { createdAt: -1 },
      status
    } = options;

    const query = { customerId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('restaurantId', 'basicInfo contact')
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await Order.countDocuments(query);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  // Find orders by restaurant
  async findByRestaurant(restaurantId, options = {}) {
    const {
      page = 1,
      limit = 20,
      sort = { createdAt: -1 },
      status
    } = options;

    const query = { restaurantId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('customerId', 'email profile firstName lastName phone')
      .populate('riderInfo.riderId', 'email profile firstName lastName phone')
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await Order.countDocuments(query);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  // Update order status
  async updateStatus(orderId, newStatus, note = '', actor = 'system') {
    const order = await Order.findById(orderId);
    if (!order) return null;

    order.status = newStatus;
    order.timeline.push({
      status: newStatus,
      timestamp: new Date(),
      notes: note || `Order status updated to ${newStatus}`,
      actor: actor
    });

    // Set delivery time if status is delivered
    if (newStatus === 'delivered') {
      order.riderInfo.deliveryTime = new Date();
    }

    return await order.save();
  },

  // Update order
  async update(orderId, updateData) {
    return await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true, runValidators: true }
    );
  },

  // Assign rider to order
  async assignRider(orderId, riderId) {
    return await Order.findByIdAndUpdate(
      orderId,
      {
        'riderInfo.riderId': riderId,
        'riderInfo.assignedAt': new Date(),
        status: 'out_for_delivery'
      },
      { new: true }
    ).populate('riderInfo.riderId', 'email profile firstName lastName phone');
  },

  // Update payment status
  async updatePaymentStatus(orderId, paymentStatus, transactionId = null) {
    const updateData = {
      'payment.status': paymentStatus
    };

    if (paymentStatus === 'completed') {
      updateData['payment.paidAt'] = new Date();
    }

    if (transactionId) {
      updateData['payment.transactionId'] = transactionId;
    }

    return await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    );
  },

  // Get orders by status
  async findByStatus(status, options = {}) {
    const {
      page = 1,
      limit = 50,
      sort = { createdAt: -1 }
    } = options;

    const orders = await Order.find({ status })
      .populate('customerId', 'email profile firstName lastName phone')
      .populate('restaurantId', 'basicInfo contact')
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await Order.countDocuments({ status });

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  // Get today's orders for restaurant
  async getTodaysOrders(restaurantId) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return await Order.find({
      restaurantId,
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
    .populate('customerId', 'email profile firstName lastName phone')
    .sort({ createdAt: -1 });
  },

  // Get order statistics
  async getOrderStats(restaurantId, period = 'today') {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const query = { 
      restaurantId,
      createdAt: { $gte: startDate }
    };

    const stats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.total' }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments(query);
    const totalRevenue = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricing.total' }
        }
      }
    ]);

    return {
      period,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      statusBreakdown: stats
    };
  },

  // Delete order (soft delete)
  async delete(orderId) {
    return await Order.findByIdAndUpdate(
      orderId,
      { status: 'cancelled' },
      { new: true }
    );
  }
};

module.exports={ orderRepository };
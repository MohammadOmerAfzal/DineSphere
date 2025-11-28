const { orderRepository } = require('../repository/orderRepository.js');
const Restaurant = require('../models/restaurantModel.js');
const { producer } = require('../config/kafka');
const { emitOrderUpdate } = require('../config/socket');

const orderService = {
  // Create new order with Kafka event publishing
  async createOrder(orderData, customerId) {
    try {
      console.log('🎯 [Order Service] Creating order for customer:', customerId);
      
      // Validate restaurant exists
      const restaurant = await Restaurant.findById(orderData.restaurantId);
      if (!restaurant) {
        return {
          success: false,
          message: 'Restaurant not found',
          statusCode: 404
        };
      }

      const pricing = await this.calculatePricing(orderData.items, orderData.restaurantId);
      
      const orderWithCustomer = {
        ...orderData,
        customerId,
        tenantId: orderData.restaurantId, // Using restaurantId as tenant ID
        pricing,
        timeline: [{
          status: 'pending',
          timestamp: new Date(),
          notes: 'Order placed successfully',
          actor: 'customer'
        }]
      };


      const order = await orderRepository.create(orderWithCustomer);

      const populatedOrder = await orderRepository.findById(order._id, ['customer', 'restaurant']);

      await this.publishOrderCreatedEvent(populatedOrder, restaurant);

      await emitOrderUpdate(order.restaurantId.toString(), {
        type: 'ORDER_CREATED',
        order: populatedOrder,
        timestamp: new Date()
      });

      return {
        success: true,
        data: { order: populatedOrder },
        message: 'Order created successfully'
      };
    } catch (error) {
      console.error('❌ [Order Service] Create order error:', error);
      throw new Error(`Order creation failed: ${error.message}`);
    }
  },


  async publishOrderCreatedEvent(order, restaurant) {
    try {
      const event = {
        type: 'order_created',
        tenantId: order.restaurantId.toString(),
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        customerId: order.customerId?.toString(),
        restaurantId: order.restaurantId.toString(),
        items: order.items,
        totalAmount: order.pricing?.total,
        timestamp: new Date().toISOString(),
        metadata: {
          preparationTime: restaurant.settings?.preparationTime || 20,
          orderType: order.type,
          cuisineType: restaurant.basicInfo?.cuisineType,
          deliveryFee: order.pricing?.deliveryFee || 0
        }
      };

      await producer.send({
        topic: 'order_events',
        messages: [
          {
            key: order.restaurantId.toString(), // Partition by tenant
            value: JSON.stringify(event)
          }
        ]
      });

      console.log(`📤 Order created event published for order ${order.orderNumber}`);
    } catch (error) {
      console.error('❌ Failed to publish order event:', error);
      // Don't throw - order should still be created
    }
  },

  // Calculate order pricing
  async calculatePricing(items, restaurantId) {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    let subtotal = 0;

    // Calculate items subtotal
    items.forEach(item => {
      const itemSubtotal = item.price * item.quantity;
      subtotal += itemSubtotal;
    });

    const deliveryFee = restaurant.settings?.deliveryFee || 0;
    const taxAmount = subtotal * 0.05; // 5% tax
    const discountAmount = 0; // Could be calculated from promotions
    const tipAmount = 0; // Optional tip

    const total = subtotal + deliveryFee + taxAmount + tipAmount - discountAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      deliveryFee: Math.round(deliveryFee * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      tipAmount: Math.round(tipAmount * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  },

  // Get order by ID
  async getOrderById(orderId) {
    try {
      const order = await orderRepository.findById(orderId, ['customer', 'restaurant', 'rider']);
      
      if (!order) {
        return {
          success: false,
          message: 'Order not found',
          statusCode: 404
        };
      }

      return {
        success: true,
        data: { order },
        message: 'Order fetched successfully'
      };
    } catch (error) {
      throw new Error(`Failed to fetch order: ${error.message}`);
    }
  },

  // Get order by order number
  async getOrderByNumber(orderNumber) {
    try {
      const order = await orderRepository.findByOrderNumber(orderNumber);
      
      if (!order) {
        return {
          success: false,
          message: 'Order not found',
          statusCode: 404
        };
      }

      return {
        success: true,
        data: { order },
        message: 'Order fetched successfully'
      };
    } catch (error) {
      throw new Error(`Failed to fetch order: ${error.message}`);
    }
  },

  // Get customer orders
  async getCustomerOrders(customerId, options = {}) {
    try {
      const result = await orderRepository.findByCustomer(customerId, options);

      return {
        success: true,
        data: result,
        message: 'Customer orders fetched successfully'
      };
    } catch (error) {
      throw new Error(`Failed to fetch customer orders: ${error.message}`);
    }
  },

  // Get restaurant orders
  async getRestaurantOrders(restaurantId, options = {}) {
    try {
      const result = await orderRepository.findByRestaurant(restaurantId, options);

      return {
        success: true,
        data: result,
        message: 'Restaurant orders fetched successfully'
      };
    } catch (error) {
      throw new Error(`Failed to fetch restaurant orders: ${error.message}`);
    }
  },

  // Update order status with real-time updates
  // Update the updateOrderStatus method in orderService.js
async updateOrderStatus(orderId, newStatus, note = '', actor = 'system') {
  try {
    const order = await orderRepository.updateStatus(orderId, newStatus, note, actor);
    
    if (!order) {
      return {
        success: false,
        message: 'Order not found',
        statusCode: 404
      };
    }

    // Populate the order to get complete data for real-time updates
    const populatedOrder = await orderRepository.findById(order._id, ['customer', 'restaurant', 'rider']);

    // Emit real-time status update via Socket.IO
    await emitOrderUpdate(order.restaurantId.toString(), {
      type: 'ORDER_STATUS_UPDATED',
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      newStatus: newStatus,
      previousStatus: order.timeline.length > 1 ? order.timeline[order.timeline.length - 2]?.status : 'pending',
      note: note,
      actor: actor,
      timestamp: new Date(),
      order: populatedOrder // Include complete order data
    });

    return {
      success: true,
      data: { order: populatedOrder },
      message: `Order status updated to ${newStatus}`
    };
  } catch (error) {
    throw new Error(`Failed to update order status: ${error.message}`);
  }
},

  // Assign rider to order with real-time updates
  async assignRider(orderId, riderId) {
    try {
      const order = await orderRepository.assignRider(orderId, riderId);
      
      if (!order) {
        return {
          success: false,
          message: 'Order not found',
          statusCode: 404
        };
      }

      // Emit real-time rider assignment update
      await emitOrderUpdate(order.restaurantId.toString(), {
        type: 'RIDER_ASSIGNED',
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        riderId: riderId,
        timestamp: new Date()
      });

      return {
        success: true,
        data: { order },
        message: 'Rider assigned successfully'
      };
    } catch (error) {
      throw new Error(`Failed to assign rider: ${error.message}`);
    }
  },

  // Update payment status with real-time updates
  async updatePaymentStatus(orderId, paymentStatus, transactionId = null) {
    try {
      const order = await orderRepository.updatePaymentStatus(orderId, paymentStatus, transactionId);
      
      if (!order) {
        return {
          success: false,
          message: 'Order not found',
          statusCode: 404
        };
      }

      // Emit real-time payment update
      await emitOrderUpdate(order.restaurantId.toString(), {
        type: 'PAYMENT_UPDATED',
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        paymentStatus: paymentStatus,
        transactionId: transactionId,
        timestamp: new Date()
      });

      return {
        success: true,
        data: { order },
        message: `Payment status updated to ${paymentStatus}`
      };
    } catch (error) {
      throw new Error(`Failed to update payment status: ${error.message}`);
    }
  },

  // Get orders by status
  async getOrdersByStatus(status, options = {}) {
    try {
      const result = await orderRepository.findByStatus(status, options);

      return {
        success: true,
        data: result,
        message: `${status} orders fetched successfully`
      };
    } catch (error) {
      throw new Error(`Failed to fetch ${status} orders: ${error.message}`);
    }
  },

  // Get today's orders for restaurant
  async getTodaysOrders(restaurantId) {
    try {
      const orders = await orderRepository.getTodaysOrders(restaurantId);

      return {
        success: true,
        data: { orders },
        message: "Today's orders fetched successfully"
      };
    } catch (error) {
      throw new Error(`Failed to fetch today's orders: ${error.message}`);
    }
  },

  // Get order statistics
  async getOrderStats(restaurantId, period = 'today') {
    try {
      const stats = await orderRepository.getOrderStats(restaurantId, period);

      return {
        success: true,
        data: { stats },
        message: 'Order statistics fetched successfully'
      };
    } catch (error) {
      throw new Error(`Failed to fetch order statistics: ${error.message}`);
    }
  },

  // Cancel order with real-time updates
  async cancelOrder(orderId, reason = '') {
    try {
      const order = await orderRepository.updateStatus(
        orderId, 
        'cancelled', 
        reason || 'Order cancelled by customer',
        'customer'
      );
      
      if (!order) {
        return {
          success: false,
          message: 'Order not found',
          statusCode: 404
        };
      }

      // Emit real-time cancellation update
      await emitOrderUpdate(order.restaurantId.toString(), {
        type: 'ORDER_CANCELLED',
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        reason: reason,
        timestamp: new Date()
      });

      return {
        success: true,
        data: { order },
        message: 'Order cancelled successfully'
      };
    } catch (error) {
      throw new Error(`Failed to cancel order: ${error.message}`);
    }
  },

  // Get real-time metrics for restaurant (for dashboard)
  async getRealtimeMetrics(restaurantId) {
    try {
      // This would typically fetch from Redis via metrics service
      // For now, return basic stats that can be enhanced later
      const todayOrders = await orderRepository.getTodaysOrders(restaurantId);
      const activeOrders = await orderRepository.findByStatus('preparing', { restaurantId });
      
      const metrics = {
        totalOrdersToday: todayOrders.length,
        activeOrders: activeOrders.length,
        avgPreparationTime: 20, // Default, would come from Redis metrics
        completionRate: 0 // Would be calculated from historical data
      };

      return {
        success: true,
        data: { metrics },
        message: 'Real-time metrics fetched successfully'
      };
    } catch (error) {
      throw new Error(`Failed to fetch real-time metrics: ${error.message}`);
    }
  }
};

module.exports = { orderService };
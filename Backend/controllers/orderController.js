const { orderService } = require("../services/orderService.js");
const { responseSuccess, responseFailure } = require("../common/responses.js");

console.log('🎮 [Controller] Order controller loaded');

const orderController = {
  async createOrder(req, res) {
    try {
      const customerId = req.user.id;
      const orderData = req.body;

      console.log('📦 [Controller] Creating order for user:', customerId);

      const result = await orderService.createOrder(orderData, customerId);
      
      if (!result.success) {
        return responseFailure(res, result.message, result.statusCode);
      }

      return responseSuccess(res, result.data, result.message);
    } catch (error) {
      console.error('❌ [Controller] Create order error:', error);
      return responseFailure(res, error.message);
    }
  },

  // Get order by ID
  async getOrderById(req, res) {
    try {
      const { id } = req.params;

      const result = await orderService.getOrderById(id);
      
      if (!result.success) {
        return responseFailure(res, result.message, result.statusCode);
      }

      return responseSuccess(res, result.data, result.message);
    } catch (error) {
      return responseFailure(res, error.message);
    }
  },

  // Get order by order number
  async getOrderByNumber(req, res) {
    try {
      const { orderNumber } = req.params;

      const result = await orderService.getOrderByNumber(orderNumber);
      
      if (!result.success) {
        return responseFailure(res, result.message, result.statusCode);
      }

      return responseSuccess(res, result.data, result.message);
    } catch (error) {
      return responseFailure(res, error.message);
    }
  },

  // Get customer orders
  async getCustomerOrders(req, res) {
    try {
      const customerId = req.user.id;
      const { page, limit, status } = req.query;

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status
      };

      const result = await orderService.getCustomerOrders(customerId, options);
      
      if (!result.success) {
        return responseFailure(res, result.message, result.statusCode);
      }

      return responseSuccess(res, result.data, result.message);
    } catch (error) {
      return responseFailure(res, error.message);
    }
  },

  // Get restaurant orders
  async getRestaurantOrders(req, res) {
    try {
      const { restaurantId } = req.params;
      const { page, limit, status } = req.query;

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status
      };

      const result = await orderService.getRestaurantOrders(restaurantId, options);
      
      if (!result.success) {
        return responseFailure(res, result.message, result.statusCode);
      }

      return responseSuccess(res, result.data, result.message);
    } catch (error) {
      return responseFailure(res, error.message);
    }
  },

  // Update order status
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, note, actor } = req.body;

      const result = await orderService.updateOrderStatus(id, status, note, actor);
      
      if (!result.success) {
        return responseFailure(res, result.message, result.statusCode);
      }

      return responseSuccess(res, result.data, result.message);
    } catch (error) {
      return responseFailure(res, error.message);
    }
  },

  // Assign rider to order
  async assignRider(req, res) {
    try {
      const { id } = req.params;
      const { riderId } = req.body;

      const result = await orderService.assignRider(id, riderId);
      
      if (!result.success) {
        return responseFailure(res, result.message, result.statusCode);
      }

      return responseSuccess(res, result.data, result.message);
    } catch (error) {
      return responseFailure(res, error.message);
    }
  },

  // Update payment status
  async updatePaymentStatus(req, res) {
    try {
      const { id } = req.params;
      const { paymentStatus, transactionId } = req.body;

      const result = await orderService.updatePaymentStatus(id, paymentStatus, transactionId);
      
      if (!result.success) {
        return responseFailure(res, result.message, result.statusCode);
      }

      return responseSuccess(res, result.data, result.message);
    } catch (error) {
      return responseFailure(res, error.message);
    }
  },

  // Get orders by status
  async getOrdersByStatus(req, res) {
    try {
      const { status } = req.params;
      const { page, limit } = req.query;

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50
      };

      const result = await orderService.getOrdersByStatus(status, options);
      
      if (!result.success) {
        return responseFailure(res, result.message, result.statusCode);
      }

      return responseSuccess(res, result.data, result.message);
    } catch (error) {
      return responseFailure(res, error.message);
    }
  },

  // Get today's orders for restaurant
  async getTodaysOrders(req, res) {
    try {
      const { restaurantId } = req.params;

      const result = await orderService.getTodaysOrders(restaurantId);
      
      if (!result.success) {
        return responseFailure(res, result.message, result.statusCode);
      }

      return responseSuccess(res, result.data, result.message);
    } catch (error) {
      return responseFailure(res, error.message);
    }
  },

  // Get order statistics
  async getOrderStats(req, res) {
    try {
      const { restaurantId } = req.params;
      const { period } = req.query;

      const result = await orderService.getOrderStats(restaurantId, period);
      
      if (!result.success) {
        return responseFailure(res, result.message, result.statusCode);
      }

      return responseSuccess(res, result.data, result.message);
    } catch (error) {
      return responseFailure(res, error.message);
    }
  },

  // Cancel order
  async cancelOrder(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const result = await orderService.cancelOrder(id, reason);
      
      if (!result.success) {
        return responseFailure(res, result.message, result.statusCode);
      }

      return responseSuccess(res, result.data, result.message);
    } catch (error) {
      return responseFailure(res, error.message);
    }
  }
};

module.exports= {orderController};
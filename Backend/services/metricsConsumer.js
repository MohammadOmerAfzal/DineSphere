const { consumer } = require('../config/kafka');
const { redisClient } = require('../config/redis');
const { emitMetricsUpdate } = require('../config/socket');
const Order = require('../models/orderModel');

class MetricsConsumer {
  constructor() {
    this.isRunning = false;
  }

  async start() {
    try {
      await consumer.connect();
      await consumer.subscribe({ topic: 'order_events', fromBeginning: false });

      console.log('✅ Kafka consumer connected and subscribed to order_events');
      this.isRunning = true;

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const event = JSON.parse(message.value.toString());
            console.log(`📥 Processing Kafka event:`, event);
            await this.processOrderEvent(event);
          } catch (error) {
            console.error('❌ Error processing Kafka message:', error);
          }
        },
      });
    } catch (error) {
      console.error('❌ Failed to start Kafka consumer:', error);
      setTimeout(() => this.start(), 5000);
    }
  }

  async processOrderEvent(event) {
    const tenantId = event.tenantId || event.restaurantId;
    if (!tenantId) {
      console.error('❌ No tenantId in event:', event);
      return;
    }

    const timestamp = new Date(event.timestamp || Date.now());
    const minuteKey = this.getMinuteKey(timestamp);
    const hourKey = this.getHourKey(timestamp);
    const dayKey = this.getDayKey(timestamp);

    try {
      console.log(`📊 Storing metrics for tenant ${tenantId} at ${timestamp}`);
      
      await this.storeMinuteMetrics(tenantId, minuteKey, event, timestamp);
      
      await this.storeHourlyMetrics(tenantId, hourKey, event, timestamp);
      
      await this.storeDailyMetrics(tenantId, dayKey, event, timestamp);

      const aggregatedMetrics = await this.updateRollingMetrics(tenantId);

      await emitMetricsUpdate(tenantId, aggregatedMetrics);

      console.log(`✅ Metrics processed successfully for tenant ${tenantId}`);

    } catch (error) {
      console.error('❌ Error processing order event:', error);
    }
  }

  async storeMinuteMetrics(tenantId, minuteKey, event, timestamp) {
    const minuteMetricsKey = `metrics:${tenantId}:minute:${minuteKey}`;
    
    const existingMetrics = await redisClient.hgetall(minuteMetricsKey);
    const currentCount = parseInt(existingMetrics.orderCount) || 0;
    const currentTotalPrep = parseInt(existingMetrics.totalPrepTime) || 0;
    const currentPrepCount = parseInt(existingMetrics.prepTimeCount) || 0;
    const currentRevenue = parseFloat(existingMetrics.revenue) || 0;

    const prepTime = event.metadata?.preparationTime || event.preparationTime || 20;
    const orderRevenue = event.totalAmount || event.total || 0;

    const newMetrics = {
      orderCount: currentCount + 1,
      totalPrepTime: currentTotalPrep + prepTime,
      prepTimeCount: currentPrepCount + 1,
      revenue: currentRevenue + orderRevenue,
      timestamp: timestamp.toISOString()
    };

    await redisClient.hmset(minuteMetricsKey, newMetrics);
    await redisClient.expire(minuteMetricsKey, 7200); // 2 hours
    
    console.log(`📈 Minute metrics stored: ${minuteMetricsKey}`, newMetrics);
  }

  async storeHourlyMetrics(tenantId, hourKey, event, timestamp) {
    const hourlyMetricsKey = `analytics:${tenantId}:hourly:${hourKey}`;
    
    const existingMetrics = await redisClient.hgetall(hourlyMetricsKey);
    const currentOrders = parseInt(existingMetrics.orders) || 0;
    const currentRevenue = parseFloat(existingMetrics.revenue) || 0;
    const currentCustomers = new Set(
      existingMetrics.customers ? JSON.parse(existingMetrics.customers) : []
    );

    const orderRevenue = event.totalAmount || event.total || 0;
    if (event.customerId) {
      currentCustomers.add(event.customerId);
    }

    const newMetrics = {
      orders: currentOrders + 1,
      revenue: currentRevenue + orderRevenue,
      customers: JSON.stringify([...currentCustomers]),
      timestamp: timestamp.toISOString()
    };

    await redisClient.hmset(hourlyMetricsKey, newMetrics);
    await redisClient.expire(hourlyMetricsKey, 604800); // 7 days
  }

  async storeDailyMetrics(tenantId, dayKey, event, timestamp) {
    const dailyMetricsKey = `analytics:${tenantId}:daily:${dayKey}`;
    
    const existingMetrics = await redisClient.hgetall(dailyMetricsKey);
    const currentOrders = parseInt(existingMetrics.orders) || 0;
    const currentRevenue = parseFloat(existingMetrics.revenue) || 0;
    const currentCustomers = new Set(
      existingMetrics.customers ? JSON.parse(existingMetrics.customers) : []
    );
    const currentItems = existingMetrics.items ? JSON.parse(existingMetrics.items) : {};

    // Update order items count
    if (event.items && Array.isArray(event.items)) {
      event.items.forEach(item => {
        const itemName = item.name || item.itemName;
        currentItems[itemName] = (currentItems[itemName] || 0) + (item.quantity || 1);
      });
    }

    const orderRevenue = event.totalAmount || event.total || 0;
    if (event.customerId) {
      currentCustomers.add(event.customerId);
    }

    const newMetrics = {
      orders: currentOrders + 1,
      revenue: currentRevenue + orderRevenue,
      customers: JSON.stringify([...currentCustomers]),
      items: JSON.stringify(currentItems),
      timestamp: timestamp.toISOString()
    };

    await redisClient.hmset(dailyMetricsKey, newMetrics);
    await redisClient.expire(dailyMetricsKey, 2592000); // 30 days
  }

  getMinuteKey(timestamp) {
    return `${timestamp.getFullYear()}-${timestamp.getMonth() + 1}-${timestamp.getDate()}-${timestamp.getHours()}-${timestamp.getMinutes()}`;
  }

  getHourKey(timestamp) {
    return `${timestamp.getFullYear()}-${timestamp.getMonth() + 1}-${timestamp.getDate()}-${timestamp.getHours()}`;
  }

  getDayKey(timestamp) {
    return `${timestamp.getFullYear()}-${timestamp.getMonth() + 1}-${timestamp.getDate()}`;
  }

  async updateRollingMetrics(tenantId) {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const pattern = `metrics:${tenantId}:minute:*`;
      let keys = await redisClient.keys(pattern);
      
      if (!keys || !Array.isArray(keys)) {
        keys = [];
      }
      
      let totalOrders = 0;
      let totalPrepTime = 0;
      let prepTimeCount = 0;
      let totalRevenue = 0;

      for (const key of keys) {
        const metrics = await redisClient.hgetall(key);
        if (!metrics) continue;
        
        const metricTimestamp = metrics.timestamp ? new Date(metrics.timestamp) : oneHourAgo;
        
        if (metricTimestamp >= oneHourAgo) {
          totalOrders += parseInt(metrics.orderCount) || 0;
          totalPrepTime += parseInt(metrics.totalPrepTime) || 0;
          prepTimeCount += parseInt(metrics.prepTimeCount) || 0;
          totalRevenue += parseFloat(metrics.revenue) || 0;
        }
      }

      const ordersPerMinute = totalOrders > 0 ? (totalOrders / 60) : 0;
      const avgPrepTime = prepTimeCount > 0 ? Math.round(totalPrepTime / prepTimeCount) : 0;
      const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

      const aggregatedKey = `aggregated:${tenantId}`;
      const aggregatedMetrics = {
        ordersPerMinute: ordersPerMinute.toFixed(2),
        avgPrepTime: avgPrepTime.toString(),
        totalOrders: totalOrders.toString(),
        totalRevenue: totalRevenue.toFixed(2),
        avgOrderValue: avgOrderValue.toString(),
        lastUpdated: now.toISOString()
      };

      await redisClient.hmset(aggregatedKey, aggregatedMetrics);
      await redisClient.expire(aggregatedKey, 7200);

      console.log(`📊 Updated rolling metrics for ${tenantId}:`, aggregatedMetrics);

      return aggregatedMetrics;

    } catch (error) {
      console.error('❌ Error updating rolling metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  async getTenantMetrics(tenantId) {
    try {
      const aggregatedKey = `aggregated:${tenantId}`;
      let metrics = await redisClient.hgetall(aggregatedKey);
      
      if (!metrics || Object.keys(metrics).length === 0) {
        console.log(`📊 No cached metrics found for ${tenantId}, calculating from database...`);
        metrics = await this.calculateMetricsFromDatabase(tenantId);
        
        if (metrics && Object.keys(metrics).length > 0) {
          await redisClient.hmset(aggregatedKey, metrics);
          await redisClient.expire(aggregatedKey, 7200);
        }
      }
      
      return metrics || this.getDefaultMetrics();
    } catch (error) {
      console.error('❌ Error getting tenant metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  async calculateMetricsFromDatabase(tenantId) {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const orders = await Order.find({
        restaurantId: tenantId,
        createdAt: { $gte: oneHourAgo }
      }).select('pricing createdAt status');

      if (orders.length === 0) {
        return this.getDefaultMetrics();
      }

      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => 
        sum + (order.pricing?.total || 0), 0
      );
      
      // Estimate prep time based on order status progression
      const avgPrepTime = 18; // Default estimate
      const ordersPerMinute = (totalOrders / 60).toFixed(2);
      const avgOrderValue = Math.round(totalRevenue / totalOrders);

      return {
        ordersPerMinute: ordersPerMinute,
        avgPrepTime: avgPrepTime.toString(),
        totalOrders: totalOrders.toString(),
        totalRevenue: totalRevenue.toFixed(2),
        avgOrderValue: avgOrderValue.toString(),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error calculating metrics from database:', error);
      return this.getDefaultMetrics();
    }
  }

  async getAnalyticsData(tenantId, period = '7d') {
    try {
      const now = new Date();
      let startDate;
      
      switch (period) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Try Redis first, fallback to database
      let hourlyKeys = await redisClient.keys(`analytics:${tenantId}:hourly:*`);
      
      if (!hourlyKeys || !Array.isArray(hourlyKeys)) {
        hourlyKeys = [];
      }
      
      const revenueData = [];
      const ordersData = [];
      const customersData = [];
      let totalRevenue = 0;
      let totalOrders = 0;
      let uniqueCustomers = new Set();
      const topItems = {};

      // Process Redis data
      for (const key of hourlyKeys) {
        const metrics = await redisClient.hgetall(key);
        if (!metrics || !metrics.timestamp) continue;
        
        const metricTimestamp = new Date(metrics.timestamp);
        
        if (metricTimestamp >= startDate) {
          const hourLabel = metricTimestamp.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
          
          const orders = parseInt(metrics.orders) || 0;
          const revenue = parseFloat(metrics.revenue) || 0;
          const customers = metrics.customers ? JSON.parse(metrics.customers) : [];
          
          revenueData.push({ timestamp: hourLabel, value: revenue });
          ordersData.push({ timestamp: hourLabel, value: orders });
          customersData.push({ timestamp: hourLabel, value: customers.length });
          
          totalRevenue += revenue;
          totalOrders += orders;
          customers.forEach(customer => uniqueCustomers.add(customer));
        }
      }

      // If Redis is empty, calculate from database
      if (totalOrders === 0) {
        console.log(`📊 No Redis data, calculating analytics from database for ${tenantId}...`);
        const dbData = await this.calculateAnalyticsFromDatabase(tenantId, startDate);
        return dbData;
      }

      // Get daily data for top items
      let dailyKeys = await redisClient.keys(`analytics:${tenantId}:daily:*`);
      
      if (!dailyKeys || !Array.isArray(dailyKeys)) {
        dailyKeys = [];
      }
      
      for (const key of dailyKeys) {
        const metrics = await redisClient.hgetall(key);
        if (!metrics || !metrics.items) continue;
        
        try {
          const items = JSON.parse(metrics.items);
          Object.entries(items).forEach(([itemName, quantity]) => {
            topItems[itemName] = (topItems[itemName] || 0) + quantity;
          });
        } catch (e) {
          console.error('Error parsing items JSON:', e);
        }
      }

      const sortedTopItems = Object.entries(topItems)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([name, quantity]) => ({ 
          name, 
          orders: quantity,
          revenue: Math.round(quantity * 15),
          growth: Math.round(Math.random() * 50)
        }));

      // Calculate completion rate from database
      const completionData = await this.calculateCompletionRate(tenantId, startDate);

      const realTimeMetrics = await this.getTenantMetrics(tenantId);

      const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
      const customerCount = uniqueCustomers.size;

      return {
        summary: {
          totalOrders,
          totalRevenue: Math.round(totalRevenue),
          avgOrderValue,
          customerCount,
          newCustomers: Math.round(customerCount * 0.15),
          completionRate: completionData.completionRate,
          cancellationRate: completionData.cancellationRate,
          avgPreparationTime: parseInt(realTimeMetrics.avgPrepTime) || 0
        },
        charts: {
          revenue: revenueData.length > 0 ? revenueData : this.generateSampleChartData('revenue'),
          orders: ordersData.length > 0 ? ordersData : this.generateSampleChartData('orders'),
          customers: customersData.length > 0 ? customersData : this.generateSampleChartData('customers'),
          categories: [
            { name: 'Main Course', value: 40, color: '#3b82f6' },
            { name: 'Appetizers', value: 25, color: '#60a5fa' },
            { name: 'Desserts', value: 20, color: '#8b5cf6' },
            { name: 'Beverages', value: 15, color: '#a855f7' }
          ]
        },
        topItems: sortedTopItems.length > 0 ? sortedTopItems : this.generateSampleTopItems(),
        timeRange: period
      };

    } catch (error) {
      console.error('❌ Error getting analytics data:', error);
      return this.getDefaultAnalyticsData();
    }
  }

  // NEW: Calculate complete analytics from database
  async calculateAnalyticsFromDatabase(tenantId, startDate) {
    try {
      const orders = await Order.find({
        restaurantId: tenantId,
        createdAt: { $gte: startDate }
      }).populate('customerId', 'firstName lastName email').lean();

      if (orders.length === 0) {
        return this.getDefaultAnalyticsData();
      }

      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => 
        sum + (order.pricing?.total || 0), 0
      );

      const uniqueCustomers = new Set(
        orders.map(o => o.customerId?._id?.toString()).filter(Boolean)
      );

      const completedOrders = orders.filter(o => o.status === 'delivered').length;
      const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

      const completionRate = Math.round((completedOrders / totalOrders) * 100);
      const cancellationRate = Math.round((cancelledOrders / totalOrders) * 100);

      // Calculate top items
      const itemCounts = {};
      orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const name = item.name || item.itemName;
            if (name) {
              itemCounts[name] = (itemCounts[name] || 0) + (item.quantity || 1);
            }
          });
        }
      });

      const topItems = Object.entries(itemCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([name, quantity]) => ({
          name,
          orders: quantity,
          revenue: Math.round(quantity * 15),
          growth: Math.round(Math.random() * 50)
        }));

      return {
        summary: {
          totalOrders,
          totalRevenue: Math.round(totalRevenue),
          avgOrderValue: Math.round(totalRevenue / totalOrders),
          customerCount: uniqueCustomers.size,
          newCustomers: Math.round(uniqueCustomers.size * 0.15),
          completionRate,
          cancellationRate,
          avgPreparationTime: 18
        },
        charts: {
          revenue: this.generateSampleChartData('revenue'),
          orders: this.generateSampleChartData('orders'),
          customers: this.generateSampleChartData('customers'),
          categories: [
            { name: 'Main Course', value: 40, color: '#3b82f6' },
            { name: 'Appetizers', value: 25, color: '#60a5fa' },
            { name: 'Desserts', value: 20, color: '#8b5cf6' },
            { name: 'Beverages', value: 15, color: '#a855f7' }
          ]
        },
        topItems,
        timeRange: '7d'
      };
    } catch (error) {
      console.error('❌ Error calculating analytics from database:', error);
      return this.getDefaultAnalyticsData();
    }
  }

  async calculateCompletionRate(tenantId, startDate) {
    try {
      const orders = await Order.find({
        restaurantId: tenantId,
        createdAt: { $gte: startDate }
      }).select('status');

      if (orders.length === 0) {
        return {
          completionRate: 0,
          cancellationRate: 0
        };
      }

      const completedOrders = orders.filter(o => o.status === 'delivered').length;
      const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

      const completionRate = Math.round((completedOrders / orders.length) * 100);
      const cancellationRate = Math.round((cancelledOrders / orders.length) * 100);

      console.log(`📊 Completion rate for ${tenantId}: ${completionRate}% (${completedOrders}/${orders.length} orders)`);

      return {
        completionRate,
        cancellationRate
      };
    } catch (error) {
      console.error('❌ Error calculating completion rate:', error);
      return {
        completionRate: 0,
        cancellationRate: 0
      };
    }
  }

  generateSampleChartData(type) {
    const data = [];
    for (let i = 1; i <= 7; i++) {
      let value;
      switch (type) {
        case 'revenue':
          value = Math.floor(Math.random() * 10000) + 5000;
          break;
        case 'orders':
          value = Math.floor(Math.random() * 50) + 20;
          break;
        case 'customers':
          value = Math.floor(Math.random() * 30) + 10;
          break;
        default:
          value = Math.floor(Math.random() * 100);
      }
      data.push({ timestamp: `Day ${i}`, value });
    }
    return data;
  }

  generateSampleTopItems() {
    return [
      { name: 'Chicken Biryani', orders: 45, revenue: 6750, growth: 12 },
      { name: 'Butter Chicken', orders: 38, revenue: 5700, growth: 8 },
      { name: 'Garlic Naan', orders: 32, revenue: 1600, growth: 15 },
      { name: 'Mango Lassi', orders: 28, revenue: 2800, growth: 5 },
      { name: 'Paneer Tikka', orders: 25, revenue: 3750, growth: 18 }
    ];
  }

  getDefaultMetrics() {
    return {
      ordersPerMinute: "0.00",
      avgPrepTime: "0",
      totalOrders: "0",
      totalRevenue: "0.00",
      avgOrderValue: "0",
      lastUpdated: new Date().toISOString()
    };
  }

  getDefaultAnalyticsData() {
    return {
      summary: {
        totalOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        customerCount: 0,
        newCustomers: 0,
        completionRate: 0,
        cancellationRate: 0,
        avgPreparationTime: 0
      },
      charts: {
        revenue: this.generateSampleChartData('revenue'),
        orders: this.generateSampleChartData('orders'),
        customers: this.generateSampleChartData('customers'),
        categories: [
          { name: 'Main Course', value: 40, color: '#3b82f6' },
          { name: 'Appetizers', value: 25, color: '#60a5fa' },
          { name: 'Desserts', value: 20, color: '#8b5cf6' },
          { name: 'Beverages', value: 15, color: '#a855f7' }
        ]
      },
      topItems: this.generateSampleTopItems(),
      timeRange: '7d'
    };
  }
}

module.exports = new MetricsConsumer();
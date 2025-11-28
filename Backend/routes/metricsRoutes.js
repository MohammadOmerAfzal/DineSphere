const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const metricsConsumer = require('../services/metricsConsumer');

// Get real-time metrics for a restaurant/tenant
router.get('/restaurant/:restaurantId', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // Verify the user has access to this restaurant's metrics
    const user = req.user;
    if (user.role === 'restaurant_owner' && user.restaurantId?.toString() !== restaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to these metrics'
      });
    }

    const metrics = await metricsConsumer.getTenantMetrics(restaurantId);
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch metrics'
    });
  }
});

// Get comprehensive analytics data for restaurant
router.get('/restaurant/:restaurantId/analytics', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { period = '7d' } = req.query;
    
    // Verify the user has access to this restaurant's analytics
    const user = req.user;
    if (user.role === 'restaurant_owner' && user.restaurantId?.toString() !== restaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to these analytics'
      });
    }

    const analyticsData = await metricsConsumer.getAnalyticsData(restaurantId, period);
    
    res.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data'
    });
  }
});

// Get top performing items
router.get('/restaurant/:restaurantId/top-items', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { period = '7d', limit = 10 } = req.query;
    
    const user = req.user;
    if (user.role === 'restaurant_owner' && user.restaurantId?.toString() !== restaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to these analytics'
      });
    }

    const analyticsData = await metricsConsumer.getAnalyticsData(restaurantId, period);
    const topItems = analyticsData.topItems.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: { topItems }
    });
  } catch (error) {
    console.error('Error fetching top items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top items'
    });
  }
});

// Export analytics report
router.get('/restaurant/:restaurantId/export', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { period = '7d', format = 'json' } = req.query;
    
    const user = req.user;
    if (user.role === 'restaurant_owner' && user.restaurantId?.toString() !== restaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to these analytics'
      });
    }

    const analyticsData = await metricsConsumer.getAnalyticsData(restaurantId, period);
    
    if (format === 'csv') {
      // Generate CSV format
      const csvData = generateCSV(analyticsData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${restaurantId}-${period}.csv`);
      return res.send(csvData);
    }
    
    // Default JSON format
    res.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics data'
    });
  }
});

// Get metrics for multiple tenants (admin only)
router.get('/tenants', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // This would typically fetch metrics for all tenants
    // For now, return sample data or implement based on your needs
    res.json({
      success: true,
      data: {
        message: 'Admin metrics endpoint - implement based on your requirements'
      }
    });
  } catch (error) {
    console.error('Error fetching tenant metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant metrics'
    });
  }
});

// Helper function to generate CSV
function generateCSV(analyticsData) {
  let csv = 'Metric,Value\n';
  
  // Summary data
  Object.entries(analyticsData.summary).forEach(([key, value]) => {
    csv += `${key},${value}\n`;
  });
  
  // Chart data
  csv += '\nRevenue Data\nTime,Revenue\n';
  analyticsData.charts.revenue.forEach(item => {
    csv += `${item.timestamp},${item.value}\n`;
  });
  
  csv += '\nOrders Data\nTime,Orders\n';
  analyticsData.charts.orders.forEach(item => {
    csv += `${item.timestamp},${item.value}\n`;
  });
  
  csv += '\nTop Items\nItem,Quantity\n';
  analyticsData.topItems.forEach(item => {
    csv += `${item.name},${item.quantity}\n`;
  });
  
  return csv;
}

module.exports = router;
export class ApiController {
  static async hello(req, res) {
    try {
      res.json({
        success: true,
        message: 'Hello from AI Trip Planner API!',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoints: {
          auth: '/api/auth',
          trips: '/api/trips',
          health: '/health'
        }
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: err.message
      });
    }
  }

  static async status(req, res) {
    try {
      res.json({
        success: true,
        status: 'operational',
        services: {
          database: 'connected',
          firebase: 'connected',
          vertexAI: 'available'
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: 'Failed to get status',
        details: err.message
      });
    }
  }
}
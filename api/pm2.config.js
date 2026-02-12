/**
 * PM2 Configuration for CamThink Wiki API
 *
 * This configuration manages the API service with production-ready settings.
 *
 * @see https://pm2.keymetrics.io/docs/usage/with-cluster/
 */

module.exports = {
  apps: [
    {
      // Application name (shown in PM2 listings)
      name: 'wiki-api',

      // Entry point - built ES module
      script: './dist/index.js',
      interpreter: 'node',

      // Instance management
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,

      // Memory limits (per instance)
      max_memory_restart: '1G',

      // Graceful shutdown settings
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      shutdown_with_message: true,

      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        // timezone for consistent logs
        TZ: 'Asia/Shanghai',
      },

      // Production environment
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        TZ: 'Asia/Shanghai',
      },

      // Error handling and auto-restart
      min_uptime: '30s',
      max_restarts: 15,
      restart_delay: 4000,

      // Logging configuration
      error_file: './logs/error.log',
      out_file: './logs/access.log',
      log_file: './logs/combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      rotate_log: true,

      // Log rotation (keep last 7 days of logs)
      log_rotate_interval: '0 0 * *', // Daily at midnight
      rotate_log_higher: 7,  // Keep 7 backup files
      rotate_log_lower: 0,

      // Process management
      kill_timeout: 5000,

      // Source map support for better error stack traces
      source_map_support: true,

      // Instance variables for PM2 commands
      instance_var: {
        // Accessible via: pm2 restart wiki-api --update-env <KEY> <VALUE>
        APP_NAME: 'wiki-api',
        APP_DIR: '/var/www/wiki-api',
        API_PORT: '3001',
      },
    },
  ],

  // Cluster configuration (optional, for future scaling)
  deploy: {
    production: {
      user: 'root',
      host: 'localhost',
      ref: 'app.json',
      'ssh_options': 'StrictHostKeyChecking=no',
    },
  },
};

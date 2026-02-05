module.exports = {
  apps: [
    {
      name: 'backend',
      script: './index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        TZ: 'Asia/Jakarta'
      },
      env_production: {
        NODE_ENV: 'production',
        TZ: 'Asia/Jakarta'
      },
      env_development: {
        NODE_ENV: 'development',
        TZ: 'Asia/Jakarta'
      },
      // Auto restart on file changes
      watch: false,
      // Max memory restart
      max_memory_restart: '500M',
      // Error log
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      // Restart on crash
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};

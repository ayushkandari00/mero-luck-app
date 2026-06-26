module.exports = {
  apps: [
    {
      name: 'meroluck-backend',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: '/home/ec2-user/logs/meroluck-error.log',
      out_file: '/home/ec2-user/logs/meroluck-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};

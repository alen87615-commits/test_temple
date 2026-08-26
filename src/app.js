const express = require('express');
const orderRouter = require('./routes/orders');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', orderRouter);
  return app;
}

module.exports = createApp;

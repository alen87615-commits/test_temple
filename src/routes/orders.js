const express = require('express');
const orderStore = require('../orderStore');

const router = express.Router();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

router.post('/order', (req, res) => {
  const { orderId, customerName, items } = req.body || {};

  if (!orderId || typeof orderId !== 'string' || !UUID_REGEX.test(orderId)) {
    return res.status(400).json({ error: 'orderId must be a valid UUID' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items must be a non-empty array' });
  }

  const existing = orderStore.get(orderId);
  if (existing) {
    return res.status(200).json({ duplicate: true, order: existing });
  }

  const totalAmount = items.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 0;
    return sum + price * quantity;
  }, 0);

  const order = {
    orderId,
    customerName: customerName || null,
    items,
    totalAmount,
    createdAt: new Date().toISOString(),
  };

  orderStore.save(order);

  return res.status(201).json({ duplicate: false, order });
});

module.exports = router;

const orders = new Map();

function has(orderId) {
  return orders.has(orderId);
}

function get(orderId) {
  return orders.get(orderId);
}

function save(order) {
  orders.set(order.orderId, order);
  return order;
}

function clear() {
  orders.clear();
}

module.exports = { has, get, save, clear };

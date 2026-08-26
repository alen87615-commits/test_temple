const request = require('supertest');
const { randomUUID } = require('crypto');
const createApp = require('../src/app');
const orderStore = require('../src/orderStore');

describe('POST /api/order', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    orderStore.clear();
  });

  const validPayload = () => ({
    orderId: randomUUID(),
    customerName: 'Alice',
    items: [{ productId: 'p1', quantity: 2, price: 100 }],
  });

  test('creates a new order and returns 201', async () => {
    const payload = validPayload();
    const res = await request(app).post('/api/order').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.duplicate).toBe(false);
    expect(res.body.order.orderId).toBe(payload.orderId);
    expect(res.body.order.totalAmount).toBe(200);
  });

  test('returns 200 and does not create a duplicate when the same UUID is resubmitted', async () => {
    const payload = validPayload();

    const first = await request(app).post('/api/order').send(payload);
    expect(first.status).toBe(201);

    const second = await request(app).post('/api/order').send(payload);
    expect(second.status).toBe(200);
    expect(second.body.duplicate).toBe(true);
    expect(second.body.order.orderId).toBe(payload.orderId);

    expect(orderStore.get(payload.orderId)).toBeDefined();
  });

  test('duplicate submission ignores a changed payload and keeps the original order data', async () => {
    const payload = validPayload();
    await request(app).post('/api/order').send(payload);

    const tamperedPayload = {
      ...payload,
      customerName: 'Bob',
      items: [{ productId: 'p2', quantity: 5, price: 999 }],
    };

    const res = await request(app).post('/api/order').send(tamperedPayload);
    expect(res.status).toBe(200);
    expect(res.body.order.customerName).toBe('Alice');
    expect(res.body.order.totalAmount).toBe(200);
  });

  test('handles many concurrent resubmissions of the same UUID without creating duplicates', async () => {
    const payload = validPayload();

    const responses = await Promise.all(
      Array.from({ length: 10 }, () => request(app).post('/api/order').send(payload))
    );

    const created = responses.filter((res) => res.status === 201);
    const duplicates = responses.filter((res) => res.status === 200);

    expect(created).toHaveLength(1);
    expect(duplicates).toHaveLength(9);
  });

  test('rejects request without orderId', async () => {
    const res = await request(app)
      .post('/api/order')
      .send({ items: [{ productId: 'p1', quantity: 1, price: 10 }] });

    expect(res.status).toBe(400);
  });

  test('rejects invalid UUID format', async () => {
    const res = await request(app)
      .post('/api/order')
      .send({ orderId: 'not-a-uuid', items: [{ productId: 'p1', quantity: 1, price: 10 }] });

    expect(res.status).toBe(400);
  });

  test('rejects request without items', async () => {
    const res = await request(app).post('/api/order').send({ orderId: randomUUID() });
    expect(res.status).toBe(400);
  });
});

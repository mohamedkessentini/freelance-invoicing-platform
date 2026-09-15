import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

async function registerAndLogin() {
  const email = `freelancer-${Date.now()}@example.com`;
  const res = await request(app).post('/api/auth/register').send({
    name: 'Mohamed Kessentini',
    email,
    password: 'super-secret-1',
  });
  return { token: res.body.token as string, email };
}

describe('Full API flow: auth -> client -> project -> time entry -> invoice', () => {
  it('registers, logs in, and rejects protected routes without a token', async () => {
    const res = await request(app).get('/api/clients');
    expect(res.status).toBe(401);
  });

  it('completes the full invoicing flow end to end', async () => {
    const { token } = await registerAndLogin();
    const auth = { Authorization: `Bearer ${token}` };

    const clientRes = await request(app).post('/api/clients').set(auth).send({ name: 'Acme Corp' });
    expect(clientRes.status).toBe(201);
    const clientId = clientRes.body._id;

    const projectRes = await request(app)
      .post('/api/projects')
      .set(auth)
      .send({ clientId, name: 'Website Redesign', hourlyRate: 80, currency: 'EUR' });
    expect(projectRes.status).toBe(201);
    const projectId = projectRes.body._id;

    const entryRes = await request(app)
      .post('/api/time-entries')
      .set(auth)
      .send({ projectId, date: '2026-03-01', hours: 5, description: 'Homepage layout' });
    expect(entryRes.status).toBe(201);

    const invoiceRes = await request(app)
      .post('/api/invoices')
      .set(auth)
      .send({ clientId, periodStart: '2026-01-01', periodEnd: '2026-12-31' });
    expect(invoiceRes.status).toBe(201);
    expect(invoiceRes.body.total).toBe(400);
    expect(invoiceRes.body.status).toBe('DRAFT');

    const statusRes = await request(app)
      .patch(`/api/invoices/${invoiceRes.body._id}/status`)
      .set(auth)
      .send({ status: 'SENT' });
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.status).toBe('SENT');

    const dashboardRes = await request(app).get('/api/dashboard/summary').set(auth);
    expect(dashboardRes.status).toBe(200);
    expect(dashboardRes.body.outstandingTotal).toBe(400);
  });

  it('returns 422 when generating an invoice with no unbilled time entries', async () => {
    const { token } = await registerAndLogin();
    const auth = { Authorization: `Bearer ${token}` };

    const clientRes = await request(app).post('/api/clients').set(auth).send({ name: 'Empty Client' });

    const invoiceRes = await request(app)
      .post('/api/invoices')
      .set(auth)
      .send({ clientId: clientRes.body._id, periodStart: '2026-01-01', periodEnd: '2026-12-31' });

    expect(invoiceRes.status).toBe(422);
  });

  it('returns 400 with field errors for an invalid registration payload', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: '', email: 'not-an-email', password: '1' });

    expect(res.status).toBe(400);
    expect(res.body.fieldErrors.length).toBeGreaterThan(0);
  });

  it('rejects login with a wrong password', async () => {
    const { email } = await registerAndLogin();
    const res = await request(app).post('/api/auth/login').send({ email, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });
});

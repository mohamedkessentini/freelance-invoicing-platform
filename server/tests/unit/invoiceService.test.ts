import { generateInvoice, updateInvoiceStatus } from '../../src/services/invoice.service';
import { TimeEntry } from '../../src/models/TimeEntry';
import { ApiError } from '../../src/utils/ApiError';
import { createTestClient, createTestProject, createTestTimeEntry, createTestUser } from '../helpers';

describe('invoice.service generateInvoice', () => {
  it('bills every unbilled billable time entry in the period and computes the total', async () => {
    const user = await createTestUser();
    const client = await createTestClient(user._id.toString());
    const project = await createTestProject(user._id.toString(), client._id.toString(), {
      hourlyRate: 80,
      currency: 'EUR',
    });
    await createTestTimeEntry(user._id.toString(), project._id.toString(), { hours: 3 });
    await createTestTimeEntry(user._id.toString(), project._id.toString(), { hours: 2 });

    const invoice = await generateInvoice(user._id.toString(), {
      clientId: client._id.toString(),
      periodStart: '2026-01-01',
      periodEnd: '2026-12-31',
    });

    expect(invoice.status).toBe('DRAFT');
    expect(invoice.currency).toBe('EUR');
    expect(invoice.lineItems).toHaveLength(1);
    expect(invoice.lineItems[0]!.hours).toBe(5);
    expect(invoice.total).toBe(400); // 5h * 80
    expect(invoice.invoiceNumber).toBe(1);
  });

  it('marks billed time entries as invoiced so they cannot be billed twice', async () => {
    const user = await createTestUser();
    const client = await createTestClient(user._id.toString());
    const project = await createTestProject(user._id.toString(), client._id.toString());
    const entry = await createTestTimeEntry(user._id.toString(), project._id.toString(), { hours: 4 });

    await generateInvoice(user._id.toString(), {
      clientId: client._id.toString(),
      periodStart: '2026-01-01',
      periodEnd: '2026-12-31',
    });

    const reloaded = await TimeEntry.findById(entry._id);
    expect(reloaded!.invoiced).toBe(true);

    await expect(
      generateInvoice(user._id.toString(), {
        clientId: client._id.toString(),
        periodStart: '2026-01-01',
        periodEnd: '2026-12-31',
      }),
    ).rejects.toThrow(ApiError);
  });

  it('excludes non-billable time entries from the invoice', async () => {
    const user = await createTestUser();
    const client = await createTestClient(user._id.toString());
    const project = await createTestProject(user._id.toString(), client._id.toString());
    await createTestTimeEntry(user._id.toString(), project._id.toString(), { hours: 3, billable: true });
    await createTestTimeEntry(user._id.toString(), project._id.toString(), { hours: 5, billable: false });

    const invoice = await generateInvoice(user._id.toString(), {
      clientId: client._id.toString(),
      periodStart: '2026-01-01',
      periodEnd: '2026-12-31',
    });

    expect(invoice.lineItems[0]!.hours).toBe(3);
  });

  it('excludes time entries outside the requested period', async () => {
    const user = await createTestUser();
    const client = await createTestClient(user._id.toString());
    const project = await createTestProject(user._id.toString(), client._id.toString());
    await createTestTimeEntry(user._id.toString(), project._id.toString(), {
      hours: 3,
      date: new Date('2025-01-15'),
    });

    await expect(
      generateInvoice(user._id.toString(), {
        clientId: client._id.toString(),
        periodStart: '2026-01-01',
        periodEnd: '2026-12-31',
      }),
    ).rejects.toThrow('No unbilled time entries found');
  });

  it('rejects when the client has no projects at all', async () => {
    const user = await createTestUser();
    const client = await createTestClient(user._id.toString());

    await expect(
      generateInvoice(user._id.toString(), {
        clientId: client._id.toString(),
        periodStart: '2026-01-01',
        periodEnd: '2026-12-31',
      }),
    ).rejects.toThrow('no projects to invoice');
  });

  it('increments invoiceNumber per user across multiple invoices', async () => {
    const user = await createTestUser();
    const client = await createTestClient(user._id.toString());
    const project = await createTestProject(user._id.toString(), client._id.toString());
    await createTestTimeEntry(user._id.toString(), project._id.toString(), { hours: 1 });

    const first = await generateInvoice(user._id.toString(), {
      clientId: client._id.toString(),
      periodStart: '2026-01-01',
      periodEnd: '2026-12-31',
    });

    await createTestTimeEntry(user._id.toString(), project._id.toString(), { hours: 1 });
    const second = await generateInvoice(user._id.toString(), {
      clientId: client._id.toString(),
      periodStart: '2026-01-01',
      periodEnd: '2026-12-31',
    });

    expect(first.invoiceNumber).toBe(1);
    expect(second.invoiceNumber).toBe(2);
  });
});

describe('invoice.service updateInvoiceStatus', () => {
  async function setupInvoice() {
    const user = await createTestUser();
    const client = await createTestClient(user._id.toString());
    const project = await createTestProject(user._id.toString(), client._id.toString());
    await createTestTimeEntry(user._id.toString(), project._id.toString(), { hours: 2 });
    const invoice = await generateInvoice(user._id.toString(), {
      clientId: client._id.toString(),
      periodStart: '2026-01-01',
      periodEnd: '2026-12-31',
    });
    return { user, invoice };
  }

  it('allows DRAFT -> SENT -> PAID in order', async () => {
    const { user, invoice } = await setupInvoice();

    const sent = await updateInvoiceStatus(user._id.toString(), invoice._id.toString(), 'SENT');
    expect(sent.status).toBe('SENT');

    const paid = await updateInvoiceStatus(user._id.toString(), invoice._id.toString(), 'PAID');
    expect(paid.status).toBe('PAID');
    expect(paid.paidAt).toBeDefined();
  });

  it('rejects marking a DRAFT invoice as PAID directly', async () => {
    const { user, invoice } = await setupInvoice();

    await expect(updateInvoiceStatus(user._id.toString(), invoice._id.toString(), 'PAID')).rejects.toThrow(
      'Cannot mark as PAID',
    );
  });

  it('rejects marking an already-SENT invoice as SENT again', async () => {
    const { user, invoice } = await setupInvoice();
    await updateInvoiceStatus(user._id.toString(), invoice._id.toString(), 'SENT');

    await expect(updateInvoiceStatus(user._id.toString(), invoice._id.toString(), 'SENT')).rejects.toThrow(
      'Cannot mark as SENT',
    );
  });
});

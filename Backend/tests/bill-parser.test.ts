import express from 'express';
import request from 'supertest';
import Excel from 'exceljs';
import templateRoutes from '../src/routes/templates';
import { createErrorHandler } from '../src/lib/errors';

jest.mock('../src/middleware/auth.middleware', () => ({
  authenticate: (req: any, res: any, next: any) => next(),
  requireFeaturePermission: (resource: string, action: string) => (req: any, res: any, next: any) => next(),
  locationFilter: (user: any) => ({}),
}));

jest.mock('../src/middleware/effective-role', () => ({
  enforceEffectiveRole: (req: any, res: any, next: any) => next(),
}));

jest.mock('../src/lib/prisma', () => {
  const __prismaMocks = {
    template: {
      findFirst: jest.fn(),
    },
  };

  return {
    __prismaMocks,
    prisma: __prismaMocks,
  };
});

jest.mock('../src/middleware/capacity', () => ({
  requireCapacity: () => (req: any, res: any, next: any) => next(),
}));

const { prisma } = jest.requireMock('../src/lib/prisma') as any;
const mockTemplateFindFirst = prisma.template.findFirst as jest.Mock;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/templates', templateRoutes);
  app.use(createErrorHandler());
  return app;
}

async function createWorkbook(data: string[][]): Promise<Buffer> {
  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet('Sheet1');
  for (const row of data) {
    sheet.addRow(row);
  }
  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}

describe('Bill fixed-column Excel parser', () => {
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTemplateFindFirst.mockResolvedValue({
      id: 'test-template-bill',
      transactionType: 'BILL',
      columnMappings: null,
    });
    app = buildApp();
  });

  it('parses a valid new 12-column bill format into a bill transaction', async () => {
    const data = [
      ['Supplier', 'Terms', 'Bill Date', 'Due Date', 'Bill No', 'Category', 'Description', 'Amount', 'Tax', 'Customer', 'Amount Type', 'Memo'],
      ['Vendor A', 'Net 30', '2026-08-10', '2026-08-30', 'BILL-1001', 'Office Supplies', 'Pens', '150.00', 'Taxable', 'Customer A', 'Exclusive of tax', 'First line'],
    ];
    const buf = await createWorkbook(data);

    const res = await request(app)
      .post('/api/templates/parse-excel-data?templateId=test-template-bill')
      .attach('file', buf, {
        filename: 'bill.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(1);
    const transaction = res.body.transactions[0];
    expect(transaction.type).toBe('BILL');
    expect(transaction.header.vendor).toBe('Vendor A');
    expect(transaction.header.supplier).toBe('Vendor A');
    expect(transaction.header.docNumber).toBe('BILL-1001');
    expect(transaction.header.date).toBe('2026-08-10');
    expect(transaction.header.dueDate).toBe('2026-08-30');
    expect(transaction.header.terms).toBe('Net 30');
    expect(transaction.header.amountType).toBe('Exclusive of tax');
    expect(transaction.header.taxType).toBe('Exclusive of tax');
    expect(transaction.header.memo).toBe('First line');
    expect(transaction.lineItems).toHaveLength(1);
    expect(transaction.lineItems[0].category).toBe('Office Supplies');
    expect(transaction.lineItems[0].description).toBe('Pens');
    expect(transaction.lineItems[0].amount).toBe('150.00');
    expect(transaction.lineItems[0].tax).toBe('Taxable');
    expect(transaction.lineItems[0].customer).toBe('Customer A');
  });

  it('groups rows with identical bill-level keys and merges duplicate line items', async () => {
    const data = [
      ['Supplier', 'Terms', 'Bill Date', 'Due Date', 'Bill No', 'Category', 'Description', 'Amount', 'Tax', 'Customer', 'Amount Type', 'Memo'],
      ['Vendor A', 'Net 30', '2026-08-10', '2026-08-30', 'BILL-1002', 'Office Supplies', 'Pens', '100.00', 'Taxable', 'Customer A', 'Exclusive of tax', 'Line A'],
      ['Vendor A', 'Net 30', '2026-08-10', '2026-08-30', 'BILL-1002', 'Office Supplies', 'Pens', '50.00', 'Taxable', 'Customer A', 'Exclusive of tax', 'Line A'],
      ['Vendor A', 'Net 30', '2026-08-10', '2026-08-30', 'BILL-1002', 'Office Supplies', 'Paper', '75.00', 'Taxable', 'Customer B', 'Exclusive of tax', 'Line B'],
    ];
    const buf = await createWorkbook(data);

    const res = await request(app)
      .post('/api/templates/parse-excel-data?templateId=test-template-bill')
      .attach('file', buf, {
        filename: 'bill.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(1);
    const transaction = res.body.transactions[0];
    expect(transaction.lineItems).toHaveLength(2);
    expect(transaction.lineItems.find((item: any) => item.description === 'Pens')?.amount).toBe('150.00');
    expect(transaction.lineItems.find((item: any) => item.description === 'Paper')?.amount).toBe('75.00');
  });

  it('returns 400 when a new bill row has fewer than 12 columns', async () => {
    const data = [
      ['Supplier', 'Terms', 'Bill Date', 'Due Date', 'Bill No', 'Category', 'Description', 'Amount', 'Tax', 'Customer', 'Amount Type', 'Memo'],
      ['Vendor A', 'Net 30', '2026-08-10', '2026-08-30', 'BILL-1003', 'Office Supplies', 'Pens', '100.00', 'Taxable', 'Customer A', 'Exclusive of tax'],
    ];
    const buf = await createWorkbook(data);

    const res = await request(app)
      .post('/api/templates/parse-excel-data?templateId=test-template-bill')
      .attach('file', buf, {
        filename: 'bill.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Bill Excel must have exactly 12 non-empty data columns');
  });

  it('returns 400 when a new bill row has more than 12 columns', async () => {
    const data = [
      ['Supplier', 'Terms', 'Bill Date', 'Due Date', 'Bill No', 'Category', 'Description', 'Amount', 'Tax', 'Customer', 'Amount Type', 'Memo'],
      ['Vendor A', 'Net 30', '2026-08-10', '2026-08-30', 'BILL-1004', 'Office Supplies', 'Pens', '100.00', 'Taxable', 'Customer A', 'Exclusive of tax', 'Line A', 'Extra'],
    ];
    const buf = await createWorkbook(data);

    const res = await request(app)
      .post('/api/templates/parse-excel-data?templateId=test-template-bill')
      .attach('file', buf, {
        filename: 'bill.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Row 2 has 13');
  });

  it('parses a valid new 12-column bill format with an empty customer field', async () => {
    const data = [
      ['Supplier', 'Terms', 'Bill Date', 'Due Date', 'Bill No', 'Category', 'Description', 'Amount', 'Tax', 'Customer', 'Amount Type', 'Memo'],
      ['Vendor A', 'Net 30', '2026-08-10', '2026-08-30', 'BILL-1005', 'Office Supplies', 'Pens', '75.00', 'Taxable', '', 'Exclusive of tax', 'No customer'],
    ];
    const buf = await createWorkbook(data);

    const res = await request(app)
      .post('/api/templates/parse-excel-data?templateId=test-template-bill')
      .attach('file', buf, {
        filename: 'bill.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

    expect(res.status).toBe(200);
    const transaction = res.body.transactions[0];
    expect(transaction.lineItems[0].customer).toBe('');
  });

  it('returns 400 when a new bill row has a non-numeric amount value', async () => {
    const data = [
      ['Supplier', 'Terms', 'Bill Date', 'Due Date', 'Bill No', 'Category', 'Description', 'Amount', 'Tax', 'Customer', 'Amount Type', 'Memo'],
      ['Vendor A', 'Net 30', '2026-08-10', '2026-08-30', 'BILL-1006', 'Office Supplies', 'Pens', 'N/A', 'Taxable', 'Customer A', 'Exclusive of tax', 'Invalid amount'],
    ];
    const buf = await createWorkbook(data);

    const res = await request(app)
      .post('/api/templates/parse-excel-data?templateId=test-template-bill')
      .attach('file', buf, {
        filename: 'bill.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Invalid amount 'N/A'");
  });

  it('parses a new 12-column bill format with invalid date strings', async () => {
    const data = [
      ['Supplier', 'Terms', 'Bill Date', 'Due Date', 'Bill No', 'Category', 'Description', 'Amount', 'Tax', 'Customer', 'Amount Type', 'Memo'],
      ['Vendor A', 'Net 30', 'not-a-date', '13/45/2024', 'BILL-1007', 'Office Supplies', 'Pens', '120.00', 'Taxable', 'Customer A', 'Exclusive of tax', 'Bad dates'],
    ];
    const buf = await createWorkbook(data);

    const res = await request(app)
      .post('/api/templates/parse-excel-data?templateId=test-template-bill')
      .attach('file', buf, {
        filename: 'bill.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

    expect(res.status).toBe(200);
    expect(res.body.transactions[0].header.date).toBe('not-a-date');
    expect(res.body.transactions[0].header.dueDate).toBe('13/45/2024');
  });

  it('parses special characters in supplier and customer names', async () => {
    const data = [
      ['Supplier', 'Terms', 'Bill Date', 'Due Date', 'Bill No', 'Category', 'Description', 'Amount', 'Tax', 'Customer', 'Amount Type', 'Memo'],
      ['O\'Brien & Sons "Trading" Ltd.', 'Net 30', '2026-08-10', '2026-08-30', 'BILL-1008', 'Office Supplies', 'Pens', '175.00', 'Taxable', 'Áéíóú Café Müller', 'Exclusive of tax', 'Unicode names'],
    ];
    const buf = await createWorkbook(data);

    const res = await request(app)
      .post('/api/templates/parse-excel-data?templateId=test-template-bill')
      .attach('file', buf, {
        filename: 'bill.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

    expect(res.status).toBe(200);
    expect(res.body.transactions[0].header.vendor).toBe('O\'Brien & Sons "Trading" Ltd.');
    expect(res.body.transactions[0].lineItems[0].customer).toBe('Áéíóú Café Müller');
  });

  it('parses multiple bill numbers in one file into separate transactions', async () => {
    const data = [
      ['Supplier', 'Terms', 'Bill Date', 'Due Date', 'Bill No', 'Category', 'Description', 'Amount', 'Tax', 'Customer', 'Amount Type', 'Memo'],
      ['Vendor A', 'Net 30', '2026-08-10', '2026-08-30', 'INV-001', 'Office Supplies', 'Pens', '100.00', 'Taxable', 'Customer A', 'Exclusive of tax', 'Line 1'],
      ['Vendor A', 'Net 30', '2026-08-10', '2026-08-30', 'INV-001', 'Office Supplies', 'Pens', '50.00', 'Taxable', 'Customer A', 'Exclusive of tax', 'Line 2'],
      ['Vendor A', 'Net 30', '2026-08-10', '2026-08-30', 'INV-002', 'Office Supplies', 'Paper', '75.00', 'Taxable', 'Customer B', 'Exclusive of tax', 'Line 3'],
      ['Vendor A', 'Net 30', '2026-08-10', '2026-08-30', 'INV-002', 'Office Supplies', 'Staples', '25.00', 'Taxable', 'Customer B', 'Exclusive of tax', 'Line 4'],
      ['Vendor A', 'Net 30', '2026-08-10', '2026-08-30', 'INV-003', 'Office Supplies', 'Tape', '10.00', 'Taxable', 'Customer C', 'Exclusive of tax', 'Line 5'],
    ];
    const buf = await createWorkbook(data);

    const res = await request(app)
      .post('/api/templates/parse-excel-data?templateId=test-template-bill')
      .attach('file', buf, {
        filename: 'bill.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(3);
    expect(res.body.transactions.find((t: any) => t.header.docNumber === 'INV-001')?.lineItems).toHaveLength(1);
    expect(res.body.transactions.find((t: any) => t.header.docNumber === 'INV-002')?.lineItems).toHaveLength(2);
    expect(res.body.transactions.find((t: any) => t.header.docNumber === 'INV-003')?.lineItems).toHaveLength(1);
  });

  it('parses the legacy bill format when headers match the old bill schema', async () => {
    const data = [
      ['Date', 'Vendor', 'Bill No', 'Due Date', 'Account', 'Tax Type', 'Amount', 'Memo', 'Terms', 'PO Number', 'Department'],
      ['2026-08-10', 'Vendor B', 'BILL-2005', '2026-09-05', 'Accounts Payable', 'NonTaxable', '125.00', 'Office supplies', 'Net 30', 'PO-123', 'Operations'],
    ];
    const buf = await createWorkbook(data);

    const res = await request(app)
      .post('/api/templates/parse-excel-data?templateId=test-template-bill')
      .attach('file', buf, {
        filename: 'bill.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(1);
    const transaction = res.body.transactions[0];
    expect(transaction.type).toBe('BILL');
    expect(transaction.header.vendor).toBe('Vendor B');
    expect(transaction.header.account).toBe('Accounts Payable');
    expect(transaction.header.taxType).toBe('NonTaxable');
    expect(transaction.lineItems[0].amount).toBe('125.00');
  });
});

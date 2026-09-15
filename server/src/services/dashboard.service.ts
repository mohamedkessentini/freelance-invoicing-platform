import { Types } from 'mongoose';
import { Invoice } from '../models/Invoice';
import { TimeEntry } from '../models/TimeEntry';

export interface MonthlyRevenue {
  month: string; // "2026-01"
  total: number;
}

export interface DashboardSummary {
  outstandingTotal: number;
  paidTotal: number;
  hoursLoggedThisMonth: number;
  revenueByMonth: MonthlyRevenue[];
}

export async function getDashboardSummary(userId: string): Promise<DashboardSummary> {
  const userObjectId = new Types.ObjectId(userId);

  const [outstandingAgg, paidAgg, revenueByMonthAgg, hoursThisMonthAgg] = await Promise.all([
    Invoice.aggregate([
      { $match: { user: userObjectId, status: { $in: ['SENT', 'OVERDUE'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Invoice.aggregate([
      { $match: { user: userObjectId, status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Invoice.aggregate([
      { $match: { user: userObjectId, status: 'PAID', paidAt: { $ne: null } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } },
          total: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    TimeEntry.aggregate([
      { $match: { user: userObjectId, date: { $gte: startOfCurrentMonth() } } },
      { $group: { _id: null, hours: { $sum: '$hours' } } },
    ]),
  ]);

  return {
    outstandingTotal: outstandingAgg[0]?.total ?? 0,
    paidTotal: paidAgg[0]?.total ?? 0,
    hoursLoggedThisMonth: hoursThisMonthAgg[0]?.hours ?? 0,
    revenueByMonth: revenueByMonthAgg.map((row: { _id: string; total: number }) => ({
      month: row._id,
      total: row.total,
    })),
  };
}

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

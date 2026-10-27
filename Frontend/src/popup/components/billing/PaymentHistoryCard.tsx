import React from 'react';
import type { ScanPackPurchase } from '../../lib/api';

interface PaymentHistoryCardProps {
  purchases: ScanPackPurchase[];
  loading: boolean;
  onManageBilling?: () => void;
}

export function PaymentHistoryCard({ purchases, loading, onManageBilling }: PaymentHistoryCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Payment history</div>
          <div className="mt-0.5 text-xs text-gray-500">Recent scan-pack purchases</div>
        </div>
        {onManageBilling ? (
          <button type="button" onClick={onManageBilling} className="text-xs font-semibold text-emerald-700 hover:text-emerald-600">All invoices</button>
        ) : null}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2" aria-label="Loading payment history">
          <div className="h-10 rounded bg-gray-100" />
          <div className="h-10 rounded bg-gray-100" />
        </div>
      ) : purchases.length === 0 ? (
        <div className="rounded-lg bg-gray-50 px-3 py-4 text-center text-xs text-gray-500">No recent scan-pack purchases.</div>
      ) : (
        <div className="space-y-2">
          {purchases.map((purchase) => (
            <div key={purchase.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div>
                <div className="text-sm font-semibold text-gray-900">{purchase.scans} scans</div>
                <div className="text-[11px] text-gray-500">{new Date(purchase.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">${purchase.pricePaid.toFixed(2)}</div>
                <div className={`text-[11px] font-semibold ${purchase.status === 'refunded' ? 'text-red-600' : 'text-emerald-600'}`}>{purchase.status === 'refunded' ? 'Refunded' : 'Paid'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

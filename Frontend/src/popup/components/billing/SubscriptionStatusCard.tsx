import React from 'react';
import type { BillingStatusResponse } from '../../lib/api';

interface SubscriptionStatusCardProps {
  status: BillingStatusResponse | null;
  loading: boolean;
  onOpenChangePlan: () => void;
  onOpenCancel: () => void;
  onReactivate: () => void;
  onOpenStripePortal: () => void;
  reactivating?: boolean;
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString();
}

export function SubscriptionStatusCard({
  status,
  loading,
  onOpenChangePlan,
  onOpenCancel,
  onReactivate,
  onOpenStripePortal,
  reactivating = false,
}: SubscriptionStatusCardProps) {
  if (loading) {
    return (
      <div aria-label="Loading subscription" className="animate-pulse rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3 h-4 w-1/3 rounded bg-gray-100" />
        <div className="mb-4 h-6 w-1/2 rounded bg-gray-100" />
        <div className="h-9 rounded bg-gray-100" />
      </div>
    );
  }

  const tier = status?.tier || 'free';
  const isActive = status?.status === 'active';
  const cancellationPending = Boolean(status?.cancel_at_period_end);
  const paymentIssue = Boolean(status?.payment_issue);
  const periodEnd = formatDate(status?.current_period_end);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Current plan</div>
          <div className="mt-1 text-lg font-semibold capitalize text-gray-900">{tier}</div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${paymentIssue ? 'bg-red-50 text-red-700' : cancellationPending ? 'bg-amber-50 text-amber-700' : isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
          {paymentIssue ? 'Payment issue' : cancellationPending ? 'Cancels soon' : isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {status?.plan_interval && (
        <div className="text-xs text-gray-500">
          Billing interval: <span className="font-medium text-gray-700">{status.plan_interval === 'year' ? 'Annual' : 'Monthly'}</span>
        </div>
      )}

      {cancellationPending && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Subscription cancellation is pending. Access continues until {periodEnd || 'the end of the current billing period'}.
        </div>
      )}

      {paymentIssue && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          Your latest payment failed. Open the Stripe portal to update your payment method.
        </div>
      )}

      {!cancellationPending && periodEnd && (
        <div className="text-xs text-gray-500">Next renewal: {periodEnd}</div>
      )}

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button type="button" onClick={onOpenChangePlan} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600">
          Change Plan
        </button>
        {cancellationPending ? (
          <button type="button" onClick={onReactivate} disabled={reactivating} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 disabled:opacity-50">
            {reactivating ? 'Reactivating…' : 'Reactivate Plan'}
          </button>
        ) : isActive ? (
          <button type="button" onClick={onOpenCancel} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100">
            Cancel Subscription
          </button>
        ) : null}
        <button type="button" onClick={onOpenStripePortal} className="col-span-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100">
          Payment Methods &amp; Invoices
        </button>
      </div>
    </div>
  );
}

import React from 'react';

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: () => void;
  currentPeriodEnd?: string | null;
  loading?: boolean;
}

export function CancelSubscriptionModal({ isOpen, onClose, onConfirmCancel, currentPeriodEnd, loading = false }: CancelSubscriptionModalProps) {
  if (!isOpen) return null;
  const parsedDate = currentPeriodEnd ? new Date(currentPeriodEnd) : null;
  const periodEnd = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toLocaleDateString() : 'the end of your billing period';

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="cancel-subscription-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        <h2 id="cancel-subscription-title" className="text-lg font-semibold text-gray-900">Cancel subscription?</h2>
        <p className="mt-2 text-sm text-gray-600">
          Your paid features remain available until {periodEnd}. The subscription then moves to the Free plan.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} disabled={loading} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-50">Keep Subscription</button>
          <button type="button" onClick={onConfirmCancel} disabled={loading} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
            {loading ? 'Scheduling…' : 'Confirm Cancellation'}
          </button>
        </div>
      </div>
    </div>
  );
}

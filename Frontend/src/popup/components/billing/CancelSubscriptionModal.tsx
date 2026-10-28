import React, { useEffect, useState } from 'react';

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (data?: { reason: string; feedback?: string }) => void;
  currentPeriodEnd?: string | null;
  loading?: boolean;
}

export function CancelSubscriptionModal({ isOpen, onClose, onConfirmCancel, currentPeriodEnd, loading = false }: CancelSubscriptionModalProps) {
  const [reason, setReason] = useState('too_expensive');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('too_expensive');
      setFeedback('');
    }
  }, [isOpen]);

  if (!isOpen) return null;
  const parsedDate = currentPeriodEnd ? new Date(currentPeriodEnd) : null;
  const periodEnd = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toLocaleDateString() : 'the end of your billing period';

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="cancel-subscription-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
        onSubmit={(event) => {
          event.preventDefault();
          onConfirmCancel({ reason, feedback: feedback.trim() || undefined });
        }}
      >
        <h2 id="cancel-subscription-title" className="text-lg font-semibold text-gray-900">Cancel subscription?</h2>
        <p className="mt-2 text-sm text-gray-600">
          Your paid features remain available until {periodEnd}. The subscription then moves to the Free plan.
        </p>
        <fieldset className="mt-4 space-y-2">
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Reason for cancelling</legend>
          {[
            ['too_expensive', 'Too expensive / Price increase'],
            ['missing_features', 'Missing required features'],
            ['switched_service', 'Switched to another tool'],
            ['temporary_pause', 'Temporary pause / Not needed right now'],
            ['other', 'Other reason'],
          ].map(([value, label]) => (
            <label key={value} className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700">
              <input type="radio" name="cancellation-reason" value={value} checked={reason === value} onChange={() => setReason(value)} />
              {label}
            </label>
          ))}
        </fieldset>
        <label className="mt-4 block text-xs font-semibold text-gray-600">
          Additional feedback (optional)
          <textarea
            value={feedback}
            onChange={(event) => setFeedback(event.target.value.slice(0, 500))}
            maxLength={500}
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm font-normal text-gray-900"
            placeholder="What could we have done better?"
          />
          <span className="block text-right font-normal text-gray-400">{feedback.length}/500</span>
        </label>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} disabled={loading} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-50">Keep Subscription</button>
          <button type="submit" disabled={loading} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
            {loading ? 'Scheduling…' : 'Confirm Cancellation'}
          </button>
        </div>
      </form>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { api, type BillingInterval, type BillingPlanKey, type PreviewProrationResponse } from '../../lib/api';

interface PlanChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: string;
  currentInterval: string;
  onConfirmChange: (plan: BillingPlanKey, interval: BillingInterval, prorationDate?: number) => Promise<void>;
  jwt: string;
}

const PLANS: Array<{ id: BillingPlanKey; name: string; month: number; year: number }> = [
  { id: 'starter', name: 'Starter', month: 19, year: 15 },
  { id: 'professional', name: 'Professional', month: 39, year: 31 },
  { id: 'premium', name: 'Premium', month: 79, year: 63 },
  { id: 'enterprise', name: 'Enterprise', month: 149, year: 119 },
];

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unable to complete the billing request.';
}

export function PlanChangeModal({ isOpen, onClose, currentTier, currentInterval, onConfirmChange, jwt }: PlanChangeModalProps) {
  const normalizedCurrentTier = currentTier.toLowerCase();
  const initialPlan = PLANS.some((plan) => plan.id === normalizedCurrentTier) ? normalizedCurrentTier as BillingPlanKey : 'starter';
  const normalizedCurrentInterval: BillingInterval = currentInterval === 'year' ? 'year' : 'month';
  const [selectedPlan, setSelectedPlan] = useState<BillingPlanKey>(initialPlan);
  const [selectedInterval, setSelectedInterval] = useState<BillingInterval>(normalizedCurrentInterval);
  const [preview, setPreview] = useState<PreviewProrationResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unchanged = selectedPlan === normalizedCurrentTier && selectedInterval === normalizedCurrentInterval;
  const selectedPlanDetails = useMemo(() => PLANS.find((plan) => plan.id === selectedPlan)!, [selectedPlan]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedPlan(initialPlan);
    setSelectedInterval(normalizedCurrentInterval);
    setPreview(null);
    setError(null);
  }, [isOpen, initialPlan, normalizedCurrentInterval]);

  useEffect(() => {
    if (!isOpen || unchanged || !jwt) {
      setPreview(null);
      return;
    }

    let active = true;
    setPreviewLoading(true);
    setError(null);
    api.previewProration(jwt, selectedPlan, selectedInterval)
      .then((response) => { if (active) setPreview(response); })
      .catch((requestError) => { if (active) setError(errorMessage(requestError)); })
      .finally(() => { if (active) setPreviewLoading(false); });

    return () => { active = false; };
  }, [isOpen, jwt, selectedPlan, selectedInterval, unchanged]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (unchanged || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirmChange(selectedPlan, selectedInterval, preview?.data.prorationDate);
      onClose();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="change-plan-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="change-plan-title" className="text-lg font-semibold text-gray-900">Change subscription plan</h2>
          <button type="button" aria-label="Close plan change" onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-100">✕</button>
        </div>

        <div className="mb-4 grid grid-cols-2 rounded-lg bg-gray-100 p-1">
          {(['month', 'year'] as BillingInterval[]).map((interval) => (
            <button key={interval} type="button" onClick={() => setSelectedInterval(interval)} className={`rounded-md px-3 py-2 text-xs font-semibold ${selectedInterval === interval ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'}`}>
              {interval === 'month' ? 'Monthly' : 'Annual'}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {PLANS.map((plan) => (
            <button key={plan.id} type="button" onClick={() => setSelectedPlan(plan.id)} className={`flex w-full items-center justify-between rounded-lg border p-3 text-left ${selectedPlan === plan.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <span className="text-sm font-semibold text-gray-900">{plan.name}</span>
              <span className="text-xs text-gray-600">${selectedInterval === 'year' ? plan.year : plan.month}/mo</span>
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
          {unchanged ? 'Select a different plan or billing interval.' : previewLoading ? 'Calculating proration…' : preview ? (
            <>
              <div className="font-semibold text-gray-800">Estimated amount due now</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {new Intl.NumberFormat(undefined, { style: 'currency', currency: preview.data.currency.toUpperCase() }).format(preview.data.amountDue / 100)}
              </div>
              <div className="mt-1">Stripe calculates the final charge when you confirm.</div>
            </>
          ) : `Selected: ${selectedPlanDetails.name}`}
        </div>

        {error && <div role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700">Cancel</button>
          <button type="button" onClick={() => void handleConfirm()} disabled={unchanged || previewLoading || submitting} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? 'Updating…' : 'Confirm Change'}
          </button>
        </div>
      </div>
    </div>
  );
}

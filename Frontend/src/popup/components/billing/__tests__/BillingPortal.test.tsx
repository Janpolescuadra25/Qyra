import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionStatusCard } from '../SubscriptionStatusCard';
import { CancelSubscriptionModal } from '../CancelSubscriptionModal';
import { PaymentHistoryCard } from '../PaymentHistoryCard';
import type { BillingStatusResponse, ScanPackPurchase } from '../../../lib/api';

let root: Root | null = null;

function render(element: React.ReactNode): HTMLDivElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container);
    root.render(element);
  });
  return container;
}

function clickButton(container: HTMLElement, label: string) {
  const button = Array.from(container.querySelectorAll('button')).find((candidate) => candidate.textContent?.includes(label));
  expect(button).toBeDefined();
  act(() => button!.click());
}

const activeStatus: BillingStatusResponse = {
  success: true,
  tier: 'professional',
  status: 'active',
  current_period_end: '2026-12-31T00:00:00.000Z',
  cancel_at_period_end: false,
  payment_issue: false,
  plan_interval: 'month',
  pool_scans: 250,
  bonus_scans: 0,
};

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

describe('Deliverable 12.5 billing portal components', () => {
  it('renders the active subscription tier and actions', () => {
    const container = render(
      <SubscriptionStatusCard
        status={activeStatus}
        loading={false}
        onOpenChangePlan={vi.fn()}
        onOpenCancel={vi.fn()}
        onReactivate={vi.fn()}
        onOpenStripePortal={vi.fn()}
      />,
    );

    expect(container.textContent).toContain('professional');
    expect(container.textContent).toContain('Active');
    expect(container.textContent).toContain('Change Plan');
    expect(container.textContent).toContain('Cancel Subscription');
  });

  it('shows pending cancellation state and reactivation action', () => {
    const container = render(
      <SubscriptionStatusCard
        status={{ ...activeStatus, cancel_at_period_end: true }}
        loading={false}
        onOpenChangePlan={vi.fn()}
        onOpenCancel={vi.fn()}
        onReactivate={vi.fn()}
        onOpenStripePortal={vi.fn()}
      />,
    );

    expect(container.textContent).toContain('Cancels soon');
    expect(container.textContent).toContain('Subscription cancellation is pending');
    expect(container.textContent).toContain('Reactivate Plan');
  });

  it('invokes the plan-change callback', () => {
    const onOpenChangePlan = vi.fn();
    const container = render(
      <SubscriptionStatusCard
        status={activeStatus}
        loading={false}
        onOpenChangePlan={onOpenChangePlan}
        onOpenCancel={vi.fn()}
        onReactivate={vi.fn()}
        onOpenStripePortal={vi.fn()}
      />,
    );

    clickButton(container, 'Change Plan');
    expect(onOpenChangePlan).toHaveBeenCalledTimes(1);
  });

  it('renders cancellation details and invokes confirmation', () => {
    const onConfirmCancel = vi.fn();
    const container = render(
      <CancelSubscriptionModal
        isOpen
        onClose={vi.fn()}
        onConfirmCancel={onConfirmCancel}
        currentPeriodEnd="2026-12-31T00:00:00.000Z"
      />,
    );

    expect(container.textContent).toContain('Cancel subscription?');
    expect(container.textContent).toContain('Keep Subscription');
    clickButton(container, 'Confirm Cancellation');
    expect(onConfirmCancel).toHaveBeenCalledTimes(1);
  });

  it('renders scan-pack purchase history using the API response fields', () => {
    const purchases: ScanPackPurchase[] = [{
      id: 'purchase-1',
      packKey: 'scan_pack_100',
      scans: 100,
      pricePaid: 19,
      status: 'completed',
      createdAt: '2026-10-27T00:00:00.000Z',
    }];
    const container = render(<PaymentHistoryCard purchases={purchases} loading={false} onManageBilling={vi.fn()} />);

    expect(container.textContent).toContain('100 scans');
    expect(container.textContent).toContain('$19.00');
    expect(container.textContent).toContain('Paid');
  });

  it('renders an empty payment-history state', () => {
    const container = render(<PaymentHistoryCard purchases={[]} loading={false} onManageBilling={vi.fn()} />);

    expect(container.textContent).toContain('No recent scan-pack purchases.');
  });
});

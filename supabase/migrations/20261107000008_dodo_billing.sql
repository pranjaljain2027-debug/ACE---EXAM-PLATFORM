-- Dodo Payments billing: webhook idempotency, provider status, customer id for the portal.

create table if not exists public.billing_webhook_events (
  id text primary key,
  provider text not null,
  event_type text not null,
  received_at timestamptz not null default now()
);
alter table public.billing_webhook_events enable row level security;
revoke all on public.billing_webhook_events from anon, authenticated;

alter table public.subscriptions add column if not exists provider_status text;

-- Billing read now includes the provider customer id (needed to open the Dodo customer portal).
create or replace function public.get_billing()
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_gate();
  return (select jsonb_build_object('plan', plan, 'status', status, 'current_period_end', current_period_end,
                                    'cancel_at_period_end', cancel_at_period_end, 'provider', provider,
                                    'provider_customer_id', provider_customer_id)
            from public.subscriptions where parent_id = auth.uid());
end $$;

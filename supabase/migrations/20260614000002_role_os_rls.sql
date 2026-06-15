-- RLS policies for Role OS 2.0 tables (Tier 349/357)

-- AU sellers: owner or admin
drop policy if exists au_sellers_select on public.au_sellers;
create policy au_sellers_select on public.au_sellers
for select to authenticated
using (claimed_user_id = auth.uid() or public.is_admin());

drop policy if exists au_sellers_update on public.au_sellers;
create policy au_sellers_update on public.au_sellers
for update to authenticated
using (claimed_user_id = auth.uid() or public.is_admin())
with check (claimed_user_id = auth.uid() or public.is_admin());

drop policy if exists au_sellers_admin_write on public.au_sellers;
create policy au_sellers_admin_write on public.au_sellers
for insert to authenticated
with check (public.is_admin());

drop policy if exists au_sellers_admin_delete on public.au_sellers;
create policy au_sellers_admin_delete on public.au_sellers
for delete to authenticated
using (public.is_admin());

-- Listings: seller owner or admin
drop policy if exists au_seller_listings_select on public.au_seller_listings;
create policy au_seller_listings_select on public.au_seller_listings
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.au_sellers s
    where s.id = seller_id and s.claimed_user_id = auth.uid()
  )
);

drop policy if exists au_seller_listings_write on public.au_seller_listings;
create policy au_seller_listings_write on public.au_seller_listings
for all to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.au_sellers s
    where s.id = seller_id and s.claimed_user_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.au_sellers s
    where s.id = seller_id and s.claimed_user_id = auth.uid()
  )
);

-- Contracts: seller owner, buyer partner owner, or admin
drop policy if exists au_seller_contracts_select on public.au_seller_contracts;
create policy au_seller_contracts_select on public.au_seller_contracts
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.au_sellers s
    where s.id = seller_id and s.claimed_user_id = auth.uid()
  )
  or (buyer_partner_id is not null and public.is_partner_owner(buyer_partner_id))
);

drop policy if exists au_seller_contracts_write on public.au_seller_contracts;
create policy au_seller_contracts_write on public.au_seller_contracts
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Affiliates: owner or admin
drop policy if exists affiliates_select on public.affiliates;
create policy affiliates_select on public.affiliates
for select to authenticated
using (claimed_user_id = auth.uid() or public.is_admin());

drop policy if exists affiliates_update on public.affiliates;
create policy affiliates_update on public.affiliates
for update to authenticated
using (claimed_user_id = auth.uid() or public.is_admin())
with check (claimed_user_id = auth.uid() or public.is_admin());

drop policy if exists affiliates_admin_write on public.affiliates;
create policy affiliates_admin_write on public.affiliates
for insert to authenticated
with check (public.is_admin());

drop policy if exists affiliate_campaigns_select on public.affiliate_campaigns;
create policy affiliate_campaigns_select on public.affiliate_campaigns
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.affiliates a
    where a.id = affiliate_id and a.claimed_user_id = auth.uid()
  )
);

drop policy if exists affiliate_campaigns_write on public.affiliate_campaigns;
create policy affiliate_campaigns_write on public.affiliate_campaigns
for all to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.affiliates a
    where a.id = affiliate_id and a.claimed_user_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.affiliates a
    where a.id = affiliate_id and a.claimed_user_id = auth.uid()
  )
);

drop policy if exists affiliate_attributions_select on public.affiliate_attributions;
create policy affiliate_attributions_select on public.affiliate_attributions
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.affiliates a
    where a.id = affiliate_id and a.claimed_user_id = auth.uid()
  )
);

drop policy if exists affiliate_attributions_admin_write on public.affiliate_attributions;
create policy affiliate_attributions_admin_write on public.affiliate_attributions
for insert to authenticated
with check (public.is_admin());

/*
# Atomic stock decrement + coupon usage columns

- decrement_stock_if_available: only decrements when stock >= qty
- increment_stock: rollback helper for failed orders
- coupons: usage_limit + used_count for abuse prevention
*/

CREATE OR REPLACE FUNCTION public.decrement_stock_if_available(p_product_id uuid, p_qty int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated int;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RAISE EXCEPTION 'decrement_stock_if_available: quantity must be positive';
  END IF;

  UPDATE public.products
  SET stock = stock - p_qty
  WHERE id = p_product_id AND stock >= p_qty;

  GET DIAGNOSTICS updated = ROW_COUNT;
  IF updated = 0 THEN
    RAISE EXCEPTION 'insufficient_stock';
  END IF;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_stock(p_product_id uuid, p_qty int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN RETURN; END IF;
  UPDATE public.products SET stock = stock + p_qty WHERE id = p_product_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decrement_stock_if_available(uuid, int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrement_stock_if_available(uuid, int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrement_stock_if_available(uuid, int) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stock_if_available(uuid, int) TO service_role;

REVOKE EXECUTE ON FUNCTION public.increment_stock(uuid, int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_stock(uuid, int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_stock(uuid, int) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_stock(uuid, int) TO service_role;

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS usage_limit int,
  ADD COLUMN IF NOT EXISTS used_count int NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_code text NOT NULL,
  user_id text NOT NULL,
  order_id text,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS coupon_redemptions_user_code_idx
  ON public.coupon_redemptions (coupon_code, user_id);

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

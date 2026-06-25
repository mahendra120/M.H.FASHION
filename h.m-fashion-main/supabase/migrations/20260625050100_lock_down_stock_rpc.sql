/*
# Security fix S-02 — restrict decrement_stock to service_role only

Reject non-positive quantities. Only server-side order API may adjust stock.
*/

CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id uuid, p_qty int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RAISE EXCEPTION 'decrement_stock: quantity must be a positive integer';
  END IF;

  UPDATE public.products
  SET stock = GREATEST(0, stock - p_qty)
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'decrement_stock: product not found';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decrement_stock(uuid, int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrement_stock(uuid, int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrement_stock(uuid, int) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, int) TO service_role;

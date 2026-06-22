/*
# Stock decrement RPC + orders admin update guard (v1)

1. New function `decrement_stock(p_product_id uuid, p_qty int)`
   - Atomically decrements product stock (floor at 0).
   - SECURITY DEFINER; granted to anon + authenticated so the order API route
     (running as service role which already bypasses RLS) and any future
     authenticated flow can use it.
2. Notes
   - We DO NOT grant a public UPDATE policy on `orders`. Order status updates
     happen only via the service-role client in API routes; this keeps
     non-admin callers from editing their own order status.
*/
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id uuid, p_qty int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(0, stock - p_qty)
  WHERE id = p_product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, int) TO anon, authenticated;

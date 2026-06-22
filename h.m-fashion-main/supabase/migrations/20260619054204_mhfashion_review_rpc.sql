/*
# Add rating recompute RPC (v1)

1. New function `recompute_product_rating(p_product_id uuid)`
   - Recalculates `products.rating` (1-decimal average) and `products.review_count`.
   - Idempotent; safe to call after each review insert or after deleting reviews.
2. Grant EXECUTE to anon + authenticated so the review API route (service-role
   client which bypasses RLS) and any authenticated caller can use it.
*/
CREATE OR REPLACE FUNCTION public.recompute_product_rating(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_rating numeric;
  cnt int;
BEGIN
  SELECT COALESCE(AVG(rating), 0), COUNT(*)
  INTO avg_rating, cnt
  FROM public.reviews
  WHERE product_id = p_product_id;

  UPDATE public.products
  SET rating = ROUND(avg_rating, 1),
      review_count = cnt
  WHERE id = p_product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recompute_product_rating(uuid) TO anon, authenticated;

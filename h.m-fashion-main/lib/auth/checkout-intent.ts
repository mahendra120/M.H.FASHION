/** Session keys for checkout / buy-now intent restoration after login. */
export const BUY_NOW_INTENT_KEY = 'mhf_buy_now_intent';
export const CHECKOUT_RETURN_KEY = 'mhf_checkout_return';

export interface BuyNowIntent {
  slug: string;
  size: string;
  color: string;
  quantity: number;
}

export function saveBuyNowIntent(intent: BuyNowIntent) {
  try {
    sessionStorage.setItem(BUY_NOW_INTENT_KEY, JSON.stringify(intent));
  } catch {
    // ignore
  }
}

export function consumeBuyNowIntent(slug: string): BuyNowIntent | null {
  try {
    const raw = sessionStorage.getItem(BUY_NOW_INTENT_KEY);
    if (!raw) return null;
    const intent = JSON.parse(raw) as BuyNowIntent;
    if (intent.slug !== slug) return null;
    sessionStorage.removeItem(BUY_NOW_INTENT_KEY);
    return intent;
  } catch {
    return null;
  }
}

export function saveCheckoutReturn(path: string) {
  try {
    sessionStorage.setItem(CHECKOUT_RETURN_KEY, path);
  } catch {
    // ignore
  }
}

export function buildLoginUrl(returnPath: string): string {
  return `/login?next=${encodeURIComponent(returnPath)}`;
}

export function buildSignupUrl(returnPath: string): string {
  return `/signup?next=${encodeURIComponent(returnPath)}`;
}

export const AUTH_REQUIRED_MESSAGE = 'Please login or sign up to continue';

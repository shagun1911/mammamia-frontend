import { v4 as uuidv4 } from "uuid";

/**
 * Single source of truth: SaaS plan keys → WooCommerce product IDs
 * 
 * Maps plan slugs to WooCommerce product IDs for checkout redirects.
 * Plan slugs are normalized to match the mapping keys.
 */
const PLAN_TO_PRODUCT_ID: Record<string, number> = {
  mileva: 807,
  nobel: 811,
  pro: 815,
  setup: 823,
};

/**
 * Normalize plan slug to match mapping keys
 * 
 * Converts plan slugs from database format to mapping keys:
 * - "mileva-pack" → "mileva"
 * - "nobel-pack" → "nobel"
 * - "aistein-pro-pack" → "pro"
 * - "set-up" → "setup"
 */
function normalizePlanSlug(slug: string): string {
  const lowerSlug = slug.toLowerCase().trim();
  
  // Handle specific plan mappings
  if (lowerSlug === 'aistein-pro-pack' || lowerSlug === 'aistein-pro') {
    return 'pro';
  }
  if (lowerSlug === 'set-up' || lowerSlug === 'setup') {
    return 'setup';
  }
  if (lowerSlug === 'nobel-pack' || lowerSlug === 'nobel') {
    return 'nobel';
  }
  if (lowerSlug === 'mileva-pack' || lowerSlug === 'mileva') {
    return 'mileva';
  }
  
  // Fallback: remove common suffixes
  return lowerSlug.replace(/-pack$/, '').replace(/-/g, '');
}

/**
 * Get WooCommerce product ID for a plan slug
 * 
 * @param planSlug - The plan slug from the database (e.g., "mileva-pack")
 * @returns The WooCommerce product ID, or null if not found
 */
export function getProductIdForPlan(planSlug: string): number | null {
  const normalized = normalizePlanSlug(planSlug);
  return PLAN_TO_PRODUCT_ID[normalized] || null;
}

/**
 * Redirect user to WooCommerce checkout with plan upgrade
 * 
 * This function:
 * - Adds product to WooCommerce cart
 * - Redirects directly to checkout (avoiding cart page)
 * - Preserves query params (uid, plan, intent) for webhook processing
 * - Uses MongoDB _id (not numeric IDs)
 * 
 * @param planSlug - The plan slug from the database (e.g., "mileva-pack")
 * @param userId - The user's MongoDB _id (or id as fallback)
 * @throws Error if plan is not found or user ID is missing
 */
export function redirectToWooCheckout(planSlug: string, userId: string | undefined): void {
  // Validate user ID
  if (!userId) {
    throw new Error("User ID is required for checkout");
  }

  // Get product ID for plan
  const productId = getProductIdForPlan(planSlug);
  if (!productId) {
    throw new Error(`Unknown plan: ${planSlug}. Available plans: mileva, nobel, pro, setup`);
  }

  // Generate unique intent ID for this upgrade click
  // Format: wc_<uuid> to identify it as a WooCommerce intent
  const intent = `wc_${uuidv4()}`;

  // Get user's MongoDB _id (prefer _id, fallback to id)
  // The backend sends _id, but frontend might have it as id
  const userMongoId = userId;

  // Build WooCommerce checkout URL
  // Format: https://www.aistein.it/?add-to-cart=PRODUCT_ID&redirect_to_checkout=1&uid=USER_ID&plan=PLAN_KEY&intent=INTENT_ID
  const checkoutUrl = new URL("https://www.aistein.it/");
  checkoutUrl.searchParams.set("add-to-cart", productId.toString());
  checkoutUrl.searchParams.set("redirect_to_checkout", "1");
  checkoutUrl.searchParams.set("uid", userMongoId);
  checkoutUrl.searchParams.set("plan", normalizePlanSlug(planSlug));
  checkoutUrl.searchParams.set("intent", intent);

  // Redirect browser to WooCommerce checkout
  // This preserves query params and works with WooCommerce Blocks checkout
  window.location.href = checkoutUrl.toString();
}


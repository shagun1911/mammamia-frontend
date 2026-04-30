/**
 * Labels that must not be passed through machine translation (AutoTranslate / Google Translate),
 * so product and platform names stay correct in every UI language.
 */
const PROTECTED_EXACT = new Set(
  [
    "WhatsApp",
    "Instagram",
    "Facebook",
    "Messenger",
    "Telegram",
    "Gmail",
    "Google",
    "Meta",
    "YouTube",
    "TikTok",
    "LinkedIn",
    "Twitter",
    "Slack",
    "Discord",
    "Zoom",
    "Twilio",
    "Stripe",
    "Shopify",
    "WooCommerce",
    "Magento",
    "GitHub",
    "OpenAI",
    "ElevenLabs",
  ].map((s) => s.toLowerCase())
);

/** True when the trimmed string should be kept as-is for auto-translation. */
export function isProtectedFromAutoTranslate(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (t.length > 80) return false;
  return PROTECTED_EXACT.has(t.toLowerCase());
}

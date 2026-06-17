/**
 * Centralized fallback response strings used across the AI pipeline.
 * Having a single source of truth prevents:
 *   - Repeating the same question across multiple turns
 *   - Inconsistent fallback quality
 *   - Fallback pollution of conversation memory
 */

export const FALLBACK_RESPONSES = [
  // ── Sanitizer fallback (response-sanitizer.service.ts) ──────────────
  'Ji bilkul, main aapki madad karne ke liye tayyar hoon.',
  // ── SarvamService LLM error fallback (sarvam.service.ts) ────────────
  'Ji bilkul, main aapki poori madad karne ke liye tayyar hoon. Kripya batayein aap kya janna chahte hain?',
  "I'm here to help you. Could you please tell me more about what you need?",
  // ── VobizLiveCallService empty response fallback (vobiz-live-call.service.ts) ─
  'Ji, aap jo bol rahe the woh main samajh gayi. Kya aur kuch batana chahenge?',
  'I understand. Could you please elaborate a bit more?',
  // ── VobizLiveCallService LLM error fallback (vobiz-live-call.service.ts) ──
  'Ji zaroor, main samajh gayi. Kya aap thoda aur bata sakte hain?',
  // ── Download / STT / general error fallbacks ──────────────────────────
  'Maafi chahti hoon, audio nahi mila. Kripya dobara bolein.',
  'Maafi chahti hoon, main sun nahi payi. Kripya dobara bolein.',
  'Kya aapne kuch kaha? Main sun rahi hoon.',
];

/** Check if a given text matches any known fallback response */
export function isFallbackResponse(text: string): boolean {
  if (!text) return false;
  const normalized = text.trim().toLowerCase();
  return FALLBACK_RESPONSES.some(fb => fb.toLowerCase() === normalized);
}

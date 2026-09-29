// Landing-page click tracking. No analytics provider is wired up yet — this
// keeps every call site ready to go once one is (Firebase Analytics, Plausible,
// etc.): swap the implementation here, no call site needs to change.
export type LandingClickEvent =
  | 'cta_web_hero'
  | 'cta_web_card'
  | 'cta_web_final'
  | 'store_ios'
  | 'store_android'
  | 'sticky_order'
  | 'sticky_app';

export function trackEvent(name: LandingClickEvent) {
  if (__DEV__) {
    console.log('[track]', name);
  }
}

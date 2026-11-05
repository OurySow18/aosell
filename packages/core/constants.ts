// Mirrors COURIER_COMMISSION_RATE in functions/src/index.ts — functions/ is
// a deliberately separate Node project (own deploy pipeline), so this can't
// be a shared import; keep both in sync by hand. Used here only for a
// client-side *estimate* shown before a delivery is accepted — the real
// commission is computed server-side once the order is actually delivered.
export const COURIER_COMMISSION_RATE = 0.15;

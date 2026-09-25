import { setI18nLocale } from '@/lib/i18n';
import { formatRelativeTime } from '@/lib/utils/format';

const NOW = new Date('2026-01-01T12:00:00.000Z').getTime();

describe('formatRelativeTime', () => {
  beforeAll(() => {
    // translate() falls back to the device locale otherwise, which makes
    // this test's expectations depend on the machine/CI running it.
    setI18nLocale('en');
  });

  it('reports "just now" for anything under a minute old', () => {
    expect(formatRelativeTime(new Date(NOW - 30_000).toISOString(), NOW)).toBe('Just now');
  });

  it('buckets into minutes under an hour old', () => {
    expect(formatRelativeTime(new Date(NOW - 5 * 60_000).toISOString(), NOW)).toBe('5 min ago');
  });

  it('buckets into hours under a day old', () => {
    expect(formatRelativeTime(new Date(NOW - 3 * 3_600_000).toISOString(), NOW)).toBe('3 h ago');
  });

  it('buckets into days under a week old', () => {
    expect(formatRelativeTime(new Date(NOW - 2 * 86_400_000).toISOString(), NOW)).toBe('2 d ago');
  });
});

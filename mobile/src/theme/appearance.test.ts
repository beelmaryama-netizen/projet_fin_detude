import { describe, expect, it } from 'vitest';
import { isDarkAppearance, validPreference } from './appearance';
import { colors, darkColors } from './tokens';
function luminance(hex: string) {
  const rgb = [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return rgb[0]! * 0.2126 + rgb[1]! * 0.7152 + rgb[2]! * 0.0722;
}
function contrast(a: string, b: string) { const values = [luminance(a), luminance(b)].sort((x, y) => y - x); return (values[0]! + 0.05) / (values[1]! + 0.05); }
describe('appearance', () => {
  it('follows the system only when requested and tolerates an unknown system theme', () => {
    expect(isDarkAppearance('system', 'dark')).toBe(true);
    expect(isDarkAppearance('system', 'light')).toBe(false);
    expect(isDarkAppearance('system', null)).toBe(false);
    expect(isDarkAppearance('light', 'dark')).toBe(false);
    expect(isDarkAppearance('dark', 'light')).toBe(true);
  });
  it('rejects invalid stored preferences', () => {
    for (const value of [null, '', 'invalid']) expect(validPreference(value)).toBe(false);
    for (const value of ['light', 'dark', 'system']) expect(validPreference(value)).toBe(true);
  });
  it.each([['light', colors], ['dark', darkColors]] as const)('keeps readable text and controls in %s mode', (_name, palette) => {
    for (const [foreground, background] of [[palette.ink, palette.background], [palette.ink, palette.surface], [palette.muted, palette.surface], [palette.primary, palette.surface], [palette.white, palette.primaryFill], [palette.danger, palette.dangerSurface], [palette.success, palette.successSurface]]) {
      expect(contrast(foreground!, background!)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

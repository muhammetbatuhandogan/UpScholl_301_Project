export const palette = {
  bg: '#f4f6fb',
  card: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  muted: '#64748b',
  primary: '#2563eb',
  primaryDark: '#1e40af',
  primarySoft: '#eff6ff',
  primaryText: '#ffffff',
  hero: '#1d4ed8',
  danger: '#dc2626',
  dangerSoft: '#fef2f2',
  success: '#059669',
  successSoft: '#ecfdf5',
  amber: '#d97706',
  amberSoft: '#fffbeb',
  inputBg: '#fbfcfe',
  chipBg: '#eff6ff',
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  full: 999,
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const shadow = {
  card: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  hero: {
    shadowColor: '#1d4ed8',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
};

export function scoreTone(total: number): { color: string; soft: string; label: string } {
  if (total <= 40) return { color: palette.danger, soft: palette.dangerSoft, label: 'Başlangıç' };
  if (total <= 70) return { color: palette.amber, soft: palette.amberSoft, label: 'Gelişiyor' };
  return { color: palette.success, soft: palette.successSoft, label: 'Hazır' };
}

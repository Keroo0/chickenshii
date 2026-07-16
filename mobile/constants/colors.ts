export const colors = {
  // Brand dari logo
  primary: '#1159B1',
  primaryLight: '#3076CC',
  primarySoft: '#E6F0FA',

  // Secondary (Kuning)
  secondary: '#FBB03B',
  secondarySoft: '#FEF6E6',

  // Color psychology — Traffic Light
  healthy: '#5FBD38',
  healthySoft: '#EDF8E7',

  warning: '#FBB03B',
  warningSoft: '#FEF6E6',

  danger: '#ED1C24',
  dangerSoft: '#FCE7E8',

  // Neutral — warm brown for foreground
  bg: '#FFFFFF',
  card: '#FAFAFA',
  foreground: '#5c2c12',
  muted: '#6B7280',
  mutedSoft: '#F3F4F6',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
}

// Custom Brown
export const brown = {
  DEFAULT: '#5c2c12',
  soft: '#F4EAE1',
}

// Warna per kelas penyakit
export const diseaseColors: Record<string, { color: string; soft: string }> = {
  Healthy: { color: colors.healthy, soft: colors.healthySoft }, // Hijau
  Coccidiosis: { color: colors.warning, soft: colors.warningSoft }, // Oren
  Salmonellosis: { color: brown.DEFAULT, soft: brown.soft }, // Cokelat
  'New Castle Disease': { color: colors.danger, soft: colors.dangerSoft }, // Merah
}

// Bar chart colors
export const chartColors = [colors.primary, colors.healthy, colors.warning, colors.danger]

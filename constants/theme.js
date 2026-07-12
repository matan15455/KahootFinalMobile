// ===================================================================
// EduPlay — Mobile Design Tokens (React Native)
// תאום מלא לטוקנים של האתר (frontend/src/styles/eduplay-tokens.css)
// ===================================================================
import { useColorScheme } from 'react-native';

export const colors = {
  // Surfaces
  cream:    '#F5EFE4',
  cream2:   '#EEE6D5',
  paper:    '#FBF8F1',
  ink:      '#14121A',
  ink2:     '#2A2738',
  ink3:     '#57536A',
  inkMute:  '#8A8699',

  // Brand
  primary:     '#4F3FF5',
  primaryDeep: '#2C1FB8',
  primarySoft: '#E3DEFF',

  // 4 answer colors (א / ב / ג / ד)
  ans1: '#FF5C3C', ans1Ink: '#B23A1F', // coral
  ans2: '#4F3FF5', ans2Ink: '#2A1FB8', // violet
  ans3: '#B8E142', ans3Ink: '#6B8413', // lime
  ans4: '#2BC9D0', ans4Ink: '#137A82', // aqua
  ans5: '#9B59B6', ans5Ink: '#6C3483',
  ans6: '#E67E22', ans6Ink: '#A04000',
  ans7: '#1ABC9C', ans7Ink: '#0E6655',
  ans8: '#E74C3C', ans8Ink: '#922B21',
  
  // Semantic
  ok:   '#1E9E5F',
  warn: '#E59C00',
  bad:  '#D63A2D',

  // Translucent on dark
  whiteAlpha10: 'rgba(255,255,255,0.07)',
  whiteAlpha20: 'rgba(255,255,255,0.13)',
  whiteAlpha70: 'rgba(255,255,255,0.78)',

  // Translucent on light
  blackAlpha08: 'rgba(20,18,26,0.08)',
  blackAlpha16: 'rgba(20,18,26,0.16)',
};

export const darkColors = {
  cream:    '#14121A',
  cream2:   '#1E1B27',
  paper:    '#211D2B',
  ink:      '#F5EFE4',
  ink2:     '#EDE7F7',
  ink3:     '#B8B4C8',
  inkMute:  '#8A8699',

  // Brand — נשארים זהים, כדי לשמור על זהות המותג עקבית בשני המצבים
  primary:     '#4F3FF5',
  primaryDeep: '#8A7CFF',
  primarySoft: '#2A2450',

  ans1: '#FF5C3C', ans1Ink: '#B23A1F',
  ans2: '#4F3FF5', ans2Ink: '#2A1FB8',
  ans3: '#B8E142', ans3Ink: '#6B8413',
  ans4: '#2BC9D0', ans4Ink: '#137A82',
  ans5: '#9B59B6', ans5Ink: '#6C3483',
  ans6: '#E67E22', ans6Ink: '#A04000',
  ans7: '#1ABC9C', ans7Ink: '#0E6655',
  ans8: '#E74C3C', ans8Ink: '#922B21',

  ok:   '#2ECC81',
  warn: '#F5B942',
  bad:  '#FF6B5C',

  whiteAlpha10: 'rgba(255,255,255,0.07)',
  whiteAlpha20: 'rgba(255,255,255,0.13)',
  whiteAlpha70: 'rgba(255,255,255,0.78)',

  blackAlpha08: 'rgba(255,255,255,0.10)',
  blackAlpha16: 'rgba(255,255,255,0.18)',
};

// hook פשוט - מחזיר את פלטת הצבעים הנכונה לפי הגדרת המכשיר
export function useThemeColors() {
  const scheme = useColorScheme(); // 'light' | 'dark' | null
  return scheme === 'dark' ? darkColors : colors;
}

export const radii = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 9999,
};

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 36,
};

// כשהפונטים יותקנו (ראה SETUP.md) — אלו השמות.
// בינתיים React Native ימחזר ל-system font ועדיין יקבל את ה-weight.
export const fonts = {
  display: 'Rubik_800ExtraBold',   // לכותרות
  displayMed: 'Rubik_700Bold',
  body: 'Heebo_400Regular',
  bodyMed: 'Heebo_500Medium',
  bodyBold: 'Heebo_700Bold',
  num: 'SpaceGrotesk_700Bold',     // למספרים, PIN, סטטיסטיקות
};

// shadows — RN לא תומך ב-CSS shadow, כל פלטפורמה אחרת
export const shadows = {
  // הצללה רכה כללית
  soft: {
    shadowColor: '#14121A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  // לכפתורי lift (mock של "0 4px 0 0 #000")
  lift: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
};

export default { colors, radii, spacing, fonts, shadows };

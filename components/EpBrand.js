// ===================================================================
// EpBrand — לוגו / שם המותג / צורות (4 צבעי תשובה)
// תאום ל-frontend/src/components/_shared/EpBrand.jsx
// ===================================================================
import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../constants/theme';

export function EpLogo({ size = 32, color = colors.ans3 }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size * 0.28,
      backgroundColor: colors.ink,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{
        color, fontFamily: fonts.display,
        fontSize: size * 0.6, fontWeight: '900',
      }}>E</Text>
    </View>
  );
}

export function EpBrandMark({ small = false }) {
  const sz = small ? 26 : 32;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <EpLogo size={sz}/>
      <Text style={{
        fontFamily: fonts.display, fontWeight: '800',
        fontSize: small ? 18 : 22, color: colors.paper,
        letterSpacing: -0.3,
      }}>EduPlay</Text>
    </View>
  );
}

// ── 4 הצורות הגיאומטריות ──────────────────────────────────
// kind: 'burst' | 'hex' | 'plus' | 'wave'
export function EpShape({ kind, color = '#fff', size = 22 }) {
  const paths = {
    burst: 'M12 2L13.5 9.5L21 8L15.5 13L21 18L13.5 16.5L12 24L10.5 16.5L3 18L8.5 13L3 8L10.5 9.5L12 2Z',
    hex:   'M12 2L21 7V17L12 22L3 17V7L12 2Z',
    plus:  'M9 3H15V9H21V15H15V21H9V15H3V9H9V3Z',
    wave:  'M2 12C5 6 8 18 12 12C16 6 19 18 22 12V18C19 24 16 12 12 18C8 24 5 12 2 18V12Z',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={paths[kind]} fill={color}/>
    </Svg>
  );
}

// answer letter → color/shape/ink map
export const ANSWER_META = [
  { letter: 'א', color: colors.ans1, ink: colors.ans1Ink, inkColor: colors.ans1Ink, shape: 'burst', textOn: '#fff'     },
  { letter: 'ב', color: colors.ans2, ink: colors.ans2Ink, inkColor: colors.ans2Ink, shape: 'hex',   textOn: '#fff'     },
  { letter: 'ג', color: colors.ans3, ink: colors.ans3Ink, inkColor: colors.ans3Ink, shape: 'plus',  textOn: colors.ink },
  { letter: 'ד', color: colors.ans4, ink: colors.ans4Ink, inkColor: colors.ans4Ink, shape: 'wave',  textOn: '#0c2a2c' },
  { letter: 'ה', color: colors.ans5, ink: colors.ans5Ink, inkColor: colors.ans5Ink, shape: 'burst', textOn: '#fff'     },
  { letter: 'ו', color: colors.ans6, ink: colors.ans6Ink, inkColor: colors.ans6Ink, shape: 'hex',   textOn: '#fff'     },
  { letter: 'ז', color: colors.ans7, ink: colors.ans7Ink, inkColor: colors.ans7Ink, shape: 'plus',  textOn: '#fff'     },
  { letter: 'ח', color: colors.ans8, ink: colors.ans8Ink, inkColor: colors.ans8Ink, shape: 'wave',  textOn: '#fff'     },
];

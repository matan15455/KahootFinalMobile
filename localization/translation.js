import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import he from './languages/he.json';
import en from './languages/en.json';

const i18n = new I18n({ he, en });
i18n.locale = getLocales()[0].languageCode; // switc to 'en'
i18n.enableFallback = true;
i18n.defaultLocale = 'he';

export default i18n;
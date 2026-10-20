import { getEnkiWebsiteUrl } from '@/auth/utils/getEnkiWebsiteUrl';

describe('Enki information links', () => {
  it.each(['pt-BR', 'en', 'fr', 'pseudo-en'])(
    'resolves published guides for %s',
    (locale) => {
      expect(getEnkiWebsiteUrl(locale, 'privacy-policy')).toBe(
        'https://docs.enki.now/privacidade',
      );
      expect(getEnkiWebsiteUrl(locale, 'terms')).toBe(
        'https://docs.enki.now/sobre',
      );
    },
  );
});

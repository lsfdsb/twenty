type EnkiWebsitePage = 'terms' | 'privacy-policy';

export const getEnkiWebsiteUrl = (
  _locale: string,
  page: EnkiWebsitePage,
): string =>
  `https://docs.enki.now/${page === 'privacy-policy' ? 'privacidade' : 'sobre'}`;

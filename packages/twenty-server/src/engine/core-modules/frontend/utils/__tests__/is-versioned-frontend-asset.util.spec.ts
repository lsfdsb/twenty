import { isVersionedFrontendAsset } from 'src/engine/core-modules/frontend/utils/is-versioned-frontend-asset.util';

describe('isVersionedFrontendAsset', () => {
  it.each([
    'assets/index-CQA_77i-.js',
    'assets/index-yBWYenDi.css',
    'assets/inter-latin-400-normal-DXh0aaBC.woff2',
  ])('caches the content-versioned public asset %s', (asset) => {
    expect(isVersionedFrontendAsset(`/front/${asset}`, '/front')).toBe(true);
  });

  it.each([
    '/front/index.html',
    '/front/assets/index-abcdefgh.html',
    '/front/assets/index.js',
    '/front/brand/enki-logo.svg',
    '/front/manifest.json',
    '/front/metadata',
    '/private/assets/index-abcdefgh.js',
    '/front/assets/../../private/index-abcdefgh.js',
    '/front/assets/index-abcdefgh.js.map',
  ])('does not give immutable caching to %s', (filePath) => {
    expect(isVersionedFrontendAsset(filePath, '/front')).toBe(false);
  });
});

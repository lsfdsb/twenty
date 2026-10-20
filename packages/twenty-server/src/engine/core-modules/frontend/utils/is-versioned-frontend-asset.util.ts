import { relative, sep } from 'path';

export const isVersionedFrontendAsset = (
  filePath: string,
  frontendPath: string,
): boolean => {
  const assetPath = relative(frontendPath, filePath).split(sep).join('/');

  return /^assets\/[^/]+-[\w-]{8}\.(?:js|css|woff2?|ttf|otf|svg|png|jpe?g|webp|gif|avif)$/.test(
    assetPath,
  );
};

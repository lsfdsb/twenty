import {
  DOCUMENTATION_DEFAULT_PATH,
  type DocumentationPath,
} from 'twenty-shared/constants';

export const getDocumentationUrl = ({
  path = DOCUMENTATION_DEFAULT_PATH,
}: {
  locale?: string | null;
  path?: DocumentationPath | string;
}): string => `https://docs.enki.now${path}`;

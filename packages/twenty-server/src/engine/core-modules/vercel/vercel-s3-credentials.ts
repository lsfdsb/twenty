import { fromWebToken } from '@aws-sdk/credential-providers';

import { getVercelRequestToken } from 'src/engine/core-modules/vercel/vercel-request-context';

export const vercelS3Credentials = async () => {
  const roleArn = process.env.AWS_ROLE_ARN;

  if (!roleArn) {
    throw new Error('AWS_ROLE_ARN is required for Vercel storage');
  }

  return fromWebToken({
    roleArn,
    webIdentityToken: getVercelRequestToken(),
    roleSessionName: 'enki-twenty',
    clientConfig: { region: process.env.AWS_REGION },
  })();
};

function prepareEnvironment(input) {
  const env = { ...input };
  const requireValue = (key) => {
    if (!env[key]) throw new Error(`Missing configuration: ${key}`);
    return env[key];
  };
  for (const key of ['APP_SECRET', 'ENCRYPTION_KEY']) {
    if (requireValue(key).length < 32) throw new Error(`Invalid configuration: ${key}`);
  }
  let database;
  let redis;
  let server;
  try {
    database = new URL(env.PG_DATABASE_URL || env.DATABASE_URL_UNPOOLED);
    redis = new URL(env.REDIS_URL);
    server = new URL(env.SERVER_URL || `https://${env.VERCEL_URL || ''}`);
  } catch {
    throw new Error('Invalid database, Redis or server URL configuration');
  }
  if (!['postgres:', 'postgresql:'].includes(database.protocol)) throw new Error('PostgreSQL is required');
  if (redis.protocol !== 'rediss:') throw new Error('Redis TLS is required');
  if (server.protocol !== 'https:') throw new Error('HTTPS is required');
  database.searchParams.set('sslmode', 'verify-full');
  database.searchParams.delete('uselibpqcompat');
  env.PG_DATABASE_URL = database.toString();
  env.SERVER_URL = server.origin;
  env.NODE_ENV = 'production';
  env.NODE_PORT = env.PORT || '3000';
  env.PG_POOL_MAX_CONNECTIONS = env.PG_POOL_MAX_CONNECTIONS || '5';
  // Migrations and cron registration are explicit one-off release steps.
  env.DISABLE_DB_MIGRATIONS = 'true';
  env.DISABLE_CRON_JOBS_REGISTRATION = 'true';
  env.TELEMETRY_ENABLED = 'false';
  env.ANALYTICS_ENABLED = 'false';
  env.STORAGE_TYPE = 's3';
  env.STORAGE_S3_NAME = env.S3_BUCKET_NAME || env.STORAGE_S3_NAME;
  env.STORAGE_S3_REGION = env.AWS_REGION || env.STORAGE_S3_REGION;
  requireValue('STORAGE_S3_NAME');
  requireValue('STORAGE_S3_REGION');
  requireValue('AWS_ROLE_ARN');
  env.EMAIL_DRIVER = 'SMTP';
  env.EMAIL_SMTP_HOST = 'smtp.resend.com';
  env.EMAIL_SMTP_PORT = '465';
  env.EMAIL_SMTP_USER = 'resend';
  env.EMAIL_SMTP_PASSWORD = requireValue('RESEND_API_KEY');
  env.EMAIL_SMTP_NO_TLS = 'false';
  env.EMAIL_FROM_NAME = 'Enki';
  env.EMAIL_FROM_ADDRESS = requireValue('ENKI_TRANSACTIONAL_FROM');
  if (!/^[^@\s]+@mail\.enki\.now$/.test(env.EMAIL_FROM_ADDRESS)) {
    throw new Error('The verified Enki transactional sender is required');
  }
  if (env.VERCEL !== '1') throw new Error('This release requires Vercel request identity');
  if (requireValue('ENKI_QUEUE_CALLBACK_SECRET').length < 32) throw new Error('Invalid queue callback secret');
  env.MESSAGE_QUEUE_ON_DEMAND_ENABLED = 'true';
  for (const key of ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_SESSION_TOKEN',
    'STORAGE_S3_ACCESS_KEY_ID', 'STORAGE_S3_SECRET_ACCESS_KEY',
    'ENKI_BOOTSTRAP_EMAIL', 'ENKI_BOOTSTRAP_PASSWORD', 'VERCEL_OIDC_TOKEN',
    'AWS_WEB_IDENTITY_TOKEN_FILE', 'VERCEL_OIDC_TOKEN_FILE']) delete env[key];
  return env;
}

module.exports = { prepareEnvironment };

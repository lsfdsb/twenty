export const HEALTH_ERROR_MESSAGES = {
  ON_DEMAND_MAINTENANCE_STALE:
    'On-demand maintenance has not completed recently',
  NO_ACTIVE_WORKERS: 'No active workers found',
  ON_DEMAND_RECOVERY_STALE: 'On-demand queue recovery is not running',
  ON_DEMAND_QUEUE_UNHEALTHY:
    'On-demand queues have stalled work, failures or unavailable metrics',
  WORKER_TIMEOUT: 'Worker check timeout',
  DATABASE_TIMEOUT: 'Database timeout',
  REDIS_TIMEOUT: 'Redis timeout',
  DATABASE_CONNECTION_FAILED: 'Database connection failed',
  REDIS_CONNECTION_FAILED: 'Unknown Redis error',
  WORKER_CHECK_FAILED: 'Worker check failed',
  MESSAGE_SYNC_TIMEOUT: 'Message sync check timeout',
  MESSAGE_SYNC_CHECK_FAILED: 'Message sync check failed',
  MESSAGE_SYNC_HIGH_FAILURE_RATE: 'High failure rate in message sync jobs',
  CALENDAR_SYNC_TIMEOUT: 'Calendar sync check timeout',
  CALENDAR_SYNC_CHECK_FAILED: 'Calendar sync check failed',
  CALENDAR_SYNC_HIGH_FAILURE_RATE: 'High failure rate in calendar sync jobs',
  APP_HEALTH_CHECK_FAILED: 'App health check failed',
} as const;

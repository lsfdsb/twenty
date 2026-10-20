import { type DataSource } from 'typeorm';

// Be conservative: any connected account or scheduled automation keeps native
// minute-level scheduling, even when nobody has the application open.
export const requiresContinuousMaintenance = async (
  database: Pick<DataSource, 'query'>,
): Promise<boolean> => {
  const rows: { required: boolean }[] = await database.query(`
    SELECT (
      EXISTS (SELECT 1 FROM core."connectedAccount")
      OR EXISTS (SELECT 1 FROM core."pendingWakeUp")
      OR EXISTS (
        SELECT 1 FROM core."workflowVersion"
        WHERE status = 'ACTIVE' AND triggers @> '[{"type":"CRON"}]'::jsonb
      )
      OR EXISTS (
        SELECT 1 FROM core."logicFunction"
        WHERE "deletedAt" IS NULL AND "cronTriggerSettings" IS NOT NULL
      )
      OR EXISTS (
        SELECT 1 FROM core.agent
        WHERE "deletedAt" IS NULL
        AND jsonb_array_length(COALESCE(triggers, '[]'::jsonb)) > 0
      )
    ) AS required
  `);

  if (typeof rows[0]?.required !== 'boolean') {
    throw new Error('Could not determine maintenance requirements');
  }

  return rows[0].required;
};

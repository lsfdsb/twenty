import { MarketplaceCatalogSyncCronCommand } from 'src/engine/core-modules/application/application-marketplace/crons/commands/marketplace-catalog-sync.cron.command';
import { type MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

describe('marketplace registration during worker startup', () => {
  it.each([false, true])(
    'preserves the schedule without a cold-start enqueue loop (on demand: %s)',
    async (onDemand) => {
      const queue = {
        add: jest.fn().mockResolvedValue(undefined),
        addCron: jest.fn().mockResolvedValue(undefined),
      };
      const config = { get: jest.fn().mockReturnValue(onDemand) };
      const command = new MarketplaceCatalogSyncCronCommand(
        queue as unknown as MessageQueueService,
        config as unknown as TwentyConfigService,
      );

      await command.run();
      await command.run();

      expect(queue.addCron).toHaveBeenCalledTimes(2);
      expect(queue.add).toHaveBeenCalledTimes(onDemand ? 0 : 2);
    },
  );
});

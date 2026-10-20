import { Module } from '@nestjs/common';

import { MessagingImportManagerModule } from 'src/modules/messaging/message-import-manager/messaging-import-manager.module';
import { CalendarEventImportManagerModule } from 'src/modules/calendar/calendar-event-import-manager/calendar-event-import-manager.module';
import { WebhookSubscriptionModule } from 'src/modules/connected-account/webhook-subscription-manager/webhook-subscription.module';
import { EmailingModule } from 'src/modules/emailing/emailing.module';
import { AutomatedTriggerModule } from 'src/modules/workflow/workflow-trigger/automated-trigger/automated-trigger.module';
import { PendingWakeUpModule } from 'src/engine/core-modules/pending-wake-up/pending-wake-up.module';
import { FileModule } from 'src/engine/core-modules/file/file.module';
import { WorkspaceModule } from 'src/engine/core-modules/workspace/workspace.module';
import { WorkflowRunQueueModule } from 'src/modules/workflow/workflow-runner/workflow-run-queue/workflow-run-queue.module';
import { WorkspaceCleanerModule } from 'src/engine/workspace-manager/workspace-cleaner/workspace-cleaner.module';
import { WorkspaceMigrationRunnerModule } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/workspace-migration-runner.module';
import { TrashCleanupModule } from 'src/engine/trash-cleanup/trash-cleanup.module';
import { BillingReminderModule } from 'src/engine/core-modules/billing/reminders/billing-reminder.module';
import { ApplicationRecurringChargeModule } from 'src/engine/core-modules/billing/app-billing/application-recurring-charge.module';
import { PublicDomainModule } from 'src/engine/core-modules/public-domain/public-domain.module';
import { EventLogCleanupModule } from 'src/engine/core-modules/event-logs/cleanup/event-log-cleanup.module';
import { EnterpriseModule } from 'src/engine/core-modules/enterprise/enterprise.module';
import { TwentyConfigModule } from 'src/engine/core-modules/twenty-config/twenty-config.module';
import { MarketplaceModule } from 'src/engine/core-modules/application/application-marketplace/marketplace.module';
import { StaleRegistrationCleanupModule } from 'src/engine/core-modules/application/application-oauth/stale-registration-cleanup/stale-registration-cleanup.module';
import { AiAgentTriggerModule } from 'src/engine/metadata-modules/ai/ai-agent-trigger/ai-agent-trigger.module';
import { UserSessionModule } from 'src/engine/core-modules/user-session/user-session.module';
import { EmailingDomainModule } from 'src/engine/core-modules/emailing-domain/emailing-domain.module';
import { CronRegisterAllCommand } from 'src/database/commands/cron-register-all.command';
import { EnterpriseKeyValidationCronCommand } from 'src/engine/core-modules/enterprise/cron/command/organization-key-validation.cron.command';
import { RotateSigningKeysCronCommand } from 'src/engine/core-modules/jwt/crons/commands/rotate-signing-keys.cron.command';

@Module({
  imports: [
    MessagingImportManagerModule,
    CalendarEventImportManagerModule,
    WebhookSubscriptionModule,
    EmailingModule,
    AutomatedTriggerModule,
    PendingWakeUpModule,
    FileModule,
    WorkspaceModule,
    WorkflowRunQueueModule,
    WorkspaceCleanerModule,
    WorkspaceMigrationRunnerModule,
    TrashCleanupModule,
    BillingReminderModule,
    ApplicationRecurringChargeModule,
    PublicDomainModule,
    EventLogCleanupModule,
    EnterpriseModule,
    TwentyConfigModule,
    MarketplaceModule,
    StaleRegistrationCleanupModule,
    AiAgentTriggerModule,
    UserSessionModule,
    EmailingDomainModule,
  ],
  providers: [
    CronRegisterAllCommand,
    EnterpriseKeyValidationCronCommand,
    RotateSigningKeysCronCommand,
  ],
  exports: [CronRegisterAllCommand],
})
export class OnDemandScheduleModule {}

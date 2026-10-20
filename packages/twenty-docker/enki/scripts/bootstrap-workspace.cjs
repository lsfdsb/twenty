const { NestFactory } = require('@nestjs/core');
const { DataSource } = require('typeorm');
const { join } = require('node:path');

const fromServer = (path) => require(join(process.cwd(), 'dist', path));
const { CommandModule } = fromServer('command/command.module');
const { SignInUpService } = fromServer('engine/core-modules/auth/services/sign-in-up.service');
const { WorkspaceService } = fromServer('engine/core-modules/workspace/services/workspace.service');

async function main() {
  const email = process.env.ENKI_BOOTSTRAP_EMAIL;
  const password = process.env.ENKI_BOOTSTRAP_PASSWORD;
  if (!email || !password) throw new Error('Bootstrap credentials are required');

  const app = await NestFactory.createApplicationContext(CommandModule, { logger: ['error', 'warn'] });
  try {
    const database = app.get(DataSource);
    const [{ users, workspaces }] = await database.query(
      'SELECT (SELECT count(*)::int FROM core."user") AS users, (SELECT count(*)::int FROM core.workspace) AS workspaces',
    );
    if (users !== 0 || workspaces !== 0) throw new Error('Bootstrap requires an empty instance');

    const authentication = app.get(SignInUpService);
    const newUserWithPicture = await authentication.computePartialUserFromUserPayload(
      { email, firstName: 'Lucas', lastName: 'Bueno', locale: 'pt-BR' },
      { provider: 'password', password },
    );
    const { user, workspace } = await authentication.signUpOnNewWorkspace(
      { type: 'newUserWithPicture', newUserWithPicture },
      { displayName: 'Enki', subdomain: 'enki' },
    );
    await app.get(WorkspaceService).activateWorkspace(user, workspace);
    console.log(JSON.stringify({ workspaceId: workspace.id, userId: user.id, activated: true }));
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error.name, error.message);
  process.exitCode = 1;
});

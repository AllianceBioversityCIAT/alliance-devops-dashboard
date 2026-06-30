import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const rootPackage = JSON.parse(readFileSync('package.json', 'utf8'));
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));

const LAMBDA_DEPENDENCIES = [
  '@aws-sdk/client-dynamodb',
  '@aws-sdk/lib-dynamodb',
];

function resolveLockedVersion(packageName) {
  const entry = lock.packages?.[`node_modules/${packageName}`];
  if (entry?.version) {
    return entry.version;
  }

  throw new Error(
    `Could not resolve locked version for ${packageName}. Run npm install and commit package-lock.json.`,
  );
}

const lambdaPackage = {
  name: 'alliance-devops-dashboard-lambdas',
  version: rootPackage.version,
  private: true,
  engines: rootPackage.engines,
  dependencies: Object.fromEntries(
    LAMBDA_DEPENDENCIES.map((name) => [name, resolveLockedVersion(name)]),
  ),
};

writeFileSync(join('dist', 'package.json'), `${JSON.stringify(lambdaPackage, null, 2)}\n`);

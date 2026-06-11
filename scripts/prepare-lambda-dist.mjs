import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const rootPackage = JSON.parse(readFileSync('package.json', 'utf8'));

const lambdaPackage = {
  name: 'alliance-devops-dashboard-lambdas',
  version: rootPackage.version,
  private: true,
  engines: rootPackage.engines,
  dependencies: {
    '@aws-sdk/client-dynamodb': rootPackage.dependencies['@aws-sdk/client-dynamodb'],
    '@aws-sdk/lib-dynamodb': rootPackage.dependencies['@aws-sdk/lib-dynamodb'],
  },
};

writeFileSync(join('dist', 'package.json'), `${JSON.stringify(lambdaPackage, null, 2)}\n`);

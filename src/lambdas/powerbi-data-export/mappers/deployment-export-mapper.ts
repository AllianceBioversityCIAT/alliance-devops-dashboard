export interface DeploymentExportRecord {
  id: string;
  buildDate: string;
  buildNumber: string;
  job: string;
  result: string;
  stage: string;
  commitUser: string;
  commitHash: string;
  commitMessage: string;
  exception: string;
  url: string;
}

function asString(value: unknown, fallback = ''): string {
  if (value === undefined || value === null) {
    return fallback;
  }
  return String(value);
}

export function mapDeploymentExportItem(item: Record<string, unknown>): DeploymentExportRecord {
  return {
    id: asString(item.id),
    buildDate: asString(item.buildDate),
    buildNumber: asString(item.buildNumber),
    job: asString(item.job),
    result: asString(item.result),
    stage: asString(item.stage),
    commitUser: asString(item.commitUser),
    commitHash: asString(item.commitHash),
    commitMessage: asString(item.commitMessage),
    exception: asString(item.exception),
    url: asString(item.url),
  };
}

export function mapDeploymentExportItems(
  items: Record<string, unknown>[],
): DeploymentExportRecord[] {
  return items.map(mapDeploymentExportItem);
}

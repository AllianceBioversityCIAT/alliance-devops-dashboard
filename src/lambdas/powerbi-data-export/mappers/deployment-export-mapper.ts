export interface DeploymentJobMetadata {
  applicationName: string;
  environment: string;
  projectName: string;
}

export interface DeploymentExportRecord {
  id: string;
  buildDate: string;
  buildNumber: string;
  job: string;
  applicationName: string;
  environment: string;
  projectName: string;
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

export function mapDeploymentExportItem(
  item: Record<string, unknown>,
  metadataByJob?: ReadonlyMap<string, DeploymentJobMetadata>,
): DeploymentExportRecord {
  const job = asString(item.job);
  const metadata = metadataByJob?.get(job);

  return {
    id: asString(item.id),
    buildDate: asString(item.buildDate),
    buildNumber: asString(item.buildNumber),
    job,
    applicationName: metadata?.applicationName ?? '',
    environment: metadata?.environment ?? '',
    projectName: metadata?.projectName ?? '',
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
  metadataByJob?: ReadonlyMap<string, DeploymentJobMetadata>,
): DeploymentExportRecord[] {
  return items.map((item) => mapDeploymentExportItem(item, metadataByJob));
}

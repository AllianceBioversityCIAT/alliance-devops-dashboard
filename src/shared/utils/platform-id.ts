export function slugifyPlatformId(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function derivePlatformId(checkToken: string, alias?: string | null): string {
  if (alias && alias.trim().length > 0) {
    const slug = slugifyPlatformId(alias);
    if (slug.length > 0) {
      return slug;
    }
  }

  return slugifyPlatformId(checkToken) || checkToken.toLowerCase();
}

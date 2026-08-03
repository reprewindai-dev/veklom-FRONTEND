export function hasBearerAuthorization(value: string | null): boolean {
  return Boolean(value && /^Bearer\s+\S+$/i.test(value.trim()));
}

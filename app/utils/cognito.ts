export function verifyAccessToken(): string | null {
  const clientId = process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID;
  if (!clientId) return null;

  const cookieName = `CognitoIdentityServiceProvider.${clientId}.idToken`;
  const cookie = document.cookie
    .split("; ")
    .find((c) => c.startsWith(cookieName + "="));

  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
}

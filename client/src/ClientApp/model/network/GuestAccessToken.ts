/** Ответ сервера на выдачу гостевого токена. */
export interface GuestAccessToken
{
    accessToken: string;
    tokenType: string;
    expiresAt: string;
}

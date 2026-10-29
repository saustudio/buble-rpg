import { GuestAccessToken } from "../model/network/GuestAccessToken";

export class GuestAuthService
{
    constructor(private readonly baseUrl: string)
    {
    }

    public async AuthenticateAsync(token: string | null): Promise<string>
    {
        const sessionResponse = await fetch(new URL("api/guest-sessions", this.baseUrl.endsWith("/") ? this.baseUrl : `${this.baseUrl}/`), {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });

        if (!sessionResponse.ok) throw new Error(`Guest session request failed: ${sessionResponse.status}`);

        const session = await sessionResponse.json() as GuestAccessToken;
        return session.accessToken;
    }
}

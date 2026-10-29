using System.Security.Cryptography;
using System.Text;

using BubleRpg.Network.Model;

namespace BubleRpg.Network.Services;

public sealed class GuestSessionService(GuestSessionRepository sessions)
{
    private static readonly TimeSpan SessionLifetime = TimeSpan.FromHours(24);

    public GuestAccessToken Create()
    {
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
        var expiresAt = DateTimeOffset.UtcNow.Add(SessionLifetime);
        var session = new GuestSession(Guid.NewGuid().ToString("N"), expiresAt);

        sessions.Add(HashToken(token), session);

        return new GuestAccessToken(token, "Bearer", expiresAt);
    }

    public GuestSession? FindByToken(string token)
    {
        var session = sessions.Find(HashToken(token));
        return session is not null && session.ExpiresAt > DateTimeOffset.UtcNow ? session : null;
    }

    public int RemoveExpired()
    {
        return sessions.RemoveExpired(DateTimeOffset.UtcNow).Count;
    }

    private static string HashToken(string token)
    {
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
    }
}

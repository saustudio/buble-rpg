using System.Collections.Concurrent;

using BubleRpg.Network.Model;

namespace BubleRpg.Network.Services;

public sealed class GuestSessionRepository
{
    private readonly ConcurrentDictionary<string, GuestSession> sessions = new();

    public void Add(string tokenHash, GuestSession session)
    {
        sessions[tokenHash] = session;
    }

    public GuestSession? Find(string tokenHash)
    {
        return sessions.TryGetValue(tokenHash, out var session) ? session : null;
    }

    public List<GuestSession> RemoveExpired(DateTimeOffset now)
    {
        var expired = new List<GuestSession>();

        foreach (var (tokenHash, session) in sessions)
        {
            if (session.ExpiresAt > now) continue;
            if (sessions.TryRemove(tokenHash, out var removed))
                expired.Add(removed);
        }

        return expired;
    }
}

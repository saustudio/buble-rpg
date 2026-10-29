namespace BubleRpg.Network.Model;

public sealed record GuestSession(string GuestId, DateTimeOffset ExpiresAt);

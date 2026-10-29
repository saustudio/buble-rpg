namespace BubleRpg.Network.Model;

public sealed record GuestAccessToken(string AccessToken, string TokenType, DateTimeOffset ExpiresAt);

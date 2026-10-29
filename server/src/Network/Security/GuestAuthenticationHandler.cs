using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

using BubleRpg.Network.Services;

namespace BubleRpg.Network.Security;

public sealed class GuestAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    GuestSessionService sessions)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "GuestBearer";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var authorization = Request.Headers.Authorization.ToString();
        string? token = null;

        if (authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            token = authorization["Bearer ".Length..].Trim();
        else if (Request.Path.StartsWithSegments("/game"))
            token = Request.Query["access_token"].FirstOrDefault();

        if (string.IsNullOrWhiteSpace(token))
            return Task.FromResult(AuthenticateResult.NoResult());

        var session = sessions.FindByToken(token);
        if (session == null)
            return Task.FromResult(AuthenticateResult.Fail("Invalid or expired guest session."));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, session.GuestId)
        };
        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}

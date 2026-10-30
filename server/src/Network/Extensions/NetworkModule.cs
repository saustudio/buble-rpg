using BubleRpg.Network.Hubs;
using BubleRpg.Network.Model;
using BubleRpg.Network.Security;
using BubleRpg.Network.Services;
using BubleRpg.Server.Application.Services;
using BubleRpg.Server.Network.Services;

using Microsoft.AspNetCore.Authentication;

namespace BubleRpg.Server.Network.Extensions;

public static class NetworkModule
{
    public static IServiceCollection AddGameNetwork(this IServiceCollection services)
    {
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = GuestAuthenticationHandler.SchemeName;
            options.DefaultChallengeScheme = GuestAuthenticationHandler.SchemeName;
        }).AddScheme<AuthenticationSchemeOptions, GuestAuthenticationHandler>(GuestAuthenticationHandler.SchemeName, _ => { });

        services.AddAuthorization();
        services.AddSignalR().AddJsonProtocol(options =>
        {
            // Payload хаба идёт в PascalCase — имена полей 1:1 совпадают с DTO и клиентской моделью.
            options.PayloadSerializerOptions.PropertyNamingPolicy = null;
        });

        services.AddSingleton<GuestSessionRepository>();
        services.AddSingleton<GuestSessionService>();
        services.AddHostedService<GuestSessionCleanupService>();
        services.AddSingleton<GameClientService>();

        services.AddSingleton<NetworkContext>();
        services.AddSingleton<GameStateMapper>();
        services.AddSingleton<NetworkService>();
        services.AddSingleton<ITickHandler, NetworkTickHandler>();

        return services;
    }

    public static WebApplication MapGameNetwork(this WebApplication app)
    {
        app.MapPost("/api/guest-sessions", (
            HttpContext context,
            GuestSessionService sessions) =>
        {
            var authorization = context.Request.Headers.Authorization.ToString();

            if (authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                var token = authorization["Bearer ".Length..].Trim();
                var existingSession = sessions.FindByToken(token);

                if (existingSession is not null)
                    return Results.Ok(new GuestAccessToken(token, "Bearer", existingSession.ExpiresAt));
            }

            return Results.Ok(sessions.Create());
        });

        app.MapHub<GameHub>("/game");
        return app;
    }
}

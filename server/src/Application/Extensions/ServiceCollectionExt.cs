using BubleRpg.Server.Application.Services;
using BubleRpg.Server.Game.Extensions;
using BubleRpg.Server.Network.Extensions;

namespace BubleRpg.Server.Application.Extensions;

public static class ServiceCollectionExt
{
    public static IServiceCollection AddGameServer(this IServiceCollection services)
    {
        services.AddGame();
        services.AddGameNetwork();
        services.AddHostedService<ApplicationLoop>();

        return services;
    }
}

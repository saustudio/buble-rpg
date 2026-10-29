using BubleRpg.Server.Application.Services;
using BubleRpg.Server.Game.Extensions;
using BubleRpg.Server.Game.Services;
using BubleRpg.Server.Network.Extensions;
using BubleRpg.Server.Network.Services;

namespace BubleRpg.Server.Application.Extensions;

public static class ServiceCollectionExt
{
    public static IServiceCollection AddGameServer(this IServiceCollection services)
    {
        services.AddGame();
        services.AddGameNetwork();

        services.AddSingleton<IApplicationService>(provider => provider.GetRequiredService<NetworkInputService>());
        services.AddSingleton<IApplicationService>(provider => provider.GetRequiredService<GameService>());
        services.AddSingleton<IApplicationService>(provider => provider.GetRequiredService<NetworkOutputService>());

        services.AddHostedService<ApplicationLoopService>();

        return services;
    }
}

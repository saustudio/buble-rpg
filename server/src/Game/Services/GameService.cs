using BubleRpg.Server.Application.Services;
using BubleRpg.Server.Game.Systems;

namespace BubleRpg.Server.Game.Services;

public sealed class GameService(IEnumerable<IGameSystem> systems) : IApplicationService
{
    private readonly IGameSystem[] ordered = systems.ToArray();

    public void Run(double deltaSeconds)
    {
        foreach (var system in ordered) system.Update(deltaSeconds);
    }
}

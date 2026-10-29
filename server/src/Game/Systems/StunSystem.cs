using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Game.Systems;

public sealed class StunSystem(
    GameDbContext store,
    StunService stunService) : IGameSystem
{
    public void Update(double deltaTime)
    {
        foreach (var gameId in store.GameIds())
        {
            var gs = store.Single<GameState>(gameId);
            if (gs == null || gs.State == EGameState.PAUSE || gs.State == EGameState.OVER) continue;
            stunService.Tick(deltaTime);
        }
    }
}

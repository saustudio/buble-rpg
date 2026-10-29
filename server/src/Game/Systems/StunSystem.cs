using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Game.Systems;

public sealed class StunSystem(GameStateService gameStateService, StunService stunService) : IGameSystem
{
    public void Update(double deltaTime)
    {
        var gs = gameStateService.Current;
        if (gs == null || gs.State == EGameState.PAUSE || gs.State == EGameState.OVER) return;
        stunService.Tick(deltaTime);
    }
}

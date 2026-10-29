using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Game.Systems;

public sealed class GameStateSystem : IGameSystem
{
    private readonly GameStateService gameStateService;

    public GameStateSystem(GameStateService gameStateService)
    {
        this.gameStateService = gameStateService;
        gameStateService.Create();
    }

    public void Update(double deltaTime)
    {
        var gs = gameStateService.Current;
        if (gs.State == EGameState.INIT) gameStateService.Play(gs);
    }
}

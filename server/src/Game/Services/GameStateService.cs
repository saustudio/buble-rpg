using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Application.Services;

namespace BubleRpg.Server.Game.Services;

public sealed class GameStateService(GameDataService store)
{
    public GameState Current => store.Single<GameState>();

    public GameState Create()
    {
        var model = new GameState();
        store.EntitySet(store.EntityCreate(), model);
        return model;
    }

    public void Pause(GameState gs, string source)
    {
        gs.PauseSources.Add(source);
        Recompute(gs);
    }

    public void Resume(GameState gs, string source)
    {
        gs.PauseSources.Remove(source);
        Recompute(gs);
    }

    public void Play(GameState gs)
    {
        gs.State = EGameState.PLAY;
    }

    private void Recompute(GameState gs)
    {
        if (gs.State == EGameState.OVER) return;
        if (gs.State == EGameState.INIT) return;
        gs.State = gs.PauseSources.Count > 0 ? EGameState.PAUSE : EGameState.PLAY;
    }
}

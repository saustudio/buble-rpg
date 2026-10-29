using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Game.Systems;

/// <summary>
/// Считает время пребывания героя духом. Пока компонент <see cref="Ghost"/> висит на сущности,
/// она неуязвима и вне боя; по истечении таймера компонент снимается, возвращая обычные правила.
/// </summary>
public sealed class GhostSystem(
    GameDbContext store) : IGameSystem
{
    public void Update(double deltaTime)
    {
        foreach (var gameId in store.GameIds())
        {
            var gs = store.Single<GameState>(gameId);
            if (gs == null || gs.State == EGameState.PAUSE || gs.State == EGameState.OVER) continue;

            foreach (var entityId in store.Query<Ghost>(gameId))
            {
                var ghost = store.EntityGet<Ghost>(entityId);
                ghost.Remaining -= deltaTime;

                if (ghost.Remaining <= 0) store.EntityRemoveSet<Ghost>(entityId);
            }
        }
    }
}

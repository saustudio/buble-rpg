using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Game.Systems;

public sealed class TargetSystem(
    GameDataService store,
    GameStateService gameStateService) : IGameSystem
{
    public void Update(double deltaTime)
    {
        var gs = gameStateService.Current;
        if (gs == null || gs.State == EGameState.PAUSE || gs.State == EGameState.OVER) return;

        foreach (var entity in store.Query<MoveTarget, Velocity, Transform2D, Rigidbody>())
        {
            var target = store.EntityGet<MoveTarget>(entity);
            var body = store.EntityGet<Rigidbody>(entity);
            var pos = store.EntityGet<Transform2D>(entity);
            var vel = store.EntityGet<Velocity>(entity);

            var dx = target.X - pos.X;
            var dy = target.Y - pos.Y;
            var dist = Math.Sqrt(dx * dx + dy * dy);

            if (dist > body.Size + 20)
            {
                vel.DirX = dx / dist;
                vel.DirY = dy / dist;
            }
        }
    }
}

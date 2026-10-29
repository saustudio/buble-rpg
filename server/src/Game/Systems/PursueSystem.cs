using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Game.Systems;

public sealed class PursueSystem(
    GameDbContext store,
    EntityAttributesService attrService) : IGameSystem
{
    public void Update(double deltaTime)
    {
        foreach (var gameId in store.GameIds())
        {
            var gs = store.Single<GameState>(gameId);
            if (gs == null || gs.State == EGameState.PAUSE || gs.State == EGameState.OVER) continue;

            var preyList = store.Query<Prey, Transform2D, Rigidbody>(gameId)
                .Where(entity =>
                {
                    // За духом не гонятся.
                    if (store.EntityHas<Ghost>(entity)) return false;

                    var health = store.EntityGet<Health>(entity);
                    return health == null || double.IsNaN(health.LifeCurrent) || health.LifeCurrent > 0;
                })
                .ToList();
            if (preyList.Count == 0) continue;

            var pursuers = store.Query<Pursuer, Transform2D, Velocity, Rigidbody, EntityAttributes>(gameId);

            foreach (var pursuer in pursuers)
            {
                // Мёртвые не преследуют (удаляются в конце тика, но не должны двигаться и целиться).
                var pursuerHealth = store.EntityGet<Health>(pursuer);
                if (pursuerHealth != null && !double.IsNaN(pursuerHealth.LifeCurrent) && pursuerHealth.LifeCurrent <= 0) continue;

                var pursuerPos = store.EntityGet<Transform2D>(pursuer);
                var pursuerBody = store.EntityGet<Rigidbody>(pursuer);
                var pursuerVel = store.EntityGet<Velocity>(pursuer);
                var pursuerStats = attrService.Attributes(pursuer);

                var nearest = FindNearestPrey(pursuerPos, preyList);
                if (nearest == null) continue;

                var preyPos = store.EntityGet<Transform2D>(nearest.Value);
                var preyBody = store.EntityGet<Rigidbody>(nearest.Value);

                var dx = preyPos.X - pursuerPos.X;
                var dy = preyPos.Y - pursuerPos.Y;
                var dist = Math.Sqrt(dx * dx + dy * dy);

                var stopDistance = pursuerBody.Size + preyBody.Size + pursuerStats.AttackRange;

                if (dist < stopDistance)
                {
                    pursuerVel.DirX = 0;
                    pursuerVel.DirY = 0;
                    continue;
                }

                pursuerVel.DirX = dx / dist;
                pursuerVel.DirY = dy / dist;
            }
        }
    }

    private int? FindNearestPrey(Transform2D pursuerPos, List<int> preyList)
    {
        int? nearest = null;
        var nearestDist = double.PositiveInfinity;

        foreach (var prey in preyList)
        {
            var preyPos = store.EntityGet<Transform2D>(prey);
            var dx = preyPos.X - pursuerPos.X;
            var dy = preyPos.Y - pursuerPos.Y;
            var dist = Math.Sqrt(dx * dx + dy * dy);

            if (dist < nearestDist)
            {
                nearestDist = dist;
                nearest = prey;
            }
        }

        return nearest;
    }
}

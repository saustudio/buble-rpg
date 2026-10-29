using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Game.Systems;

public sealed class PursueSystem(
    GameDataService store,
    EntityAttributesService attrService) : IGameSystem
{
    public void Update(double deltaTime)
    {
        var preyList = store.Query<Prey, Transform2D, Rigidbody>()
            .Where(entity =>
            {
                var health = store.EntityGet<Health>(entity);
                return health == null || double.IsNaN(health.LifeCurrent) || health.LifeCurrent > 0;
            })
            .ToList();
        if (preyList.Count == 0) return;

        var pursuers = store.Query<Pursuer, Transform2D, Velocity, Rigidbody, EntityAttributes>();

        foreach (var pursuer in pursuers)
        {
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

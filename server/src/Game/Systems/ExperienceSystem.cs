using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Game.Systems;

public sealed class ExperienceSystem(
    GameDbContext store,
    EntityAttributesService attrService) : IGameSystem
{
    public void Update(double deltaTime)
    {
        foreach (var gameId in store.GameIds())
        {
            var gs = store.Single<GameState>(gameId);
            if (gs == null || gs.State == EGameState.PAUSE || gs.State == EGameState.OVER) continue;

            foreach (var lvlEntity in store.Query<Experience>(gameId))
            {
                var exp = store.EntityGet<Experience>(lvlEntity);
                if (exp.Value >= exp.Next) exp.Next = Math.Floor(exp.Next * 2);
            }

            foreach (var entity in store.Query<AttackHit>(gameId))
            {
                var damage = store.EntityGet<AttackHit>(entity);
                var targetHealth = store.EntityGet<Health>(damage.Target);
                var targetAttributes = attrService.Attributes(damage.Target);
                if (targetHealth == null || targetAttributes == null) continue;
                if (targetHealth.LifeCurrent > 0) continue;

                var exp = store.EntityGet<Experience>(damage.Source);
                if (exp == null) continue;

                exp.Value += Math.Floor(targetAttributes.LifeMax);
                if (exp.Value >= exp.Next) exp.Lvl++;
            }
        }
    }
}

using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Game.Systems;

public sealed class ExperienceSystem(
    GameDataService store,
    EntityAttributesService attrService,
    GameStateService gameStateService) : IGameSystem
{
    public void Update(double deltaTime)
    {
        var gs = gameStateService.Current;
        if (gs == null || gs.State == EGameState.PAUSE || gs.State == EGameState.OVER) return;

        foreach (var lvlEntity in store.Query<Experience>())
        {
            var exp = store.EntityGet<Experience>(lvlEntity);
            if (exp.Value >= exp.Next) exp.Next = Math.Floor(exp.Next * 2);
        }

        foreach (var entity in store.Query<AttackHit>())
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

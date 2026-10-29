using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;
using BubleRpg.Server.Application.Services;

namespace BubleRpg.Server.Game.Systems;

public sealed class HealthSystem(
    GameDataService store,
    EntityAttributesService attrService,
    GameStateService gameStateService) : IGameSystem
{
    public void Update(double deltaTime)
    {
        var gs = gameStateService.Current;
        if (gs == null || gs.State == EGameState.PAUSE || gs.State == EGameState.OVER) return;

        var kills = CollectKills();

        foreach (var entity in store.Query<Health, EntityAttributes>())
        {
            var entityAttributes = attrService.Attributes(entity);
            var health = store.EntityGet<Health>(entity);

            if (double.IsNaN(health.LifeCurrent)) health.LifeCurrent = entityAttributes.LifeMax;
            if (double.IsNaN(health.EsCurrent)) health.EsCurrent = entityAttributes.ES;
            if (double.IsNaN(health.EsCurrentPrev)) health.EsCurrentPrev = health.EsCurrent;

            if (health.LifeCurrent <= 0) continue;

            if (health.EsCurrent < health.EsCurrentPrev)
            {
                health.EsRegenDelay = entityAttributes.ESRegenDelay;
                health.EsCurrentPrev = health.EsCurrent;
            }

            if (health.EsRegenDelay > 0) health.EsRegenDelay -= deltaTime;
            if (health.EsRegenDelay <= 0 && health.EsCurrent < entityAttributes.ES)
            {
                health.EsCurrent += entityAttributes.ES * entityAttributes.ESRegenRate / 100 * deltaTime;
                health.EsCurrentPrev = health.EsCurrent;
            }

            health.LifeCurrent += entityAttributes.LifePerSecond * deltaTime;

            if (kills.TryGetValue(entity, out var killCount))
                health.LifeCurrent += entityAttributes.LifePerKill * killCount;

            var exp = store.EntityGet<Experience>(entity);
            if (exp != null && exp.Value > exp.Next)
            {
                health.LifeCurrent = entityAttributes.LifeMax;
                health.EsCurrent = entityAttributes.ES;
            }

            health.LifeCurrent = Math.Min(health.LifeCurrent, entityAttributes.LifeMax);
            health.EsCurrent = Math.Min(health.EsCurrent, entityAttributes.ES);
        }
    }

    /// <summary>Убийства за текущий тик: кому и сколько раз начислить LifePerKill.</summary>
    private Dictionary<int, int> CollectKills()
    {
        var kills = new Dictionary<int, int>();

        foreach (var hitEntity in store.Query<AttackHit>())
        {
            var damage = store.EntityGet<AttackHit>(hitEntity);
            var targetHealth = store.EntityGet<Health>(damage.Target);
            if (targetHealth == null || targetHealth.LifeCurrent > 0) continue;

            kills[damage.Source] = kills.GetValueOrDefault(damage.Source) + 1;
        }

        return kills;
    }
}

using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Game.Systems;

public sealed class DamageSystem(
    GameDataService store,
    GameStateService gameStateService) : IGameSystem
{
    public void Update(double deltaTime)
    {
        var gs = gameStateService.Current;
        if (gs == null || gs.State == EGameState.PAUSE || gs.State == EGameState.OVER) return;

        foreach (var entity in store.Query<AttackHit>())
        {
            var damage = store.EntityGet<AttackHit>(entity);
            var health = store.EntityGet<Health>(damage.Target);
            if (health == null) continue;

            var amount = damage.Phys + damage.Fire + damage.Cold + damage.Light;

            if (double.IsNaN(health.EsCurrent)) health.EsCurrent = 0;
            if (double.IsNaN(health.LifeCurrent)) health.LifeCurrent = 0;

            var esAbsorb = Math.Min(health.EsCurrent, amount);
            health.EsCurrent -= esAbsorb;
            amount -= esAbsorb;

            health.LifeCurrent -= amount;

            health.EsCurrent = Math.Max(0, health.EsCurrent);
            health.LifeCurrent = Math.Max(0, health.LifeCurrent);
        }
    }
}

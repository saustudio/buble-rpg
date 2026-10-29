using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Game.Systems;

public sealed class DamageSystem(
    GameDbContext store) : IGameSystem
{
    public void Update(double deltaTime)
    {
        foreach (var gameId in store.GameIds())
        {
            var gs = store.Single<GameState>(gameId);
            if (gs == null || gs.State == EGameState.PAUSE || gs.State == EGameState.OVER) continue;

            foreach (var entity in store.Query<AttackHit>(gameId))
            {
                var damage = store.EntityGet<AttackHit>(entity);
                var health = store.EntityGet<Health>(damage.Target);
                if (health == null) continue;

                // Дух не получает урон.
                if (store.EntityHas<Ghost>(damage.Target)) continue;

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
}

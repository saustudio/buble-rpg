using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Game.Systems;

/// <summary>
/// Держит цель, которую недавно атаковал каждый герой. Целью может быть
/// как монстр, так и другой герой, поэтому система зовётся Enemy, а не Monster.
/// </summary>
public sealed class EnemyHudSystem(GameDataService store, GameStateService gameStateService) : IGameSystem
{
    private const double HoldSeconds = 2;

    public void Update(double deltaTime)
    {
        var gs = gameStateService.Current;

        if (gs == null || gs.State == EGameState.INIT || gs.State == EGameState.OVER)
        {
            ClearTargets();
            return;
        }

        if (gs.State == EGameState.PAUSE) return;

        foreach (var (heroId, _) in store.FindComponents<Hero>())
        {
            var hud = store.EntityGet<EnemyHudTarget>(heroId);
            if (hud != null)
            {
                hud.Remaining -= deltaTime;
                if (hud.Remaining <= 0) store.EntityRemoveSet<EnemyHudTarget>(heroId);
            }

            var target = FindHitTarget(heroId);
            if (target == null) continue;

            var current = store.EntityGet<EnemyHudTarget>(heroId);
            if (current == null)
            {
                store.EntitySet(heroId, new EnemyHudTarget { TargetId = target.Value, Remaining = HoldSeconds });
            }
            else
            {
                current.TargetId = target.Value;
                current.Remaining = HoldSeconds;
            }
        }
    }

    private void ClearTargets()
    {
        foreach (var entity in store.Query<EnemyHudTarget>())
            store.EntityRemoveSet<EnemyHudTarget>(entity);
    }

    private int? FindHitTarget(int heroId)
    {
        foreach (var hitEntity in store.Query<AttackHit>())
        {
            var hit = store.EntityGet<AttackHit>(hitEntity);
            if (hit.Source != heroId) continue;
            if (hit.Target == heroId) continue;

            var health = store.EntityGet<Health>(hit.Target);
            if (health == null || double.IsNaN(health.LifeCurrent) || health.LifeCurrent <= 0) continue;

            return hit.Target;
        }

        return null;
    }
}

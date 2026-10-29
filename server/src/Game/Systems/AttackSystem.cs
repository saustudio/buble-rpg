using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Game.Systems;

public sealed class AttackSystem(
    GameDbContext store,
    EntityAttributesService attrService) : IGameSystem
{
    public void Update(double deltaTime)
    {
        foreach (var gameId in store.GameIds())
        {
            var gs = store.Single<GameState>(gameId);
            if (gs == null || gs.State == EGameState.PAUSE || gs.State == EGameState.OVER) continue;

            foreach (var hit in store.Query<AttackHit>(gameId)) store.EntityRemove(hit);

            foreach (var source in store.Query<Transform2D, Rigidbody, EntityAttributes, Fraction>(gameId))
            {
                if (store.EntityHas<Stun>(source)) continue;

                // Дух не атакует.
                if (store.EntityHas<Ghost>(source)) continue;

                // Мёртвые не атакуют: герои остаются в мире до респавна и невидимы для других.
                var sourceHealth = store.EntityGet<Health>(source);
                if (sourceHealth != null && !double.IsNaN(sourceHealth.LifeCurrent) && sourceHealth.LifeCurrent <= 0) continue;

                var cooldown = store.EntityGet<AttackCooldown>(source);
                if (cooldown != null)
                {
                    if (cooldown.Value > 0)
                    {
                        cooldown.Value -= deltaTime;
                        continue;
                    }

                    store.EntityRemoveSet<AttackCooldown>(source);
                }

                var sourcePos = store.EntityGet<Transform2D>(source);
                var sourceBody = store.EntityGet<Rigidbody>(source);
                var sourceFraction = store.EntityGet<Fraction>(source);
                var sourceAttributes = attrService.Attributes(source);

                var target = FindTarget(gameId, source, sourcePos, sourceBody, sourceFraction, sourceAttributes);
                if (target == null) continue;

                var cooldownValue = sourceAttributes.AttackSpeed > 0 ? 1 / sourceAttributes.AttackSpeed : 0;
                store.EntitySet(source, new AttackCooldown(cooldownValue));

                var hit = new AttackHit(source, target.Value)
                {
                    Phys = Math.Floor(sourceAttributes.PhysicalDamageMin + Random.Shared.NextDouble() * (sourceAttributes.PhysicalDamageMax - sourceAttributes.PhysicalDamageMin + 1)),
                    Fire = Math.Floor(sourceAttributes.FireDamageMin + Random.Shared.NextDouble() * (sourceAttributes.FireDamageMax - sourceAttributes.FireDamageMin + 1)),
                    Cold = Math.Floor(sourceAttributes.ColdDamageMin + Random.Shared.NextDouble() * (sourceAttributes.ColdDamageMax - sourceAttributes.ColdDamageMin + 1)),
                    Light = Math.Floor(sourceAttributes.LightDamageMin + Random.Shared.NextDouble() * (sourceAttributes.LightDamageMax - sourceAttributes.LightDamageMin + 1)),
                    IsCrit = Random.Shared.NextDouble() * 100 < sourceAttributes.CriticalChance
                };

                if (hit.IsCrit)
                {
                    hit.Phys *= sourceAttributes.CriticalMultiplier;
                    hit.Fire *= sourceAttributes.CriticalMultiplier;
                    hit.Cold *= sourceAttributes.CriticalMultiplier;
                    hit.Light *= sourceAttributes.CriticalMultiplier;
                }

                var hitEntity = store.EntityCreate(gameId);
                store.EntitySet(hitEntity, hit);
            }
        }
    }

    private int? FindTarget(
        int gameId,
        int source,
        Transform2D sourcePos,
        Rigidbody sourceBody,
        Fraction sourceFraction,
        EntityAttributes sourceAttributes)
    {
        int? nearest = null;
        var nearestDist = double.PositiveInfinity;

        foreach (var id in store.Query<Transform2D, Rigidbody, Fraction>(gameId))
        {
            var fraction = store.EntityGet<Fraction>(id);
            if (fraction.Value == sourceFraction.Value) continue;

            // По духу нельзя целиться.
            if (store.EntityHas<Ghost>(id)) continue;

            var targetHealth = store.EntityGet<Health>(id);
            if (targetHealth != null && !double.IsNaN(targetHealth.LifeCurrent) && targetHealth.LifeCurrent <= 0) continue;

            var targetPos = store.EntityGet<Transform2D>(id);
            var targetBody = store.EntityGet<Rigidbody>(id);
            var dx = targetPos.X - sourcePos.X;
            var dy = targetPos.Y - sourcePos.Y;
            var dist = Math.Sqrt(dx * dx + dy * dy) - targetBody.Size;

            if (dist > sourceBody.Size + sourceAttributes.AttackRange) continue;

            if (dist < nearestDist)
            {
                nearestDist = dist;
                nearest = id;
            }
        }

        return nearest;
    }
}

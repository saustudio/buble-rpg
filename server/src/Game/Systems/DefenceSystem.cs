using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Game.Systems;

public sealed class DefenceSystem(
    GameDbContext store,
    EntityAttributesService attrService) : IGameSystem
{
    public void Update(double deltaTime)
    {
        foreach (var gameId in store.GameIds())
        {
            var gs = store.Single<GameState>(gameId);
            if (gs == null || gs.State == EGameState.PAUSE || gs.State == EGameState.OVER) continue;

            foreach (var evasion in store.Query<DefenceEvasion>(gameId)) store.EntityRemove(evasion);
            foreach (var block in store.Query<DefenceBlock>(gameId)) store.EntityRemove(block);

            foreach (var entity in store.Query<AttackHit>(gameId))
            {
                var hit = store.EntityGet<AttackHit>(entity);

                var sourceAttributes = attrService.Attributes(hit.Source);
                var targetAttributes = attrService.Attributes(hit.Target);
                if (targetAttributes == null)
                {
                    store.EntityRemove(entity);
                    continue;
                }

                if (sourceAttributes != null)
                {
                    var denom = sourceAttributes.Accuracy + targetAttributes.Evasion * 0.5;
                    var chanceToHit = denom > 0 ? sourceAttributes.Accuracy / denom : 1;
                    var clampedChance = Math.Max(0.05, Math.Min(0.95, chanceToHit));

                    if (Random.Shared.NextDouble() > clampedChance)
                    {
                        var evasionEntity = store.EntityCreate(gameId);
                        store.EntitySet(evasionEntity, new DefenceEvasion(hit.Source, hit.Target));
                        store.EntityRemove(evasionEntity);
                        continue;
                    }
                }

                if (Random.Shared.NextDouble() * 100 < targetAttributes.Block)
                {
                    var blockEntity = store.EntityCreate(gameId);
                    store.EntitySet(blockEntity, new DefenceBlock(hit.Source, hit.Target));
                    store.EntityRemove(blockEntity);
                    continue;
                }

                hit.Phys = hit.Phys * (1 - Math.Min(targetAttributes.Armour / (targetAttributes.Armour + hit.Phys * 5), 0.9)) * (1 - targetAttributes.PhysReduction / 100);
                hit.Fire = hit.Fire * (1 - Math.Min(targetAttributes.FireResist / 100, 0.9));
                hit.Cold = hit.Cold * (1 - Math.Min(targetAttributes.ColdResist / 100, 0.9));
                hit.Light = hit.Light * (1 - Math.Min(targetAttributes.LightResist / 100, 0.9));

                if (targetAttributes.PhysReflect > 0)
                {
                    var reflectHit = new AttackHit(hit.Target, hit.Source)
                    {
                        Phys = targetAttributes.PhysReflect
                    };
                    var reflectEntity = store.EntityCreate(gameId);
                    store.EntitySet(reflectEntity, reflectHit);
                }
            }
        }
    }
}

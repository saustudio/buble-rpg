using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Game.Systems;

public sealed class DefenceSystem(
    GameDataService store,
    EntityAttributesService attrService,
    GameStateService gameStateService) : IGameSystem
{
    public void Update(double deltaTime)
    {
        var gs = gameStateService.Current;
        if (gs == null || gs.State == EGameState.PAUSE || gs.State == EGameState.OVER) return;

        foreach (var evasion in store.Query<DefenceEvasion>()) store.EntityRemove(evasion);
        foreach (var block in store.Query<DefenceBlock>()) store.EntityRemove(block);

        foreach (var entity in store.Query<AttackHit>())
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
                    var evasionEntity = store.EntityCreate();
                    store.EntitySet(evasionEntity, new DefenceEvasion(hit.Source, hit.Target));
                    store.EntityRemove(evasionEntity);
                    continue;
                }
            }

            if (Random.Shared.NextDouble() * 100 < targetAttributes.Block)
            {
                var blockEntity = store.EntityCreate();
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
                var reflectEntity = store.EntityCreate();
                store.EntitySet(reflectEntity, reflectHit);
            }
        }
    }
}

using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Game.Systems;

public sealed class LootSystem(
    GameDataService store,
    GameStateService gameStateService,
    ILogger<LootSystem> logger) : IGameSystem
{
    public void Update(double deltaTime)
    {
        ApplyPicks();

        var gs = gameStateService.Current;
        if (gs == null || gs.State == EGameState.PAUSE || gs.State == EGameState.OVER) return;

        foreach (var hitEntity in store.Query<AttackHit>())
        {
            var hit = store.EntityGet<AttackHit>(hitEntity);
            var health = store.EntityGet<Health>(hit.Target);
            if (health == null || health.LifeCurrent > 0) continue;

            var equipment = store.EntityGet<Equipment>(hit.Target);
            if (equipment == null) continue;

            var lootList = EquipmentService.All(equipment);
            if (lootList.Count == 0) continue;

            var loot = store.EntityGet<Loot>(hit.Source);
            if (loot == null)
            {
                var map = new Dictionary<int, List<Item>>
                {
                    [hit.Target] = lootList
                };
                store.EntitySet(hit.Source, new Loot(map));
            }
            else
            {
                loot.ItemList[hit.Target] = lootList;
            }
        }
    }

    private void ApplyPicks()
    {
        foreach (var (entityId, pick) in store.FindComponents<LootPick>())
        {
            // TODO: найти лут героя и надеть предмет.
            logger.LogWarning(
                "Loot pickup is not implemented yet: hero {HeroId}, item {ItemId}.",
                entityId,
                pick.ItemId);

            store.EntityRemoveSet<LootPick>(entityId);
        }
    }
}

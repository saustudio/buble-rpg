using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;

using Microsoft.Extensions.Logging;

namespace BubleRpg.Server.Game.Systems;

/// <summary>
/// Создаёт мешки с трупов. Убийца определяется по ударам текущего тика: мёртвую цель нельзя выбрать
/// (<see cref="AttackSystem"/> пропускает <c>LifeCurrent &lt;= 0</c>), а удары снимаются в начале следующего тика,
/// поэтому наличие <see cref="AttackHit"/> по цели с <c>LifeCurrent &lt;= 0</c> означает смерть ровно в этом тике.
/// Мешок забирает живой герой с сильнейшим ударом: монстры лут не собирают и не конкурируют за него.
/// <para/>
/// TODO: атрибуция по суммарному урону за бой (накопление на жертве), сейчас — сильнейший удар тика.
/// TODO: детерминизм при ничьей (например, по меньшему id источника), сейчас — порядок Query&lt;AttackHit&gt;.
/// TODO: отражённый урон (PhysReflect) не проходит митигацию цели — сравнение силы не строго однородно.
/// </summary>
public sealed class LootSystem(GameDbContext store, ILogger<LootSystem> logger) : IGameSystem
{
    public void Update(double deltaTime)
    {
        foreach (var gameId in store.GameIds())
        {
            var gs = store.Single<GameState>(gameId);
            if (gs == null || gs.State == EGameState.PAUSE || gs.State == EGameState.OVER) continue;

            foreach (var (target, hit) in StrongestHeroHits(gameId))
            {
                var health = store.EntityGet<Health>(target);
                if (health == null || double.IsNaN(health.LifeCurrent) || health.LifeCurrent > 0) continue;

                var equipment = store.EntityGet<Equipment>(target);
                if (equipment == null) continue;

                // Перенос, а не ссылка: экипировка снимается с жертвы и уходит в мешок.
                var items = EquipmentService.TakeAll(equipment);
                if (items.Count == 0) continue;

                var loot = store.EntityGet<Loot>(hit.Source);
                if (loot == null)
                {
                    loot = new Loot();
                    store.EntitySet(hit.Source, loot);
                }

                loot.AddBag(target, items);

                logger.LogDebug(
                    "Loot: killer={Killer}, bag={Bag}, revision={Revision}, items={Count}.",
                    hit.Source, target, loot.Revision, items.Count);
            }
        }
    }

    /// <summary>Для каждой цели — живой герой с сильнейшим своим ударом в этом тике.</summary>
    private Dictionary<int, AttackHit> StrongestHeroHits(int gameId)
    {
        var strongest = new Dictionary<int, AttackHit>();

        foreach (var hitEntity in store.Query<AttackHit>(gameId))
        {
            var hit = store.EntityGet<AttackHit>(hitEntity);
            if (hit == null) continue;

            // Монстры лут не собирают и не конкурируют за него.
            if (!store.EntityHas<Hero>(hit.Source)) continue;

            // Мёртвый источник мешок получить не может.
            var sourceHealth = store.EntityGet<Health>(hit.Source);
            if (sourceHealth != null && !double.IsNaN(sourceHealth.LifeCurrent) && sourceHealth.LifeCurrent <= 0) continue;

            var amount = Damage(hit);

            if (!strongest.TryGetValue(hit.Target, out var current)) strongest[hit.Target] = hit;
            else if (amount > Damage(current)) strongest[hit.Target] = hit;
        }

        return strongest;
    }

    private static double Damage(AttackHit hit) => hit.Phys + hit.Fire + hit.Cold + hit.Light;
}

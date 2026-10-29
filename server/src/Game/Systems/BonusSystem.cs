using System.Text.Json;

using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Game.Services;

namespace BubleRpg.Server.Game.Systems;

public sealed class BonusSystem(
    GameDbContext store,
    ILogger<BonusSystem> logger) : IGameSystem
{
    private const int OfferCount = 3;

    public void Update(double deltaTime)
    {
        // TODO(этап 3): офферы и применённые бонусы пока живут в одном List<IBonus>,
        // поэтому до разделения компонентов бонусные предложения не включаем.
        _ = deltaTime;
    }

    private void ApplyChoices(int gameId)
    {
        foreach (var (entityId, choice) in store.FindComponents<BonusChoice>(gameId))
        {
            var picked = Choose(gameId, choice.BonusId);
            if (picked == null)
            {
                logger.LogWarning(
                    "Bonus {BonusId} from {Source} is not present in the current offer.",
                    choice.BonusId,
                    choice.Source);
            }

            store.EntityRemoveSet<BonusChoice>(entityId);
        }
    }

    private void RollLevelOffer(int gameId)
    {
        if (HasOffer(gameId)) return;

        var hero = store.First<Hero, Experience>(gameId);
        if (hero == null) return;

        var experience = store.EntityGet<Experience>(hero.Value);
        if (experience.Value < experience.Next) return;

        RollOffers(gameId, hero.Value);
    }

    private void RollWaveOffer(int gameId)
    {
        if (HasOffer(gameId)) return;

        var waveEntity = store.First<Wave>(gameId);
        if (waveEntity == null) return;

        var wave = store.EntityGet<Wave>(waveEntity.Value);
        if (wave.Spawned < wave.SpawnMax) return;
        if (store.Query<Monster>(gameId).Count != 0) return;

        RollOffers(gameId, waveEntity.Value);
    }

    private void RollOffers(int gameId, int entity)
    {
        var available = new List<BonusNode>(Load("expbonus"));
        var result = new List<IBonus>();

        for (var i = 0; i < OfferCount && available.Count > 0; i++)
        {
            var picked = PickWeighted(available);
            available.Remove(picked);
            result.Add(RollOffer(picked));
        }

        RemoveOffer(gameId);
        store.EntitySet(entity, result);
    }

    private bool HasOffer(int gameId)
    {
        var entity = store.FindEntity<List<IBonus>>(gameId);
        return entity != null && store.EntityGet<List<IBonus>>(entity.Value).Count > 0;
    }

    private void RemoveOffer(int gameId)
    {
        var entity = store.FindEntity<List<IBonus>>(gameId);
        if (entity != null) store.EntityRemoveSet<List<IBonus>>(entity.Value);
    }

    private IBonus? Choose(int gameId, string bonusId)
    {
        var entity = store.FindEntity<List<IBonus>>(gameId);
        if (entity == null) return null;

        var offer = store.EntityGet<List<IBonus>>(entity.Value);
        var picked = offer.FirstOrDefault(bonus => bonus.Id == bonusId);
        if (picked == null) return null;

        store.EntityRemoveSet<List<IBonus>>(entity.Value);
        return picked;
    }

    private List<BonusNode> Load(string type)
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Game", "Resources", $"{type}.json");
        return JsonSerializer.Deserialize<List<BonusNode>>(File.ReadAllText(path)) ?? new List<BonusNode>();
    }

    private BonusNode PickWeighted(List<BonusNode> items)
    {
        var total = items.Sum(item => item.Weight ?? 1);
        var roll = Random.Shared.NextDouble() * total;
        var picked = items[^1];

        foreach (var item in items)
        {
            roll -= item.Weight ?? 1;
            if (roll <= 0)
            {
                picked = item;
                break;
            }
        }

        return picked;
    }

    private double RollValue(double min, double max, int decimals)
    {
        var raw = min + Random.Shared.NextDouble() * (max - min);
        var factor = Math.Pow(10, decimals);
        return Math.Round(raw * factor) / factor;
    }

    private IBonus RollOffer(BonusNode node)
    {
        return new BonusData
        {
            Id = node.Id ?? string.Join("+", node.Effects.Select(effect => $"{effect.Type}:{effect.Mod}")),
            Weight = node.Weight ?? 1,
            Effects = node.Effects.Select(effect => (IBonusEffect)new BonusEffect
            {
                Type = effect.Type,
                Mod = effect.Mod,
                Value = RollValue(effect.Min, effect.Max, effect.Decimals ?? 0)
            }).ToList()
        };
    }
}

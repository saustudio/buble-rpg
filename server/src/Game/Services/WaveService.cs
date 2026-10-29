using BubleRpg.Server.Game.Model;

namespace BubleRpg.Server.Game.Services;

/// <summary>
/// Пересчёт итоговых параметров волны по выбранным модификаторам.
/// Портировано из v1 <c>WaveService.Stats</c>.
/// </summary>
public sealed class WaveService
{
    private const double BaseMax = 6;
    private const int BaseMonsterLevel = 1;
    private const double BaseSpawnInterval = 2;
    private const double MinSpawnInterval = 0.3;

    public WaveStats Stats(IReadOnlyList<WaveModifier> modifiers)
    {
        double countFlat = 0;
        double countPercent = 0;
        double monsterLevel = 0;
        double healthPercent = 0;
        double damagePercent = 0;
        double speedPoint = 0;
        double spawnSpeedPercent = 0;
        double resistPoint = 0;
        double elitePoint = 0;
        double itemQuantityPercent = 0;
        double itemRarityPercent = 0;

        foreach (var modifier in modifiers)
        {
            foreach (var effect in modifier.Effects)
            {
                switch (effect.Type)
                {
                    case EBonusEffectType.MonsterCount:
                        if (effect.ValueType == EBonusModifier.flat) countFlat += effect.Min;
                        else countPercent += effect.Min;
                        break;
                    case EBonusEffectType.MonsterLevel:
                        monsterLevel += effect.Min;
                        break;
                    case EBonusEffectType.MonsterHealth:
                        healthPercent += effect.Min;
                        break;
                    case EBonusEffectType.MonsterDamage:
                        damagePercent += effect.Min;
                        break;
                    case EBonusEffectType.MonsterSpeed:
                        speedPoint += effect.Min;
                        break;
                    case EBonusEffectType.SpawnSpeed:
                        spawnSpeedPercent += effect.Min;
                        break;
                    case EBonusEffectType.MonsterResist:
                        resistPoint += effect.Min;
                        break;
                    case EBonusEffectType.EliteChance:
                        elitePoint += effect.Min;
                        break;
                    case EBonusEffectType.ItemQuantity:
                        itemQuantityPercent += effect.Min;
                        break;
                    case EBonusEffectType.ItemRarity:
                        itemRarityPercent += effect.Min;
                        break;
                }
            }
        }

        var maxCount = Math.Max(1, Math.Round((BaseMax + countFlat) * (1 + countPercent / 100)));
        var spawnInterval = Math.Max(MinSpawnInterval, BaseSpawnInterval / (1 + spawnSpeedPercent / 100));

        return new WaveStats(
            maxCount,
            BaseMonsterLevel + (int)Math.Round(monsterLevel),
            spawnInterval,
            1 + healthPercent / 100,
            1 + damagePercent / 100,
            1 + speedPoint / 100,
            Math.Min(75, resistPoint),
            Math.Max(0, Math.Min(0.9, elitePoint / 100)),
            1 + itemQuantityPercent / 100,
            itemRarityPercent);
    }
}

public sealed record WaveStats(
    double MaxCount,
    int MonsterLevel,
    double SpawnInterval,
    double HealthMult,
    double DamageMult,
    double SpeedMult,
    double Resist,
    double EliteChance,
    double ItemQuantityMult,
    double ItemRarityBonus);

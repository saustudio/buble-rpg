using System.Diagnostics;
using System.Text.Json;

using BubleRpg.Server.Game.Model;

namespace BubleRpg.Server.Game.Services;

public static class ItemFactory
{
    private static readonly HashSet<string> IgnoreStats = new()
    {
        "flask_mana_recovery_rate_+%",
        "local_life_gain_per_target",
        "local_socketed_melee_gem_level_+",
        "charges_gained_+%",
        "cold_dot_multiplier_+",
        "light_radius_+%",
        "cold_spell_skill_gem_level_+",
        "flask_charges_used_+%",
        "base_item_found_rarity_+%",
        "mana_regeneration_rate_+%",
        "physical_damage_%_to_add_as_random_element",
        "base_number_of_spectres_allowed",
        "cold_damage_taken_%_as_fire",
        "cold_damage_taken_%_as_lightning",
        "fishing_bite_sensitivity_+%",
        "base_item_found_quantity_+%",
        "chance_to_freeze_shock_ignite_%",
        "chaos_damage_+%",
        "base_number_of_skeletons_allowed",
        "base_number_of_zombies_allowed",
        "projectile_base_number_of_targets_to_pierce",
        "lightning_damage_taken_%_as_fire",
        "lightning_damage_taken_%_as_cold",
        "physical_damage_taken_%_as_cold",
        "physical_damage_taken_%_as_fire",
        "physical_damage_taken_%_as_lightning",
        "fire_damage_taken_%_as_cold",
        "fire_damage_taken_%_as_lightning",
        "add_frenzy_charge_on_kill_%_chance",
        "endurance_charge_on_kill_%",
        "add_power_charge_on_kill_%_chance",
        "base_maximum_mana",
        "maximum_mana_+%",
        "base_mana_gained_on_enemy_death",
        "local_has_X_sockets",
        "base_stun_recovery_+%",
        "local_stat_monsters_pick_up_item"
    };

    private static readonly object LoadLock = new();
    private static Dictionary<string, MetaItem>? baseItemsDb;
    private static Dictionary<string, MetaMod>? modsDb;

    public static void LoadDB()
    {
        if (baseItemsDb != null && modsDb != null) return;

        lock (LoadLock)
        {
            if (baseItemsDb != null && modsDb != null) return;

            var dataPath = Path.Combine(AppContext.BaseDirectory, "Game", "Resources");
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            baseItemsDb = JsonSerializer.Deserialize<Dictionary<string, MetaItem>>(
                File.ReadAllText(Path.Combine(dataPath, "base_items.json")), options) ?? new();
            modsDb = JsonSerializer.Deserialize<Dictionary<string, MetaMod>>(
                File.ReadAllText(Path.Combine(dataPath, "mods.json")), options) ?? new();

            ValidateData();
        }
    }

    private static void ValidateData()
    {
        var invalidItems = baseItemsDb!.Count(entry =>
            string.IsNullOrWhiteSpace(entry.Value.Domain) ||
            entry.Value.Tags == null);

        Debug.Assert(invalidItems == 0);

        var invalidMods = modsDb!.Count(entry =>
            string.IsNullOrWhiteSpace(entry.Value.Domain) ||
            string.IsNullOrWhiteSpace(entry.Value.GenerationType) ||
            (entry.Value.Stats?.Any(stat => string.IsNullOrWhiteSpace(stat.Id)) ?? false));

        Debug.Assert(invalidMods == 0);
    }

    public static Item? Random(int lvl, string tag, double str, double dex, double intValue)
    {
        LoadDB();

        var meta = QueryBaseItem(lvl, tag, str, dex, intValue);
        if (meta == null) return null;

        var (_, itemMeta) = meta.Value;
        var rarity = RandomRarity();
        var item = CreateItem(itemMeta, rarity, tag);

        ApplyBaseProperties(item, itemMeta.Properties);
        ApplyImplicits(item, itemMeta);
        ApplyExplicits(item, itemMeta, lvl, rarity);
        ApplyFinals(item);

        return item;
    }

    private static (string Key, MetaItem Meta)? QueryBaseItem(int lvl, string tag, double str, double dex, double intValue)
    {
        var candidates = baseItemsDb!
            .Where(entry =>
                entry.Value.DropLevel <= lvl &&
                entry.Value.Domain == ItemDomain.ITEM &&
                entry.Value.Tags.Contains(tag) &&
                !entry.Value.Tags.Contains(ItemTag.NOT_FOR_SALE) &&
                MeetsRequirements(entry.Value.Requirements, str, dex, intValue))
            .ToList();

        if (candidates.Count == 0) return null;

        var maxLevel = candidates.Max(entry => entry.Value.DropLevel);
        var best = candidates.Where(entry => entry.Value.DropLevel == maxLevel).ToList();
        var picked = best[System.Random.Shared.Next(best.Count)];
        return (picked.Key, picked.Value);
    }

    private static bool MeetsRequirements(MetaRequirements? req, double str, double dex, double intValue)
    {
        if (req == null) return true;
        return (req.Strength ?? 0) <= str &&
               (req.Dexterity ?? 0) <= dex &&
               (req.Intelligence ?? 0) <= intValue;
    }

    private static Item CreateItem(MetaItem meta, EItemRarity rarity, string tag)
    {
        var icon = meta.VisualIdentity.DdsFile.Replace(".dds", ".png");
        var req = meta.Requirements;

        return new Item(
            meta.Name,
            meta.DropLevel,
            req?.Strength ?? 0,
            req?.Dexterity ?? 0,
            req?.Intelligence ?? 0,
            rarity,
            meta.ItemClass,
            tag,
            icon);
    }

    private static void ApplyBaseProperties(Item item, MetaProperties props)
    {
        if (props.Evasion != null)
            item.Base[AffixType.EVASION] = Math.Floor(props.Evasion.Min + System.Random.Shared.NextDouble() * (props.Evasion.Max - props.Evasion.Min + 1));
        if (props.EnergyShield != null)
            item.Base[AffixType.ES] = Math.Floor(props.EnergyShield.Min + System.Random.Shared.NextDouble() * (props.EnergyShield.Max - props.EnergyShield.Min + 1));
        if (props.Armour != null)
            item.Base[AffixType.ARMOUR] = Math.Floor(props.Armour.Min + System.Random.Shared.NextDouble() * (props.Armour.Max - props.Armour.Min + 1));
        if (props.Block != null)
            item.Base[AffixType.BLOCK] = props.Block.Value;

        if (props.PhysicalDamageMin != null)
            item.Base[AffixType.PHYS_DAMAGE_MIN] = props.PhysicalDamageMin.Value;
        if (props.PhysicalDamageMax != null)
            item.Base[AffixType.PHYS_DAMAGE_MAX] = props.PhysicalDamageMax.Value;

        if (props.AttackTime != null)
            item.Base[AffixType.ATTACK_SPEED] = Math.Round(1000 / props.AttackTime.Value * 100) / 100;
        if (props.CriticalStrikeChance != null)
            item.Base[AffixType.CRITICAL_CHANCE] = props.CriticalStrikeChance.Value / 100;
        if (props.Range != null)
            item.Base[AffixType.ATTACK_RANGE] = props.Range.Value;

        if (props.MovementSpeed != null)
            item.Base[AffixType.MOVEMENT_SPEED] = props.MovementSpeed.Value;
    }

    private static void ApplyImplicits(Item item, MetaItem meta)
    {
        foreach (var implicitKey in meta.Implicits ?? new List<string>())
        {
            if (!modsDb!.TryGetValue(implicitKey, out var mod)) continue;
            foreach (var stat in mod.Stats ?? new List<MetaStat>())
            {
                if (IgnoreStats.Contains(stat.Id)) continue;
                item.Implicits[stat.Id] = Math.Floor(stat.Min + System.Random.Shared.NextDouble() * (stat.Max - stat.Min + 1));
            }
        }
    }

    private static void ApplyExplicits(Item item, MetaItem meta, int lvl, EItemRarity rarity)
    {
        var available = QueryExplicitList(meta, lvl);
        var (prefixes, suffixes) = ExplicitSplit(available);
        var (prefixCount, suffixCount) = ExplicitCount(rarity);

        var selectedPrefixes = RandomExplicitList(prefixes, prefixCount);
        var selectedSuffixes = RandomExplicitList(suffixes, suffixCount);

        foreach (var (_, mod) in selectedPrefixes.Concat(selectedSuffixes))
        {
            foreach (var stat in mod.Stats ?? new List<MetaStat>())
            {
                if (IgnoreStats.Contains(stat.Id)) continue;
                if (item.Explicits.ContainsKey(stat.Id) || stat.Max == 0) continue;
                item.Explicits[stat.Id] = Math.Floor(stat.Min + System.Random.Shared.NextDouble() * (stat.Max - stat.Min + 1));
            }
        }

        SetItemName(item, meta, selectedPrefixes, selectedSuffixes);
    }

    private static void ApplyFinals(Item item)
    {
        foreach (var (key, value) in item.Base) item.Final[key] = value;
        foreach (var (key, value) in item.Implicits)
        {
            item.Final.TryGetValue(key, out var current);
            item.Final[key] = current + value;
        }

        foreach (var (key, value) in item.Explicits)
        {
            if (!IsLocalMod(key))
            {
                item.Final[key] = value;
                continue;
            }

            ApplyLocalMod(item, key, value);
        }
    }

    private static bool IsLocalMod(string key)
    {
        return key == AffixLocalType.CRITICAL_STRICE_CHANCE_INC ||
               key == AffixLocalType.ACCURACY ||
               key == AffixLocalType.ATTACK_SPEED_INC ||
               key == AffixLocalType.BLOCK ||
               key == AffixLocalType.ARMOUR ||
               key == AffixLocalType.ARMOUR_INC ||
               key == AffixLocalType.ARMOUR_ES_INC ||
               key == AffixLocalType.ARMOR_EVASION_INC ||
               key == AffixLocalType.ES ||
               key == AffixLocalType.ES_INC ||
               key == AffixLocalType.EVASION ||
               key == AffixLocalType.EVASION_INC ||
               key == AffixLocalType.EVASION_ES_INC ||
               key == AffixLocalType.PHYS_DAMAGE_INC ||
               key == AffixLocalType.PHYS_DAMAGE_MIN ||
               key == AffixLocalType.PHYS_DAMAGE_MAX ||
               key == AffixLocalType.FIRE_DAMAGE_MIN ||
               key == AffixLocalType.FIRE_DAMAGE_MAX ||
               key == AffixLocalType.COLD_DAMAGE_MIN ||
               key == AffixLocalType.COLD_DAMAGE_MAX ||
               key == AffixLocalType.LIGHT_DAMAGE_MIN ||
               key == AffixLocalType.LIGHT_DAMAGE_MAX ||
               key == AffixLocalType.LIGHT_PENETRATION;
    }

    private static void ApplyLocalMod(Item item, string key, double value)
    {
        switch (key)
        {
            case AffixLocalType.PHYS_DAMAGE_INC:
            {
                var min = Get(item, AffixType.PHYS_DAMAGE_MIN);
                var max = Get(item, AffixType.PHYS_DAMAGE_MAX);
                if (min > 0 || max > 0)
                {
                    item.Final[AffixType.PHYS_DAMAGE_MIN] = Math.Floor(min * (1 + value / 100));
                    item.Final[AffixType.PHYS_DAMAGE_MAX] = Math.Floor(max * (1 + value / 100));
                }

                min = Get(item, AffixType.ATTACK_PHYS_DAMAGE_MIN);
                max = Get(item, AffixType.ATTACK_PHYS_DAMAGE_MAX);
                if (min > 0 || max > 0)
                {
                    item.Final[AffixType.ATTACK_PHYS_DAMAGE_MIN] = Math.Floor(min * (1 + value / 100));
                    item.Final[AffixType.ATTACK_PHYS_DAMAGE_MAX] = Math.Floor(max * (1 + value / 100));
                }

                min = Get(item, AffixType.CAST_PHYS_MIN);
                max = Get(item, AffixType.CAST_PHYS_MAX);
                if (min > 0 || max > 0)
                {
                    item.Final[AffixType.CAST_PHYS_MIN] = Math.Floor(min * (1 + value / 100));
                    item.Final[AffixType.CAST_PHYS_MAX] = Math.Floor(max * (1 + value / 100));
                }

                break;
            }
            case AffixLocalType.PHYS_DAMAGE_MIN:
                item.Final[AffixType.PHYS_DAMAGE_MIN] = Get(item, AffixType.PHYS_DAMAGE_MIN) + value;
                break;
            case AffixLocalType.PHYS_DAMAGE_MAX:
                item.Final[AffixType.PHYS_DAMAGE_MIN] = Get(item, AffixType.PHYS_DAMAGE_MAX) + value;
                break;
            case AffixLocalType.FIRE_DAMAGE_MIN:
                item.Final[AffixType.ATTACK_FIRE_DAMAGE_MIN] = Get(item, AffixType.ATTACK_FIRE_DAMAGE_MIN) + value;
                break;
            case AffixLocalType.FIRE_DAMAGE_MAX:
                item.Final[AffixType.ATTACK_FIRE_DAMAGE_MAX] = Get(item, AffixType.ATTACK_FIRE_DAMAGE_MAX) + value;
                break;
            case AffixLocalType.COLD_DAMAGE_MIN:
                item.Final[AffixType.ATTACK_COLD_DAMAGE_MIN] = Get(item, AffixType.ATTACK_COLD_DAMAGE_MIN) + value;
                break;
            case AffixLocalType.COLD_DAMAGE_MAX:
                item.Final[AffixType.ATTACK_COLD_DAMAGE_MAX] = Get(item, AffixType.ATTACK_COLD_DAMAGE_MAX) + value;
                break;
            case AffixLocalType.LIGHT_DAMAGE_MIN:
                item.Final[AffixType.ATTACK_LIGHT_DAMAGE_MIN] = Get(item, AffixType.ATTACK_LIGHT_DAMAGE_MIN) + value;
                break;
            case AffixLocalType.LIGHT_DAMAGE_MAX:
                item.Final[AffixType.ATTACK_LIGHT_DAMAGE_MAX] = Get(item, AffixType.ATTACK_LIGHT_DAMAGE_MAX) + value;
                break;
            case AffixLocalType.ATTACK_SPEED_INC:
                item.Final[AffixType.ATTACK_SPEED] = Math.Floor(Get(item, AffixType.ATTACK_SPEED) * (1 + value / 100));
                break;
            case AffixLocalType.BLOCK:
                item.Final[AffixType.BLOCK] = Get(item, AffixType.BLOCK) + value;
                break;
            case AffixLocalType.ARMOUR:
                item.Final[AffixType.ARMOUR] = Get(item, AffixType.ARMOUR) + value;
                break;
            case AffixLocalType.ARMOUR_INC:
                item.Final[AffixType.ARMOUR] = Math.Floor(Get(item, AffixType.ARMOUR) * (1 + value / 100));
                break;
            case AffixLocalType.ARMOUR_ES_INC:
                item.Final[AffixType.ARMOUR] = Math.Floor(Get(item, AffixType.ARMOUR) * (1 + value / 100));
                item.Final[AffixType.ES] = Math.Floor(Get(item, AffixType.ES) * (1 + value / 100));
                break;
            case AffixLocalType.ARMOR_EVASION_INC:
                item.Final[AffixType.ARMOUR] = Math.Floor(Get(item, AffixType.ARMOUR) * (1 + value / 100));
                item.Final[AffixType.EVASION] = Math.Floor(Get(item, AffixType.EVASION) * (1 + value / 100));
                break;
            case AffixLocalType.EVASION:
                item.Final[AffixType.EVASION] = Get(item, AffixType.EVASION) + value;
                break;
            case AffixLocalType.EVASION_INC:
                item.Final[AffixType.EVASION] = Math.Floor(Get(item, AffixType.EVASION) * (1 + value / 100));
                break;
            case AffixLocalType.EVASION_ES_INC:
                item.Final[AffixType.EVASION] = Math.Floor(Get(item, AffixType.EVASION) * (1 + value / 100));
                item.Final[AffixType.ES] = Math.Floor(Get(item, AffixType.ES) * (1 + value / 100));
                break;
            case AffixLocalType.ES:
                item.Final[AffixType.ES] = Get(item, AffixType.ES) + value;
                break;
            case AffixLocalType.ES_INC:
                item.Final[AffixType.ES] = Math.Floor(Get(item, AffixType.ES) * (1 + value / 100));
                break;
            case AffixLocalType.CRITICAL_STRICE_CHANCE_INC:
                item.Final[AffixType.CRITICAL_CHANCE] = Math.Floor(Get(item, AffixType.CRITICAL_CHANCE) * (1 + value / 100));
                break;
            case AffixLocalType.ACCURACY:
                item.Final[AffixType.ACCURACY] = Get(item, AffixType.ACCURACY) + value;
                break;
            case AffixLocalType.LIGHT_PENETRATION:
                break;
        }
    }

    private static double Get(Item item, string key)
    {
        return item.Final.TryGetValue(key, out var value) ? value : 0;
    }

    private static List<(string Key, MetaMod Mod)> QueryExplicitList(MetaItem meta, int lvl)
    {
        return modsDb!
            .Where(entry =>
                entry.Value.RequiredLevel <= lvl &&
                entry.Value.Domain == ItemDomain.ITEM &&
                (entry.Value.GenerationType == ItemGenerationType.PREFIX || entry.Value.GenerationType == ItemGenerationType.SUFFIX) &&
                !entry.Value.IsEssenceOnly &&
                HasMatchingTag(entry.Value, meta.Tags))
            .Select(entry => (entry.Key, entry.Value))
            .ToList();
    }

    private static bool HasMatchingTag(MetaMod mod, List<string> itemTags)
    {
        if (mod.SpawnWeights == null || mod.SpawnWeights.Count == 0) return true;

        var hasValidWeight = mod.SpawnWeights.Any(sw => sw.Weight > 0);
        if (!hasValidWeight) return false;

        return mod.SpawnWeights.Any(sw => sw.Weight > 0 && (sw.Tag == ItemSpawnWeight.DEFAULT || itemTags.Contains(sw.Tag)));
    }

    private static (List<(string Key, MetaMod Mod)> Prefixes, List<(string Key, MetaMod Mod)> Suffixes) ExplicitSplit(
        List<(string Key, MetaMod Mod)> mods)
    {
        var prefixes = mods.Where(entry => entry.Mod.GenerationType == ItemGenerationType.PREFIX).ToList();
        var suffixes = mods.Where(entry => entry.Mod.GenerationType == ItemGenerationType.SUFFIX).ToList();
        return (prefixes, suffixes);
    }

    private static List<(string Key, MetaMod Mod)> RandomExplicitList(List<(string Key, MetaMod Mod)> explicits, int count)
    {
        var usedGroups = new HashSet<string>();
        var usedStats = new HashSet<string>();
        var selected = new List<(string Key, MetaMod Mod)>();
        var available = new List<(string Key, MetaMod Mod)>(explicits);

        for (var i = 0; i < count && available.Count > 0; i++)
        {
            var compatible = available
                .Where(entry => !(entry.Mod.Groups ?? new List<string>()).Any(usedGroups.Contains))
                .Where(entry => !(entry.Mod.Stats ?? new List<MetaStat>()).Any(stat => usedStats.Contains(stat.Id)))
                .ToList();

            if (compatible.Count == 0) break;

            var chosen = RandomExplicit(compatible);
            if (chosen == null) break;

            foreach (var group in chosen.Value.Mod.Groups ?? new List<string>()) usedGroups.Add(group);
            foreach (var stat in chosen.Value.Mod.Stats ?? new List<MetaStat>()) usedStats.Add(stat.Id);

            selected.Add(chosen.Value);
            available = available.Where(entry => entry.Key != chosen.Value.Key).ToList();
        }

        return selected;
    }

    private static (string Key, MetaMod Mod)? RandomExplicit(List<(string Key, MetaMod Mod)> mods)
    {
        if (mods.Count == 0) return null;

        var weighted = mods.Select(entry => new
        {
            entry.Key,
            entry.Mod,
            Weight = entry.Mod.SpawnWeights?.Sum(sw => sw.Weight > 0 ? sw.Weight : 0) ?? 1000
        }).ToList();

        var valid = weighted.Where(entry => entry.Weight > 0).ToList();
        if (valid.Count == 0) return null;

        var total = valid.Sum(entry => entry.Weight);
        var random = System.Random.Shared.NextDouble() * total;

        foreach (var entry in valid)
        {
            random -= entry.Weight;
            if (random <= 0) return (entry.Key, entry.Mod);
        }

        var last = valid[^1];
        return (last.Key, last.Mod);
    }

    private static void SetItemName(
        Item item,
        MetaItem meta,
        List<(string Key, MetaMod Mod)> prefixes,
        List<(string Key, MetaMod Mod)> suffixes)
    {
        var name = string.IsNullOrEmpty(meta.Name) ? "Предмет" : meta.Name;

        if (prefixes.Count > 0)
        {
            var prefix = prefixes[System.Random.Shared.Next(prefixes.Count)];
            name = $"{prefix.Mod.Name} {name}";
        }

        if (suffixes.Count > 0)
        {
            var suffix = suffixes[System.Random.Shared.Next(suffixes.Count)];
            name = $"{name} {suffix.Mod.Name}";
        }

        item.Name = name.Trim();
    }

    private static EItemRarity RandomRarity()
    {
        var roll = System.Random.Shared.NextDouble();
        if (roll < 0.5) return EItemRarity.NORMAL;
        if (roll < 0.8) return EItemRarity.MAGIC;
        return EItemRarity.RARE;
    }

    private static (int Prefixes, int Suffixes) ExplicitCount(EItemRarity rarity)
    {
        return rarity switch
        {
            EItemRarity.NORMAL => (0, 0),
            EItemRarity.MAGIC => (1, 1),
            EItemRarity.RARE => (3, 3),
            _ => (0, 0)
        };
    }
}

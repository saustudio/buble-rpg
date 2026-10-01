import baseItemsData from "../data/base_items.json";
import modsData from "../data/mods.json";
import { IEntityStats } from "./stats";

// ============================================================
// 1. ИНТЕРФЕЙСЫ
// ============================================================

interface IMetaMod
{
    adds_tags: string[];
    domain: string;
    generation_type: string;
    generation_weights: { tag: string; weight: number }[];
    grants_effects: any[];
    groups: string[];
    implicit_tags: string[];
    is_essence_only: boolean;
    name: string;
    required_level: number;
    spawn_weights: { tag: string; weight: number }[];
    stats: { id: string; max: number; min: number }[];
    type: string;
}

interface IMetaProperties
{
    evasion?: { min: number; max: number };
    energy_shield?: { min: number; max: number };
    armour?: { min: number; max: number };
    block?: number;
    attack_time?: number;
    critical_strike_chance?: number;
    movement_speed?: number;
    physical_damage_min?: number;
    physical_damage_max?: number;
    range?: number;
}

interface IMetaItem
{
    name: string;
    domain: string;
    drop_level: number;
    implicits: string[],
    item_class: string;
    requirements?: any;
    properties: IMetaProperties;
    visual_identity: { dds_file: string };
    tags: string[];
}

// ============================================================
// 2. ENUMS
// ============================================================

export enum EItemRarity { NORMAL = "NORMAL", MAGIC = "MAGIC", RARE = "RARE" }

export enum EAffixType
{

    STR = "additional_strength",
    DEX = "additional_dexterity",
    INT = "additional_intelligence",
    DEX_INT = "additional_dexterity_and_intelligence",
    STR_DEX = "additional_strength_and_dexterity",
    STR_INT = "additional_strength_and_intelligence",
    ATTRIBUTES = "additional_all_attributes",
    ATTRIBUTES_INC = "all_attributes_+%",

    ATTACK_SPEED = "attack_time",
    ATTACK_SPEED_INC = "attack_speed_+%",

    ATTACK_RANGE = "range",
    ATTACK_RANGE_INC = "base_skill_area_of_effect_+%",
    ACCURACY = "accuracy_rating",
    ACCURACY_INC = "accuracy_rating_+%",
    CRITICAL_CHANCE = "critical_strike_chance",
    CRITICAL_CHANCE_ADD = "base_critical_strike_multiplier_+",
    CRITICAL_CHANCE_INC = "critical_strike_chance_+%",
    CRITICAL_CHANCE_MLT = "base_critical_strike_multiplier",

    DAMAGE_INC = "damage_+%",
    ELEMENT_DAMAGE_INC = "elemental_damage_+%",

    PHYS_DAMAGE_MIN = "physical_damage_min",
    PHYS_DAMAGE_MAX = "physical_damage_max",
    PHYS_DAMAGE_INC = "physical_damage_+%",
    FIRE_DAMAGE_INC = "fire_damage_+%",
    COLD_DAMAGE_INC = "cold_damage_+%",
    LIGHT_DAMAGE_INC = "lightning_damage_+%",

    ATTACK_PHYS_REFLECT = "physical_damage_to_return_to_melee_attacker",
    ATTACK_PHYS_DAMAGE_MIN = "attack_minimum_added_physical_damage",
    ATTACK_PHYS_DAMAGE_MAX = "attack_maximum_added_physical_damage",
    ATTACK_FIRE_DAMAGE_MIN = "attack_minimum_added_fire_damage",
    ATTACK_FIRE_DAMAGE_MAX = "attack_maximum_added_fire_damage",
    ATTACK_COLD_DAMAGE_MIN = "attack_minimum_added_cold_damage",
    ATTACK_COLD_DAMAGE_MAX = "attack_maximum_added_cold_damage",
    ATTACK_LIGHT_DAMAGE_MIN = "attack_minimum_added_lightning_damage",
    ATTACK_LIGHT_DAMAGE_MAX = "attack_maximum_added_lightning_damage",

    ATTACK_CAST_SPEED_INC = "attack_and_cast_speed_+%",
    CAST_SPEED_INC = "base_cast_speed_+%",
    CAST_DAMAGE_INC = "spell_damage_+%",
    CAST_PHYS_MIN = "spell_minimum_added_physical_damage",
    CAST_PHYS_MAX = "spell_maximum_added_physical_damage",
    CAST_FIRE_MIN = "spell_minimum_added_fire_damage",
    CAST_FIRE_MAX = "spell_maximum_added_fire_damage",
    CAST_COLD_MIN = "spell_minimum_added_cold_damage",
    CAST_COLD_MAX = "spell_maximum_added_cold_damage",
    CAST_LIGHT_MIN = "spell_minimum_added_lightning_damage",
    CAST_LIGHT_MAX = "spell_maximum_added_lightning_damage",

    DEFENCE_INC = "global_defences_+%",

    EVASION = "evasion",
    EVASION_ADD = "base_evasion_rating",
    EVASION_INC = "evasion_rating_+%",

    ES = "energy_shield",
    ES_ADD = "base_maximum_energy_shield",
    BLOCK = "block",
    ARMOUR = "armour",
    AMROUR_ADD = "base_physical_damage_reduction_rating",
    PHYS_REDUCTION = "base_additional_physical_damage_reduction_%",
    PHYS_REDUCTION_INC = "physical_damage_reduction_rating_+%",

    MOVEMENT_SPEED = "movement_speed",
    MOVEMENT_SPEED_INC = "base_movement_velocity_+%",
    LIFE_PER_MINUTE_FLAT = "base_life_regeneration_rate_per_minute",
    LIFE_PER_MINUTE_PERC = "life_regeneration_rate_per_minute_%",
    LIFE_PER_KILL = "base_life_gained_on_enemy_death",
    LIFE_MAX = "base_maximum_life",
    LIFE_MAX_INC = "maximum_life_+%",
    FIRE_RES = "base_fire_damage_resistance_%",
    COLD_RES = "base_cold_damage_resistance_%",
    LIGHT_RES = "base_lightning_damage_resistance_%",

    STUN_INC = "stun_threshold_+%",
    STUN_REDUCTION = "base_stun_threshold_reduction_+%"
}

export enum EAffixLocalType
{
    CRITICAL_STRICE_CHANCE_INC = "local_critical_strike_chance_+%",
    ACCURACY = "local_accuracy_rating",
    ATTACK_SPEED_INC = "local_attack_speed_+%",
    BLOCK = "local_additional_block_chance_%",

    ARMOUR = "local_base_physical_damage_reduction_rating",
    ARMOUR_INC = "local_physical_damage_reduction_rating_+%",
    ARMOUR_ES_INC = "local_armour_and_energy_shield_+%",
    ARMOR_EVASION_INC = "local_armour_and_evasion_+%",

    ES = "local_energy_shield",
    ES_INC = "local_energy_shield_+%",

    EVASION = "local_base_evasion_rating",
    EVASION_INC = "local_evasion_rating_+%",
    EVASION_ES_INC = "local_evasion_and_energy_shield_+%",

    PHYS_DAMAGE_INC = "local_physical_damage_+%",
    PHYS_DAMAGE_MIN = "local_minimum_added_physical_damage",
    PHYS_DAMAGE_MAX = "local_maximum_added_physical_damage",

    FIRE_DAMAGE_MIN = "local_minimum_added_fire_damage",
    FIRE_DAMAGE_MAX = "local_maximum_added_fire_damage",

    COLD_DAMAGE_MIN = "local_minimum_added_cold_damage",
    COLD_DAMAGE_MAX = "local_maximum_added_cold_damage",

    LIGHT_DAMAGE_MIN = "local_minimum_added_lightning_damage",
    LIGHT_DAMAGE_MAX = "local_maximum_added_lightning_damage",
    LIGHT_PENETRATION = "local_lightning_penetration_%"

}

export enum EItemTag { WEAPON = "weapon", HELM = "helmet", BODY_ARMOUR = "body_armour", GLOVES = "gloves", BOOTS = "boots", AMULET = "amulet", SHEILD = "shield", BELT = "belt", QUIVER = "quiver", RING = "ring" }

// ============================================================
// 3. КЛАСС ITEM
// ============================================================

export class Item
{
    //базовые афиксы
    public Base = new Map<string, number>();
    //случайные афиксы
    public Explicits = new Map<string, number>();
    //встроенные афиксы
    public Implicits = new Map<string, number>();

    public Final = new Map<string, number>();

    constructor(
        public Name: string,
        public Level: number,
        public Str: number,
        public Dex: number,
        public Int: number,
        public Rarity: EItemRarity,
        public Class: string,
        public Tag: EItemTag,
        public Icon: string
    ) { }

}

// ============================================================
// 4. ФАБРИКА ПРЕДМЕТОВ
// ============================================================

export class ItemFactory
{
    private static igonreStats: Set<string> = new Set([
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
        "local_stat_monsters_pick_up_item"]);

    private static BaseItemsDb: Record<string, IMetaItem>;
    private static ModsDb: Record<string, IMetaMod>;

    public static LoadDB()
    {
        this.BaseItemsDb = baseItemsData as Record<string, IMetaItem>;
        this.ModsDb = modsData as Record<string, IMetaMod>;
    }

    public static Random(lvl: number, tag: EItemTag, str: number, dex: number, int: number): Item | null
    {
        const meta = this.QueryBaseItem(lvl, tag, str, dex, int);
        if (!meta) return null;

        const { meta: itemMeta, key } = meta;
        const rarity = this.RandomRarity();
        const item = this.CreateItem(itemMeta, rarity, tag);

        this.ApplyBaseProperties(item, itemMeta.properties);
        this.ApplyImplicits(item, itemMeta);
        this.ApplyExplicits(item, itemMeta, lvl, rarity);
        this.ApplyFinals(item);

        return item;
    }

    // ============================================================
    // 4.1 ВЫБОР БАЗОВОГО ПРЕДМЕТА
    // ============================================================

    private static QueryBaseItem(
        lvl: number,
        tag: EItemTag,
        str: number,
        dex: number,
        int: number
    ): { key: string; meta: IMetaItem } | null
    {
        const candidates = Object.entries(this.BaseItemsDb).filter(([_, meta]) =>
            meta.drop_level <= lvl &&
            meta.domain === "item" &&
            meta.tags.includes(tag) &&
            !meta.tags.includes("not_for_sale") &&
            this.MeetsRequirements(meta.requirements, str, dex, int)
        );

        if (!candidates.length) return null;

        // Находим максимальный drop_level среди подходящих
        const maxLevel = Math.max(...candidates.map(([_, meta]) => meta.drop_level));

        // Оставляем только предметы с максимальным уровнем
        const best = candidates.filter(([_, meta]) => meta.drop_level === maxLevel);
        const [key, meta] = best[Math.floor(Math.random() * best.length)];
        return { key, meta };
    }

    private static MeetsRequirements(
        req: any,
        str: number,
        dex: number,
        int: number
    ): boolean
    {
        if (!req) return true;
        return (req.strength ?? 0) <= str &&
            (req.dexterity ?? 0) <= dex &&
            (req.intelligence ?? 0) <= int;
    }

    // ============================================================
    // 4.2 СОЗДАНИЕ ПРЕДМЕТА
    // ============================================================

    private static CreateItem(meta: IMetaItem, rarity: EItemRarity, tag: EItemTag): Item
    {
        const icon = meta.visual_identity.dds_file.replace(/\.dds$/, '.png');
        const req = meta.requirements;

        return new Item(
            meta.name,
            meta.drop_level,
            req?.strength ?? 0,
            req?.dexterity ?? 0,
            req?.intelligence ?? 0,
            rarity,
            meta.item_class,
            tag,
            icon
        );
    }

    // ============================================================
    // 4.3 ПРИМЕНЕНИЕ БАЗОВЫХ СВОЙСТВ
    // ============================================================

    private static ApplyBaseProperties(item: Item, props: IMetaProperties): void
    {
        if (props.evasion) item.Base.set(EAffixType.EVASION, Math.floor(props.evasion.min + Math.random() * (props.evasion.max - props.evasion.min + 1)));
        if (props.energy_shield) item.Base.set(EAffixType.ES, Math.floor(props.energy_shield.min + Math.random() * (props.energy_shield.max - props.energy_shield.min + 1)));
        if (props.armour) item.Base.set(EAffixType.ARMOUR, Math.floor(props.armour.min + Math.random() * (props.armour.max - props.armour.min + 1)));
        if (props.block) item.Base.set(EAffixType.BLOCK, props.block);

        if (props.physical_damage_min) item.Base.set(EAffixType.PHYS_DAMAGE_MIN, props.physical_damage_min);
        if (props.physical_damage_max) item.Base.set(EAffixType.PHYS_DAMAGE_MAX, props.physical_damage_max);

        if (props.attack_time) item.Base.set(EAffixType.ATTACK_SPEED, Math.round((1000 / props.attack_time) * 100) / 100);
        if (props.critical_strike_chance) item.Base.set(EAffixType.CRITICAL_CHANCE, props.critical_strike_chance / 100);
        if (props.range) item.Base.set(EAffixType.ATTACK_RANGE, props.range);

        if (props.movement_speed) item.Base.set(EAffixType.MOVEMENT_SPEED, props.movement_speed);
    }

    // ============================================================
    // 4.4 ПРИМЕНЕНИЕ АФФИКСОВ
    // ============================================================

    private static ApplyImplicits(item: Item, meta: IMetaItem): void
    {
        const implicits = meta.implicits || [];

        for (const implicitKey of implicits)
        {
            const mod = this.ModsDb[implicitKey];
            if (!mod) continue;
            for (const stat of mod.stats) 
            {
                if (this.igonreStats.has(stat.id)) continue;
                item.Implicits.set(stat.id, Math.floor(stat.min + Math.random() * (stat.max - stat.min + 1)));
            }
        }
    }

    private static ApplyExplicits(item: Item, meta: IMetaItem, lvl: number, rarity: EItemRarity): void
    {
        const available = this.QueryExplicitList(meta, lvl);
        const { prefixes, suffixes } = this.ExplicitSplit(available);
        const counts = this.ExplicitCount(rarity);

        const selectedPrefixes = this.RandomExplicitList(prefixes, counts.prefixes);
        const selectedSuffixes = this.RandomExplicitList(suffixes, counts.suffixes);

        for (const { mod } of [...selectedPrefixes, ...selectedSuffixes])
        {
            for (const stat of mod.stats)
            {
                if (this.igonreStats.has(stat.id)) continue;
                if (item.Explicits.has(stat.id) || stat.max == 0) continue;
                item.Explicits.set(stat.id, Math.floor(stat.min + Math.random() * (stat.max - stat.min + 1)));
            }
        }

        this.SetItemName(item, meta, selectedPrefixes, selectedSuffixes);
    }

    private static ApplyFinals(item: Item): void
    {
        for (const [key, value] of item.Base) item.Final.set(key, value);
        for (const [key, value] of item.Implicits)
        {
            const current = item.Final.get(key) || 0;
            item.Final.set(key, current + value);
        }

        const localMod: Record<EAffixLocalType, (value: number) => void> =
        {
            [EAffixLocalType.PHYS_DAMAGE_INC]: (value) =>
            {
                let min = item.Final.get(EAffixType.PHYS_DAMAGE_MIN) || 0;
                let max = item.Final.get(EAffixType.PHYS_DAMAGE_MAX) || 0;
                if (min > 0 || max > 0)
                {
                    item.Final.set(EAffixType.PHYS_DAMAGE_MIN, Math.floor(min * (1 + value / 100)));
                    item.Final.set(EAffixType.PHYS_DAMAGE_MAX, Math.floor(max * (1 + value / 100)));
                }

                min = item.Final.get(EAffixType.ATTACK_PHYS_DAMAGE_MIN) || 0;
                max = item.Final.get(EAffixType.ATTACK_PHYS_DAMAGE_MAX) || 0;
                if (min > 0 || max > 0)
                {
                    item.Final.set(EAffixType.ATTACK_PHYS_DAMAGE_MIN, Math.floor(min * (1 + value / 100)));
                    item.Final.set(EAffixType.ATTACK_PHYS_DAMAGE_MAX, Math.floor(max * (1 + value / 100)));
                }


                min = item.Final.get(EAffixType.CAST_PHYS_MIN) || 0;
                max = item.Final.get(EAffixType.CAST_PHYS_MAX) || 0;
                if (min > 0 || max > 0)
                {
                    item.Final.set(EAffixType.CAST_PHYS_MIN, Math.floor(min * (1 + value / 100)));
                    item.Final.set(EAffixType.CAST_PHYS_MAX, Math.floor(max * (1 + value / 100)));
                }


            },

            [EAffixLocalType.PHYS_DAMAGE_MIN]: (value) =>
            {
                let min = item.Final.get(EAffixType.PHYS_DAMAGE_MIN) || 0;
                item.Final.set(EAffixType.PHYS_DAMAGE_MIN, min + value);
            },

            [EAffixLocalType.PHYS_DAMAGE_MAX]: (value) =>
            {
                let max = item.Final.get(EAffixType.PHYS_DAMAGE_MAX) || 0;
                item.Final.set(EAffixType.PHYS_DAMAGE_MIN, max + value);
            },

            [EAffixLocalType.FIRE_DAMAGE_MIN]: (value) =>
            {
                let min = item.Final.get(EAffixType.ATTACK_FIRE_DAMAGE_MIN) || 0;
                item.Final.set(EAffixType.ATTACK_FIRE_DAMAGE_MIN, min + value);
            },

            [EAffixLocalType.FIRE_DAMAGE_MAX]: (value) =>
            {
                let max = item.Final.get(EAffixType.ATTACK_FIRE_DAMAGE_MAX) || 0;
                item.Final.set(EAffixType.ATTACK_FIRE_DAMAGE_MAX, max + value);
            },

            [EAffixLocalType.COLD_DAMAGE_MIN]: (value) =>
            {
                let min = item.Final.get(EAffixType.ATTACK_COLD_DAMAGE_MIN) || 0;
                item.Final.set(EAffixType.ATTACK_COLD_DAMAGE_MIN, min + value);
            },

            [EAffixLocalType.COLD_DAMAGE_MAX]: (value) =>
            {
                let max = item.Final.get(EAffixType.ATTACK_COLD_DAMAGE_MAX) || 0;
                item.Final.set(EAffixType.ATTACK_COLD_DAMAGE_MAX, max + value);
            },

            [EAffixLocalType.LIGHT_DAMAGE_MIN]: (value) =>
            {
                let min = item.Final.get(EAffixType.ATTACK_LIGHT_DAMAGE_MIN) || 0;
                item.Final.set(EAffixType.ATTACK_LIGHT_DAMAGE_MIN, min + value);
            },

            [EAffixLocalType.LIGHT_DAMAGE_MAX]: (value) =>
            {
                let max = item.Final.get(EAffixType.ATTACK_LIGHT_DAMAGE_MAX) || 0;
                item.Final.set(EAffixType.ATTACK_LIGHT_DAMAGE_MAX, max + value);
            },

            [EAffixLocalType.ATTACK_SPEED_INC]: (value) =>
            {
                const current = item.Final.get(EAffixType.ATTACK_SPEED) || 0;
                item.Final.set(EAffixType.ATTACK_SPEED, Math.floor(current * (1 + value / 100)));
            },

            [EAffixLocalType.BLOCK]: (value) =>
            {
                const current = item.Final.get(EAffixType.BLOCK) || 0;
                item.Final.set(EAffixType.BLOCK, current + value);
            },

            [EAffixLocalType.ARMOUR]: (value) =>
            {
                const current = item.Final.get(EAffixType.ARMOUR) || 0;
                item.Final.set(EAffixType.ARMOUR, current + value);
            },

            [EAffixLocalType.ARMOUR_INC]: (value) =>
            {
                const current = item.Final.get(EAffixType.ARMOUR) || 0;
                item.Final.set(EAffixType.ARMOUR, Math.floor(current * (1 + value / 100)));
            },

            [EAffixLocalType.ARMOUR_ES_INC]: (value) =>
            {
                let current = item.Final.get(EAffixType.ARMOUR) || 0;
                item.Final.set(EAffixType.ARMOUR, Math.floor(current * (1 + value / 100)));
                current = item.Final.get(EAffixType.ES) || 0;
                item.Final.set(EAffixType.ES, Math.floor(current * (1 + value / 100)));

            },

            [EAffixLocalType.ARMOR_EVASION_INC]: (value) =>
            {
                let current = item.Final.get(EAffixType.ARMOUR) || 0;
                item.Final.set(EAffixType.ARMOUR, Math.floor(current * (1 + value / 100)));
                current = item.Final.get(EAffixType.EVASION) || 0;
                item.Final.set(EAffixType.EVASION, Math.floor(current * (1 + value / 100)));

            },

            [EAffixLocalType.EVASION]: (value) =>
            {
                const current = item.Final.get(EAffixType.EVASION) || 0;
                item.Final.set(EAffixType.EVASION, current + value);
            },

            [EAffixLocalType.EVASION_INC]: (value) =>
            {
                let current = item.Final.get(EAffixType.EVASION) || 0;
                item.Final.set(EAffixType.EVASION, Math.floor(current * (1 + value / 100)));
            },

            [EAffixLocalType.EVASION_ES_INC]: (value) =>
            {
                let current = item.Final.get(EAffixType.EVASION) || 0;
                item.Final.set(EAffixType.EVASION, Math.floor(current * (1 + value / 100)));
                current = item.Final.get(EAffixType.ES) || 0;
                item.Final.set(EAffixType.ES, Math.floor(current * (1 + value / 100)));
            },


            [EAffixLocalType.ES]: (value) =>
            {
                const current = item.Final.get(EAffixType.ES) || 0;
                item.Final.set(EAffixType.ES, current + value);
            },

            [EAffixLocalType.ES_INC]: (value) =>
            {
                const current = item.Final.get(EAffixType.ES) || 0;
                item.Final.set(EAffixType.ES, Math.floor(current * (1 + value / 100)));
            },


            [EAffixLocalType.CRITICAL_STRICE_CHANCE_INC]: (value) =>
            {
                const current = item.Final.get(EAffixType.CRITICAL_CHANCE) || 0;
                item.Final.set(EAffixType.CRITICAL_CHANCE, Math.floor(current * (1 + value / 100)));
            },

            [EAffixLocalType.ACCURACY]: (value) =>
            {
                const current = item.Final.get(EAffixType.ACCURACY) || 0;
                item.Final.set(EAffixType.ACCURACY, current + value);
            },

            [EAffixLocalType.LIGHT_PENETRATION]: (value) =>
            {
                //TODO в базовых свойствах нет LIGHT_PENETRATION
                //let min = item.Final.get(EAffixType.PHYS_DAMAGE_MIN) || 0;
                //item.Final.set(EAffixType.PHYS_DAMAGE_MIN, min + value);
            },

        };

        for (const [key, value] of item.Explicits) 
        {
            const isLocal = (Object.values(EAffixLocalType) as string[]).includes(key);
            if (!isLocal) { item.Final.set(key, value); continue; }
            localMod[key as EAffixLocalType](value);
        }
    }

    private static QueryExplicitList(meta: IMetaItem, lvl: number): [string, IMetaMod][]
    {
        return Object.entries(this.ModsDb).filter(([_, mod]) =>
            mod.required_level <= lvl &&
            mod.domain === "item" &&
            ["prefix", "suffix"].includes(mod.generation_type) &&
            !mod.is_essence_only &&
            this.HasMatchingTag(mod, meta.tags)
        );
    }

    private static HasMatchingTag(mod: IMetaMod, itemTags: string[]): boolean
    {
        if (!mod.spawn_weights?.length) return true;

        const hasValidWeight = mod.spawn_weights.some(sw => sw.weight > 0);
        if (!hasValidWeight) return false;

        return mod.spawn_weights.some(sw =>
            sw.weight > 0 && (sw.tag === "default" || itemTags.includes(sw.tag))
        );
    }

    private static ExplicitSplit(mods: [string, IMetaMod][]): { prefixes: [string, IMetaMod][]; suffixes: [string, IMetaMod][] }
    {
        return {
            prefixes: mods.filter(([_, m]) => m.generation_type === "prefix"),
            suffixes: mods.filter(([_, m]) => m.generation_type === "suffix")
        };
    }

    // ============================================================
    // 4.5 ВЫБОР АФФИКСОВ
    // ============================================================

    private static RandomExplicitList(
        explicits: [string, IMetaMod][],
        count: number
    ): { key: string; mod: IMetaMod }[]
    {
        const used = { groups: new Set<string>(), stats: new Set<string>() };
        const selected: { key: string; mod: IMetaMod }[] = [];
        let available = [...explicits];

        for (let i = 0; i < count && available.length; i++)
        {
            const compatible = available.filter(([_, m]) =>
                !m.groups?.some(g => used.groups.has(g)) &&
                !m.stats?.some(s => used.stats.has(s.id))
            );

            if (!compatible.length) break;

            const chosen = this.RandomExplicit(compatible);
            if (!chosen) break;

            chosen.mod.groups?.forEach(g => used.groups.add(g));
            chosen.mod.stats?.forEach(s => used.stats.add(s.id));

            selected.push(chosen);
            available = available.filter(([k]) => k !== chosen.key);
        }

        return selected;
    }

    private static RandomExplicit(mods: [string, IMetaMod][]): { key: string; mod: IMetaMod } | null
    {
        if (!mods.length) return null;

        const weighted = mods.map(([key, mod]) => ({
            key,
            mod,
            weight: mod.spawn_weights?.reduce((sum, sw) => sum + (sw.weight > 0 ? sw.weight : 0), 0) ?? 1000
        }));

        const valid = weighted.filter(m => m.weight > 0);
        if (!valid.length) return null;

        const total = valid.reduce((sum, m) => sum + m.weight, 0);
        let random = Math.random() * total;

        for (const { key, mod, weight } of valid)
        {
            random -= weight;
            if (random <= 0) return { key, mod };
        }

        return valid[valid.length - 1];
    }


    // ============================================================
    // 4.6 ИМЯ ПРЕДМЕТА
    // ============================================================

    private static SetItemName(
        item: Item,
        meta: IMetaItem,
        prefixes: { key: string; mod: IMetaMod }[],
        suffixes: { key: string; mod: IMetaMod }[]
    ): void
    {
        let name = meta.name || "Предмет";

        const pickRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

        if (prefixes.length)
        {
            const prefix = pickRandom(prefixes);
            name = `${prefix.mod.name} ${name}`;
        }

        if (suffixes.length)
        {
            const suffix = pickRandom(suffixes);
            name = `${name} ${suffix.mod.name}`;
        }

        item.Name = name.trim();
    }

    // ============================================================
    // 4.7 УТИЛИТЫ
    // ============================================================

    private static RandomRarity(): EItemRarity
    {
        const roll = Math.random();
        if (roll < 0.5) return EItemRarity.NORMAL;
        if (roll < 0.8) return EItemRarity.MAGIC;
        return EItemRarity.RARE;
    }

    private static ExplicitCount(rarity: EItemRarity): { prefixes: number; suffixes: number }
    {
        switch (rarity)
        {
            case EItemRarity.NORMAL: return { prefixes: 0, suffixes: 0 };
            case EItemRarity.MAGIC: return { prefixes: 1, suffixes: 1 };
            case EItemRarity.RARE: return { prefixes: 3, suffixes: 3 };
            default: return { prefixes: 0, suffixes: 0 };
        }
    }
}

// ============================================================
// 5. РЕСУРСЫ ДЛЯ UI
// ============================================================

const ICONS = {
    SPEED: '💨',
    RANGE: '⭕',
    ACCURACY: '🎯',
    CRIT: '💥',
    PHYS: '👊',
    FIRE: '🔥',
    COLD: '❄️',
    LIGHT: '⚡',
    EVASION: '🌪️',
    ES: '🔮',
    ARMOUR: '🛡️',
    MOVEMENT: "🏃",
    LIFE_REGEN: '💚',
    LIFE: '❤️',
    LIFE_PER_KILL: '💜',
    REFLECT: '🦔',
    CRIT_MULT: '✖️',
    STR: "💪",
    INT: "🧠",
    DEX: "🤸",
    STAT: "📊"
} as const;

export const ItemResources = {
    RarityNames: {
        [EItemRarity.NORMAL]: "Обычный",
        [EItemRarity.MAGIC]: "Необычный",
        [EItemRarity.RARE]: "Редкий"
    } satisfies Record<EItemRarity, string>,

    RarityClasses: {
        [EItemRarity.NORMAL]: 'common',
        [EItemRarity.MAGIC]: 'magic',
        [EItemRarity.RARE]: 'rare'
    } satisfies Record<EItemRarity, string>,


    Labels: {
        ATTACK_RANGE: 'Радиус атаки',
        ATTACK_TIME: 'Скорость атаки',
        PHYSICAL_DAMAGE: "Урон физой",
        FIRE_DAMAGE: "Урон огнем",
        COLD_DAMAGE: "Урон холодом",
        LIGHT_DAMAGE: "Урон молнией",
        CRITICAL_CHANCE: 'Крит. шанс',
        ARMOUR: 'Броня',
        EVASION: 'Уклонение',
        ES: 'Энергощит'
    },

    AffixIcons: {
        [EAffixType.STR]: ICONS.STR,
        [EAffixType.INT]: ICONS.INT,
        [EAffixType.DEX]: ICONS.DEX,
        [EAffixType.ATTRIBUTES]: ICONS.STAT,
        [EAffixType.ATTRIBUTES_INC]: ICONS.STAT,

        [EAffixType.LIFE_MAX]: ICONS.LIFE,
        [EAffixType.LIFE_MAX_INC]: ICONS.LIFE,
        [EAffixType.LIFE_PER_KILL]: ICONS.LIFE_PER_KILL,
        [EAffixType.LIFE_PER_MINUTE_FLAT]: ICONS.LIFE_REGEN,
        [EAffixType.LIFE_PER_MINUTE_PERC]: ICONS.LIFE_REGEN,

        [EAffixType.FIRE_RES]: ICONS.FIRE,
        [EAffixType.COLD_RES]: ICONS.COLD,
        [EAffixType.LIGHT_RES]: ICONS.LIGHT,

        [EAffixType.PHYS_DAMAGE_INC]: ICONS.PHYS,
        [EAffixType.PHYS_DAMAGE_MIN]: ICONS.PHYS,
        [EAffixType.ATTACK_PHYS_DAMAGE_MIN]: ICONS.PHYS,

        [EAffixType.ATTACK_COLD_DAMAGE_MIN]: ICONS.COLD,
        [EAffixType.COLD_DAMAGE_INC]: ICONS.COLD,

        [EAffixType.ATTACK_FIRE_DAMAGE_MIN]: ICONS.FIRE,
        [EAffixType.CAST_FIRE_MIN]: ICONS.FIRE,

        [EAffixType.LIGHT_DAMAGE_INC]: ICONS.LIGHT,
        [EAffixType.ATTACK_LIGHT_DAMAGE_MIN]: ICONS.LIGHT,

        [EAffixType.ATTACK_SPEED]: ICONS.SPEED,
        [EAffixType.ATTACK_SPEED_INC]: ICONS.SPEED,
        [EAffixType.CAST_SPEED_INC]: ICONS.SPEED,
        [EAffixType.ATTACK_RANGE]: ICONS.RANGE,
        [EAffixType.ATTACK_PHYS_REFLECT]: ICONS.REFLECT,
        [EAffixType.ACCURACY]: ICONS.ACCURACY,
        [EAffixType.CRITICAL_CHANCE]: ICONS.CRIT,
        [EAffixType.CRITICAL_CHANCE_ADD]: ICONS.CRIT,

        [EAffixType.EVASION]: ICONS.EVASION,
        [EAffixType.EVASION_ADD]: ICONS.EVASION,
        [EAffixType.EVASION_INC]: ICONS.EVASION,

        [EAffixType.ES]: ICONS.ES,
        [EAffixType.ES_ADD]: ICONS.ES,

        [EAffixType.MOVEMENT_SPEED]: ICONS.MOVEMENT,
        [EAffixType.MOVEMENT_SPEED_INC]: ICONS.MOVEMENT,

        [EAffixType.ARMOUR]: ICONS.ARMOUR,
        [EAffixType.AMROUR_ADD]: ICONS.ARMOUR,
        [EAffixType.STUN_REDUCTION]: ICONS.ARMOUR,
        [EAffixType.PHYS_REDUCTION]: ICONS.ARMOUR,
        [EAffixType.PHYS_REDUCTION_INC]: ICONS.ARMOUR
    } as Record<string, string>,

    AffixLabels: {

        //атрибуты
        [EAffixType.STR]: "Сила",
        [EAffixType.DEX]: "Ловкость",
        [EAffixType.INT]: "Интеллект",
        [EAffixType.STR_DEX]: "Сила и ловкость",
        [EAffixType.STR_INT]: "Сила и интеллект",
        [EAffixType.DEX_INT]: "Ловкость и интеллект",
        [EAffixType.ATTRIBUTES]: "Все атрибуты",
        [EAffixType.ATTRIBUTES_INC]: "Повышение атрибутов",

        [EAffixType.ACCURACY]: 'Метксоть',
        [EAffixType.ACCURACY_INC]: 'Повышение метксоти',
        [EAffixLocalType.ACCURACY]: "Метксоть",

        [EAffixType.ATTACK_RANGE]: 'Радиус атаки',
        [EAffixType.ATTACK_RANGE_INC]: 'Повышение радиуса атаки',

        [EAffixType.STUN_INC]: 'Шанс оглушения',
        [EAffixType.STUN_REDUCTION]: "Порог оглушения",


        //общий урон
        [EAffixType.CRITICAL_CHANCE]: 'Крит. шанс',
        [EAffixType.CRITICAL_CHANCE_ADD]: 'Крит. шанс',
        [EAffixType.CRITICAL_CHANCE_INC]: 'Повышение крит. шанса',
        [EAffixType.CRITICAL_CHANCE_MLT]: "Множитель крит.урона",

        [EAffixType.ELEMENT_DAMAGE_INC]: "Повышение элементального урона",
        [EAffixType.DAMAGE_INC]: "Повышение урона",

        [EAffixType.PHYS_DAMAGE_MIN]: "Урон физой",
        [EAffixType.PHYS_DAMAGE_MAX]: "Урон физой",


        [EAffixType.PHYS_DAMAGE_INC]: "Повышение урона физой",
        [EAffixType.FIRE_DAMAGE_INC]: "Повышение урона огнем",
        [EAffixType.COLD_DAMAGE_INC]: "Повышение урона холодом",
        [EAffixType.LIGHT_DAMAGE_INC]: "Повышение урона молнией",

        [EAffixType.ATTACK_PHYS_REFLECT]: "Отражение физического урона от атак",
        [EAffixType.ATTACK_CAST_SPEED_INC]: 'Повышение скорости атаки и каста',

        //урон атаками
        [EAffixType.ATTACK_SPEED]: 'Скорость атаки',
        [EAffixType.ATTACK_SPEED_INC]: 'Повышение скорости атаки',
        [EAffixType.ATTACK_PHYS_DAMAGE_MIN]: "Урон физой",
        [EAffixType.ATTACK_PHYS_DAMAGE_MAX]: "Урон физой",
        [EAffixType.ATTACK_FIRE_DAMAGE_MIN]: "Урон огнем",
        [EAffixType.ATTACK_FIRE_DAMAGE_MAX]: "Урон огнем",
        [EAffixType.ATTACK_COLD_DAMAGE_MIN]: "Урон холодом",
        [EAffixType.ATTACK_COLD_DAMAGE_MAX]: "Урон холодом",
        [EAffixType.ATTACK_LIGHT_DAMAGE_MIN]: "Урон молнией",
        [EAffixType.ATTACK_LIGHT_DAMAGE_MAX]: "Урон молнией",

        // урон магией
        [EAffixType.CAST_DAMAGE_INC]: "Повышение урона",
        [EAffixType.CAST_SPEED_INC]: 'Скорость каста',
        [EAffixType.CAST_PHYS_MIN]: 'Урон физической магии',
        [EAffixType.CAST_PHYS_MAX]: 'Урон физической магии',
        [EAffixType.CAST_COLD_MIN]: 'Урон магии холода',
        [EAffixType.CAST_COLD_MAX]: 'Урон магии холода',
        [EAffixType.CAST_FIRE_MIN]: 'Урон магии огня',
        [EAffixType.CAST_FIRE_MAX]: 'Урон магии огня',
        [EAffixType.CAST_LIGHT_MIN]: 'Урон магии грома',
        [EAffixType.CAST_LIGHT_MAX]: 'Урон магии грома',

        // защита
        [EAffixType.BLOCK]: 'Шанс блока',
        [EAffixType.PHYS_REDUCTION]: 'Снижение получаемого физического урона',
        [EAffixType.PHYS_REDUCTION_INC]: 'Снижение получаемого физического урона %',
        [EAffixType.DEFENCE_INC]: 'Повышение защиты',
        [EAffixType.ARMOUR]: 'Броня',
        [EAffixType.AMROUR_ADD]: 'Броня',
        [EAffixType.EVASION]: 'Уклонение',
        [EAffixType.EVASION_ADD]: 'Уклонение',
        [EAffixType.EVASION_INC]: 'Повышение уклонения',

        [EAffixType.ES]: 'Энергощит',
        [EAffixType.ES_ADD]: 'Энергощит',

        [EAffixType.FIRE_RES]: 'Сопротивление огню',
        [EAffixType.COLD_RES]: 'Сопротивление холоду',
        [EAffixType.LIGHT_RES]: 'Сопротивление молнии',

        [EAffixType.MOVEMENT_SPEED]: 'Передвижение',
        [EAffixType.MOVEMENT_SPEED_INC]: 'Повышение скорости передвижения',

        [EAffixType.LIFE_MAX]: "Здоровье",
        [EAffixType.LIFE_MAX_INC]: "Повышение здоровья",
        [EAffixType.LIFE_PER_MINUTE_FLAT]: "Регенерация здоровья в минуту",
        [EAffixType.LIFE_PER_MINUTE_PERC]: "Регенерация здоровья в минуту от макс.здоровья",

        [EAffixType.LIFE_PER_KILL]: "Здоровье за убийство",

        //локальные модификаторы
        [EAffixLocalType.CRITICAL_STRICE_CHANCE_INC]: 'Повышенный крит.шанс',
        [EAffixLocalType.PHYS_DAMAGE_MIN]: "Урон физой",
        [EAffixLocalType.PHYS_DAMAGE_MAX]: "Урон физой",
        [EAffixLocalType.PHYS_DAMAGE_INC]: "Повышенный урон физой",
        [EAffixLocalType.FIRE_DAMAGE_MIN]: "Урон огнем",
        [EAffixLocalType.FIRE_DAMAGE_MAX]: "Урон огнем",
        [EAffixLocalType.COLD_DAMAGE_MIN]: "Урон холодлом",
        [EAffixLocalType.COLD_DAMAGE_MAX]: "Урон холодлом",
        [EAffixLocalType.LIGHT_DAMAGE_MIN]: "Урон молнией",
        [EAffixLocalType.LIGHT_DAMAGE_MAX]: "Урон молнией",
        [EAffixLocalType.LIGHT_PENETRATION]: "Пробивание сопротивлению молнии",
        [EAffixLocalType.ATTACK_SPEED_INC]: 'Повышена скорости атаки',
        [EAffixLocalType.BLOCK]: 'Шанс блока',
        [EAffixLocalType.ARMOUR]: 'Броня',
        [EAffixLocalType.ARMOUR_INC]: 'Повышенная брони',
        [EAffixLocalType.ARMOUR_ES_INC]: 'Повышеные броня и энергощит',
        [EAffixLocalType.ARMOR_EVASION_INC]: 'Повышеные броня и уклонение',
        [EAffixLocalType.EVASION]: 'Уклонение',
        [EAffixLocalType.EVASION_INC]: 'Повышено уклонение',
        [EAffixLocalType.EVASION_ES_INC]: 'Повышенные уклонение и энергощит',
        [EAffixLocalType.ES]: 'Энергощит',
        [EAffixLocalType.ES_INC]: 'Повышен энергощит',


    } satisfies Record<EAffixLocalType | EAffixType, string>

};

// ============================================================
// 6. ЗАГРУЗКА
// ============================================================

ItemFactory.LoadDB();

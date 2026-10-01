import { IComponent, System, Ticker, World } from "./core";
import { EAffixType } from "./items";
import { EEquipSlot, EquipmentComponent, EquipmentService } from "./equipment";
import { HealthComponent } from "./health";
import { UserComponent } from "./user";
import { GameStateComponent, EGameState, GameStateService } from "./gamestate";
import { BonusComponent, IBonus, IBonusEffect, EBonusMod, EBonusType } from "./bonuses";
import { UIDialog } from "./dialog";

//#region ФИЧА: статы

export const StatIcons = {
    // Характеристики
    Str: "💪",
    Dex: "🤸",
    Int: "🧠",

    // Оглушение
    StunInc: "💫",
    StunReduction: "🌀",

    // Жизнь и регенерация
    LifeMax: "❤️",
    LifePerSecond: "💚",
    LifePerKill: "💜",

    // Защита
    PhysReflect: "🦔",
    PhysReduction: "🛡️",
    Armour: "🛡️",
    Evasion: "🌪️",
    ES: "🔮",
    Block: "🛡️",

    // Сопротивления
    FireResist: "🔥",
    ColdResist: "❄️",
    LightResist: "⚡",

    // Урон (физический и стихии)
    PhysicalDamageMin: "👊",
    PhysicalDamageMax: "👊",
    FireDamageMin: "🔥",
    FireDamageMax: "🔥",
    ColdDamageMin: "❄️",
    ColdDamageMax: "❄️",
    LightDamageMin: "⚡",
    LightDamageMax: "⚡",

    // Скорость и точность
    AttackSpeed: "💨",
    AttackRange: "⭕",
    MovementSpeed: "🏃",
    Accuracy: "🎯",
    CriticalChance: "💥",
    CriticalMultiplier: "✖️"
} as Record<string, string>

/**
 * Финальные статы персонажа/существа. Только результат вычислений.
 * Не содержит плоских и процентных модификаторов — они живут в RawStats.
 */
export interface IEntityStats
{
    // Характеристики
    Str: number;
    Dex: number;
    Int: number;

    // Оглушение
    StunInc: number;
    StunReduction: number;

    // Жизнь и регенерация
    LifeMax: number;
    LifePerSecond: number;
    LifePerKill: number;

    // Защита
    PhysReflect: number;
    PhysReduction: number;
    Armour: number;
    Evasion: number;
    ES: number;
    ESRegenDelay: number;
    ESRegenRate: number;
    Block: number;

    // Сопротивления
    FireResist: number;
    ColdResist: number;
    LightResist: number;

    // Урон (физический и стихии)
    PhysicalDamageMin: number;
    PhysicalDamageMax: number;
    FireDamageMin: number;
    FireDamageMax: number;
    ColdDamageMin: number;
    ColdDamageMax: number;
    LightDamageMin: number;
    LightDamageMax: number;

    // Скорость и точность
    AttackSpeed: number;
    AttackRange: number;
    MovementSpeed: number;
    Accuracy: number;
    CriticalChance: number;
    CriticalMultiplier: number;
}

export class RawStats
{
    // Первичные характеристики
    Str = 0; Dex = 0; Int = 0;
    Attributes = 0;
    AttributesInc = 0;
    //Оглушение
    StunInc = 0;
    StunReduction = 0;

    // Жизнь
    LifeMaxFlat = 0;
    LifeMaxInc = 0;
    LifePerSecondFlat = 0;
    LifePerMinuteFlat = 0;
    LifePerMinutePerc = 0;
    LifePerKillFlat = 0;

    // Защита
    PhysReflectFlat = 0;
    PhysReflectInc = 0;
    PhysReduction = 0;
    PhysReductionInc = 0;
    DefenceInc = 0;
    ArmourFlat = 0;
    ArmourAdd = 0;
    ArmourInc = 0;
    EvasionFlat = 0;
    EvasionAdd = 0;
    EvasionInc = 0;
    EsFlat = 0;
    EsAdd = 0;
    EsInc = 0;
    EsRegenDelay = 0;
    EsRegenRate = 0;
    Block = 0;

    // Сопротивления
    FireResFlat = 0;
    ColdResFlat = 0;
    LightResFlat = 0;

    // Урон
    DamageInc = 0;
    ElementDamageInc = 0;
    PhysMinFlat = 0; PhysMaxFlat = 0; PhysInc = 0;
    FireMinFlat = 0; FireMaxFlat = 0; FireInc = 0;
    ColdMinFlat = 0; ColdMaxFlat = 0; ColdInc = 0;
    LightMinFlat = 0; LightMaxFlat = 0; LightInc = 0;

    // Урон магией
    CastSpeedFlat = 0;
    CastSpeedInc = 0;
    CastDamageInc = 0;

    // Скорость и крит
    AttackSpeedFlat = 0;
    AttackSpeedInc = 0;
    AttackRangeFlat = 0;
    AttackRangeInc = 0;
    AccuracyFlat = 0;
    AccuracyInc = 0;
    CritChanceFlat = 0;
    CritChanceAddFlat = 0;
    CritChanceInc = 0;
    CritMultiplierFlat = 0;
    MoveSpeedFlat = 0;
    MoveSpeedInc = 0;

    public Add(other: Partial<RawStats>): void
    {
        for (const key of Object.keys(other) as (keyof RawStats)[])
        {
            const v = other[key];
            if (typeof v === "number") (this[key] as number) += v;
        }
    }
}

export class EntityStatsService
{
    public static Default(): IEntityStats
    {
        return {
            Str: 0, Dex: 0, Int: 0,
            StunInc: 0, StunReduction: 0,
            LifeMax: 0, LifePerSecond: 0, LifePerKill: 0,
            Armour: 0, Evasion: 0,
            ES: 0, ESRegenDelay: 5, ESRegenRate: 10,
            Block: 0,
            PhysReflect: 0,
            PhysReduction: 0,
            FireResist: 0, ColdResist: 0, LightResist: 0,
            PhysicalDamageMin: 0, PhysicalDamageMax: 0,
            FireDamageMin: 0, FireDamageMax: 0,
            ColdDamageMin: 0, ColdDamageMax: 0,
            LightDamageMin: 0, LightDamageMax: 0,
            AttackSpeed: 0, AttackRange: 0, MovementSpeed: 0,
            Accuracy: 20, CriticalChance: 0, CriticalMultiplier: 2
        };
    }


    public static Resolve(raw: RawStats, base: IEntityStats): IEntityStats
    {
        const s: IEntityStats = { ...base };

        // ─── 1) Первичные характеристики ───
        s.Str = (base.Str + raw.Str + raw.Attributes) * (1 + raw.AttributesInc / 100);
        s.Dex = (base.Dex + raw.Dex + raw.Attributes) * (1 + raw.AttributesInc / 100);
        s.Int = (base.Int + raw.Int + raw.Attributes) * (1 + raw.AttributesInc / 100);


        // ─── 3) Жизнь ───
        const lifeFromStr = s.Str * 2;
        s.LifeMax = (base.LifeMax + raw.LifeMaxFlat) * (1 + raw.LifeMaxInc / 100) + lifeFromStr;
        s.LifePerSecond = base.LifePerSecond + raw.LifePerSecondFlat + raw.LifePerMinuteFlat / 60 + (raw.LifePerMinutePerc / 100 * s.LifeMax) / 60;
        s.LifePerKill = base.LifePerKill + raw.LifePerKillFlat;

        // ─── 4) Защита ───
        const armInc = raw.ArmourInc + raw.DefenceInc;
        s.Armour = (base.Armour + raw.ArmourFlat + raw.ArmourAdd) * (1 + armInc / 100);

        const evInc = raw.EvasionInc + raw.DefenceInc;
        s.Evasion = (base.Evasion + raw.EvasionFlat + raw.EvasionAdd) * (1 + evInc / 100);

        const hasEnergyShield = (base.ES + raw.EsFlat + raw.EsAdd) > 0;
        const esFromIntPercent = hasEnergyShield ? s.Int / 5 : 0;  // 5 int = +1% ES
        const esInc = raw.EsInc + raw.DefenceInc + esFromIntPercent;
        s.ES = (base.ES + raw.EsFlat + raw.EsAdd) * (1 + esInc / 100);

        s.PhysReduction = (base.PhysReduction + raw.PhysReduction) + (1 + raw.PhysReductionInc / 100);
        s.Block = base.Block + raw.Block;

        const reflectInc = raw.PhysReflectInc;
        s.PhysReflect = (base.PhysReflect + raw.PhysReflectFlat) * (1 + reflectInc / 100);

        // ─── 5) Сопротивления ───
        s.FireResist = base.FireResist + raw.FireResFlat;
        s.ColdResist = base.ColdResist + raw.ColdResFlat;
        s.LightResist = base.LightResist + raw.LightResFlat;

        // ─── 6) Урон ───
        const physInc = raw.DamageInc + raw.CastDamageInc + raw.PhysInc;
        s.PhysicalDamageMin = (base.PhysicalDamageMin + raw.PhysMinFlat) * (1 + physInc / 100);
        s.PhysicalDamageMax = (base.PhysicalDamageMax + raw.PhysMaxFlat) * (1 + physInc / 100);

        const fireInc = raw.DamageInc + raw.CastDamageInc + raw.ElementDamageInc + raw.FireInc;
        s.FireDamageMin = (base.FireDamageMin + raw.FireMinFlat) * (1 + fireInc / 100);
        s.FireDamageMax = (base.FireDamageMax + raw.FireMaxFlat) * (1 + fireInc / 100);

        const coldInc = raw.DamageInc + raw.CastDamageInc + raw.ElementDamageInc + raw.ColdInc;
        s.ColdDamageMin = (base.ColdDamageMin + raw.ColdMinFlat) * (1 + coldInc / 100);
        s.ColdDamageMax = (base.ColdDamageMax + raw.ColdMaxFlat) * (1 + coldInc / 100);

        const lightInc = raw.DamageInc + raw.CastDamageInc + raw.ElementDamageInc + raw.LightInc;
        s.LightDamageMin = (base.LightDamageMin + raw.LightMinFlat) * (1 + lightInc / 100);
        s.LightDamageMax = (base.LightDamageMax + raw.LightMaxFlat) * (1 + lightInc / 100);

        // ─── 7) Скорость, крит, точность ───
        const attackSpeedInc = raw.AttackSpeedInc + raw.CastDamageInc;
        const attackSpeedFlat = base.AttackSpeed + raw.AttackSpeedFlat + raw.CastSpeedFlat;
        s.AttackSpeed = attackSpeedFlat * (1 + attackSpeedInc / 100);
        s.AttackRange = (base.AttackRange + raw.AttackRangeFlat) * (1 + raw.AttackRangeInc / 100);;
        s.MovementSpeed = (base.MovementSpeed + raw.MoveSpeedFlat) * (1 + raw.MoveSpeedInc / 100);

        const accFromDex = s.Dex * 2;
        s.Accuracy = (base.Accuracy + raw.AccuracyFlat) * (1 + raw.AccuracyInc / 100) + accFromDex;

        s.CriticalChance = (base.CriticalChance + raw.CritChanceFlat + raw.CritChanceAddFlat) * (1 + raw.CritChanceInc / 100);;
        s.CriticalMultiplier = base.CriticalMultiplier + raw.CritMultiplierFlat;

        // ─── Оглушение ───
        s.StunInc = base.StunInc + raw.StunInc;
        s.StunReduction = base.StunReduction + raw.StunReduction;

        return s;
    }


    public static AffixToRaw(type: EAffixType, value: number): Partial<RawStats>
    {
        type AffixMapper = (value: number) => Partial<RawStats>;
        const map: Record<EAffixType, AffixMapper> =
        {
            // ─── Характеристики ───
            [EAffixType.STR]: (v) => ({ Str: v }),
            [EAffixType.DEX]: (v) => ({ Dex: v }),
            [EAffixType.INT]: (v) => ({ Int: v }),
            [EAffixType.STR_DEX]: (v) => ({ Str: v, Dex: v }),
            [EAffixType.STR_INT]: (v) => ({ Str: v, Int: v }),
            [EAffixType.DEX_INT]: (v) => ({ Dex: v, Int: v }),
            [EAffixType.ATTRIBUTES]: (v) => ({ Attributes: v }),
            [EAffixType.ATTRIBUTES_INC]: (v) => ({ AttributesInc: v }),

            // ─── Оглушение ───
            [EAffixType.STUN_INC]: (v) => ({ StunInc: v }),
            [EAffixType.STUN_REDUCTION]: (v) => ({ StunReduction: v }),

            // ─── Жизнь ───
            [EAffixType.LIFE_MAX]: (v) => ({ LifeMaxFlat: v }),
            [EAffixType.LIFE_MAX_INC]: (v) => ({ LifeMaxInc: v }),
            [EAffixType.LIFE_PER_MINUTE_FLAT]: (v) => ({ LifePerMinuteFlat: v }),
            [EAffixType.LIFE_PER_MINUTE_PERC]: (v) => ({ LifePerMinutePerc: v }),

            [EAffixType.LIFE_PER_KILL]: (v) => ({ LifePerKillFlat: v }),

            // ─── Защита ───

            [EAffixType.PHYS_REDUCTION]: (v) => ({ PhysReduction: v }),
            [EAffixType.PHYS_REDUCTION_INC]: (v) => ({ PhysReductionInc: v }),
            [EAffixType.DEFENCE_INC]: (v) => ({ DefenceInc: v }),
            [EAffixType.ARMOUR]: (v) => ({ ArmourFlat: v }),
            [EAffixType.AMROUR_ADD]: (v) => ({ ArmourAdd: v }),
            [EAffixType.EVASION]: (v) => ({ EvasionFlat: v }),
            [EAffixType.EVASION_ADD]: (v) => ({ EvasionAdd: v }),
            [EAffixType.EVASION_INC]: (v) => ({ EvasionInc: v }),
            [EAffixType.ES]: (v) => ({ EsFlat: v }),
            [EAffixType.ES_ADD]: (v) => ({ EsAdd: v }),
            [EAffixType.BLOCK]: (v) => ({ Block: v }),

            // ─── Сопротивления ───
            [EAffixType.FIRE_RES]: (v) => ({ FireResFlat: v }),
            [EAffixType.COLD_RES]: (v) => ({ ColdResFlat: v }),
            [EAffixType.LIGHT_RES]: (v) => ({ LightResFlat: v }),

            // ─── Глобальный урон ───
            [EAffixType.DAMAGE_INC]: (v) => ({ DamageInc: v }),
            [EAffixType.ELEMENT_DAMAGE_INC]: (v) => ({ ElementDamageInc: v }),
            [EAffixType.CAST_DAMAGE_INC]: (v) => ({ CastDamageInc: v }),

            // ─── Физический урон ───
            [EAffixType.ATTACK_PHYS_REFLECT]: (v) => ({ PhysReflectFlat: v }),
            [EAffixType.PHYS_DAMAGE_MIN]: (v) => ({ PhysMinFlat: v }),
            [EAffixType.PHYS_DAMAGE_MAX]: (v) => ({ PhysMaxFlat: v }),
            [EAffixType.ATTACK_PHYS_DAMAGE_MIN]: (v) => ({ PhysMinFlat: v }),
            [EAffixType.ATTACK_PHYS_DAMAGE_MAX]: (v) => ({ PhysMaxFlat: v }),
            [EAffixType.PHYS_DAMAGE_INC]: (v) => ({ PhysInc: v }),

            [EAffixType.CAST_PHYS_MIN]: (v) => ({ PhysMinFlat: v }),
            [EAffixType.CAST_PHYS_MAX]: (v) => ({ PhysMaxFlat: v }),

            // ─── Огонь ───
            [EAffixType.ATTACK_FIRE_DAMAGE_MIN]: (v) => ({ FireMinFlat: v }),
            [EAffixType.ATTACK_FIRE_DAMAGE_MAX]: (v) => ({ FireMaxFlat: v }),
            [EAffixType.CAST_FIRE_MIN]: (v) => ({ FireMinFlat: v }),
            [EAffixType.CAST_FIRE_MAX]: (v) => ({ FireMaxFlat: v }),
            [EAffixType.FIRE_DAMAGE_INC]: (v) => ({ FireInc: v }),

            // ─── Холод ───
            [EAffixType.ATTACK_COLD_DAMAGE_MIN]: (v) => ({ ColdMinFlat: v }),
            [EAffixType.ATTACK_COLD_DAMAGE_MAX]: (v) => ({ ColdMaxFlat: v }),
            [EAffixType.CAST_COLD_MIN]: (v) => ({ ColdMinFlat: v }),
            [EAffixType.CAST_COLD_MAX]: (v) => ({ ColdMaxFlat: v }),
            [EAffixType.COLD_DAMAGE_INC]: (v) => ({ ColdInc: v }),


            // ─── Молния ───
            [EAffixType.ATTACK_LIGHT_DAMAGE_MIN]: (v) => ({ LightMinFlat: v }),
            [EAffixType.ATTACK_LIGHT_DAMAGE_MAX]: (v) => ({ LightMaxFlat: v }),
            [EAffixType.CAST_LIGHT_MIN]: (v) => ({ LightMinFlat: v }),
            [EAffixType.CAST_LIGHT_MAX]: (v) => ({ LightMaxFlat: v }),
            [EAffixType.LIGHT_DAMAGE_INC]: (v) => ({ LightInc: v }),

            // ─── Скорость и крит ───
            [EAffixType.ATTACK_CAST_SPEED_INC]: (v) => ({ AttackSpeedInc: v, CastSpeedInc: v }),
            [EAffixType.ATTACK_SPEED]: (v) => ({ AttackSpeedFlat: v }),
            [EAffixType.ATTACK_SPEED_INC]: (v) => ({ AttackSpeedInc: v }),
            [EAffixType.ATTACK_RANGE]: (v) => ({ AttackRangeFlat: v }),
            [EAffixType.ATTACK_RANGE_INC]: (v) => ({ AttackRangeInc: v }),
            [EAffixType.CAST_SPEED_INC]: (v) => ({ CastSpeedInc: v }),
            [EAffixType.CRITICAL_CHANCE]: (v) => ({ CritChanceFlat: v }),
            [EAffixType.CRITICAL_CHANCE_ADD]: (v) => ({ CritChanceAddFlat: v }),
            [EAffixType.CRITICAL_CHANCE_INC]: (v) => ({ CritChanceInc: v }),
            [EAffixType.CRITICAL_CHANCE_MLT]: (v) => ({ CritMultiplierFlat: v }),
            [EAffixType.ACCURACY]: (v) => ({ AccuracyFlat: v }),
            [EAffixType.ACCURACY_INC]: (v) => ({ AccuracyInc: v }),
            [EAffixType.MOVEMENT_SPEED]: (v) => ({ MoveSpeedFlat: v }),
            [EAffixType.MOVEMENT_SPEED_INC]: (v) => ({ MoveSpeedInc: v })
        };

        if (!map[type]) 
        {
            console.warn(`Нет маппинга для ${type}`);
            return {}
        }

        return map[type](value);
    }

    public static BonusToRaw(bonus: IBonus): Partial<RawStats>
    {
        const effectToRawMap: Record<EBonusType, (e: IBonusEffect) => Partial<RawStats>> =
        {
            // Характеристики
            Str: (e) => ({ Str: e.Value }),
            Dex: (e) => ({ Dex: e.Value }),
            Int: (e) => ({ Int: e.Value }),

            // Оглушение: percentPoint → аддитивные %, percent → множитель
            StunInc: (e) => e.Mod === EBonusMod.PERCENT_POINT ? { StunInc: e.Value } : { StunIncPerc: e.Value },
            StunReduction: (e) => e.Mod === EBonusMod.PERCENT_POINT ? { StunReduction: e.Value } : { StunReductionPerc: e.Value },

            // Жизнь
            LifeMax: (e) => e.Mod === EBonusMod.FLAT ? { LifeMaxFlat: e.Value } : { LifeMaxInc: e.Value },
            LifePerSecond: (e) => ({ LifePerSecondFlat: e.Value }),
            LifePerKill: (e) => ({ LifePerKillFlat: e.Value }),

            // Защита
            PhysReflect: (e) => e.Mod === EBonusMod.PERCENT ? { PhysReflectInc: e.Value } : { PhysReflectFlat: e.Value },
            PhysReduction: (e) => e.Mod === EBonusMod.PERCENT ? { PhysReductionInc: e.Value } : { PhysReduction: e.Value },
            Armour: (e) => e.Mod === EBonusMod.PERCENT ? { ArmourInc: e.Value } : { ArmourFlat: e.Value },
            Evasion: (e) => e.Mod === EBonusMod.PERCENT ? { EvasionInc: e.Value } : { EvasionFlat: e.Value },
            ES: (e) => e.Mod === EBonusMod.PERCENT ? { EsInc: e.Value } : { EsFlat: e.Value },
            ESRegenDelay: (e) => ({ EsRegenDelay: e.Value }),
            ESRegenRate: (e) => ({ EsRegenRate: e.Value }),
            Block: (e) => e.Mod === EBonusMod.PERCENT_POINT ? { Block: e.Value } : { BlockInc: e.Value },

            // Сопротивления
            FireResist: (e) => ({ FireResFlat: e.Value }),
            ColdResist: (e) => ({ ColdResFlat: e.Value }),
            LightResist: (e) => ({ LightResFlat: e.Value }),

            // Урон (групповые)
            PhysDamage: (e) => e.Mod === EBonusMod.PERCENT ? { PhysInc: e.Value } : { PhysMinFlat: e.Value, PhysMaxFlat: e.Value },
            FireDamage: (e) => e.Mod === EBonusMod.PERCENT ? { FireInc: e.Value } : { FireMinFlat: e.Value, FireMaxFlat: e.Value },
            ColdDamage: (e) => e.Mod === EBonusMod.PERCENT ? { ColdInc: e.Value } : { ColdMinFlat: e.Value, ColdMaxFlat: e.Value },
            LightDamage: (e) => e.Mod === EBonusMod.PERCENT ? { LightInc: e.Value } : { LightMinFlat: e.Value, LightMaxFlat: e.Value },

            // Скорость / крит
            AttackSpeed: (e) => e.Mod === EBonusMod.PERCENT ? { AttackSpeedInc: e.Value } : { AttackSpeedFlat: e.Value },
            AttackRange: (e) => ({ AttackRangeInc: e.Value }),
            MovementSpeed: (e) => e.Mod === EBonusMod.PERCENT ? { MoveSpeedInc: e.Value } : { MoveSpeedFlat: e.Value },
            Accuracy: (e) => ({ AccuracyFlat: e.Value }),
            CriticalChance: (e) => e.Mod === EBonusMod.PERCENT_POINT ? { CritChanceAddFlat: e.Value } : { CritChanceFlat: e.Value },
            CriticalMultiplier: (e) => ({ CritMultiplierFlat: e.Value }),
        }


        const raw: Partial<RawStats> = { ...effectToRawMap[bonus.Primary.Type](bonus.Primary) };

        // ─── Применяем Secondary (если есть) ───
        if (bonus.Secondary)
        {
            const sec = effectToRawMap[bonus.Secondary.Type](bonus.Secondary);
            for (const key of Object.keys(sec) as (keyof RawStats)[])
            {
                const v = sec[key];
                if (typeof v === "number") (raw[key] as number) = ((raw[key] as number) ?? 0) + v;
            }
        }

        return raw;
    }

}


export class EntityStatsComponent implements IComponent 
{
    public Final: IEntityStats = EntityStatsService.Default()
    constructor(public Base: IEntityStats) { }
}

class EntityStatsSystem implements System
{

    Update(deltaTime: number): void
    {
        const gameState = World.SingleComponent(GameStateComponent)!.GameState;
        if (gameState.State == EGameState.PAUSE || gameState.State == EGameState.OVER) return;

        const entityList = World.EntityQuery(EntityStatsComponent);
        for (const entity of entityList)
        {
            const stats = World.GetComponent(entity, EntityStatsComponent)!;
            stats.Final = EntityStatsService.Resolve(this.CollectRaw(entity), stats.Base);
        }
    }

    //собирает плюшки со всех источников во временную структуру статов
    private CollectRaw(entity: number): RawStats
    {
        const raw = new RawStats();

        const bonuses = World.GetComponent(entity, BonusComponent);
        for (const b of bonuses?.List ?? []) raw.Add(EntityStatsService.BonusToRaw(b));

        const equipment = World.GetComponent(entity, EquipmentComponent);
        if (!equipment) return raw;

        const itemList = EquipmentService.All(equipment.Equipment);
        for (const item of itemList) for (const [type, value] of item.Final) raw.Add(EntityStatsService.AffixToRaw(type as EAffixType, value));

        return raw;
    }

}

//#endregion


class UI
{
    // ─────────────────────────────────────────────────────────
    // DOM-элементы панели статов
    // ─────────────────────────────────────────────────────────

    // ─── Оружие ───
    private readonly weaponName: HTMLElement;

    // ─── Урон ───
    private readonly physDmg: HTMLElement;
    private readonly fireDmg: HTMLElement;
    private readonly coldDmg: HTMLElement;
    private readonly lightDmg: HTMLElement;

    // ─── Атака ───
    private readonly attackSpeed: HTMLElement;
    private readonly attackRange: HTMLElement;
    private readonly accuracy: HTMLElement;
    private readonly critChance: HTMLElement;
    private readonly critMult: HTMLElement;
    private readonly stunInc: HTMLElement;

    // ─── Характеристики ───
    private readonly str: HTMLElement;
    private readonly dex: HTMLElement;
    private readonly int: HTMLElement;

    // ─── Жизнь ───
    private readonly hp: HTMLElement;
    private readonly regen: HTMLElement;
    private readonly lifePerKill: HTMLElement;

    // ─── Передвижение ───
    private readonly speed: HTMLElement;

    // ─── Защита ───
    private readonly es: HTMLElement;
    private readonly armor: HTMLElement;
    private readonly physReduction: HTMLElement;
    private readonly evasion: HTMLElement;
    private readonly block: HTMLElement;
    private readonly reflect: HTMLElement;
    private readonly stunReduction: HTMLElement;

    // ─── Сопротивления ───
    private readonly fireRes: HTMLElement;
    private readonly coldRes: HTMLElement;
    private readonly lightRes: HTMLElement;

    private menuDialog: UIDialog | null = null;
    private wasOpen: boolean;

    constructor(ticker: Ticker, private gameStateService: GameStateService = new GameStateService())
    {
        ticker.OnTick((e) => this.Refresh());

        const menuPanel = document.querySelectorAll<HTMLElement>(".stat-nav-btn")!;
        for (const menuItem of menuPanel) menuItem.addEventListener("click", (e) => 
        {
            if (this.menuDialog) 
            {
                if (this.menuDialog.Id == menuItem.dataset.dialog) return;
                this.menuDialog.Close();
            }

            this.wasOpen = false;
            this.menuDialog = new UIDialog(menuItem.dataset.dialog!);
        });

        // Хелпер для короткой записи
        const $ = (id: string): HTMLElement => document.getElementById(id)!;

        this.weaponName = $('weaponNameDisplay');

        this.physDmg = $('statPhysDmg');
        this.fireDmg = $('statFireDmg');
        this.coldDmg = $('statColdDmg');
        this.lightDmg = $('statLightDmg');

        this.attackSpeed = $('statAttackSpeed');
        this.attackRange = $('statAttackRange');
        this.accuracy = $('statAccuracy');
        this.critChance = $('statCritChance');
        this.critMult = $('statCritMult');
        this.stunInc = $('statStunInc');

        this.str = $('statStr');
        this.dex = $('statDex');
        this.int = $('statInt');

        this.hp = $('hpText');
        this.regen = $('statRegen');
        this.lifePerKill = $('statLifePerKill');

        this.speed = $('statSpeed');

        this.es = $('statES');
        this.armor = $('statArmor');
        this.physReduction = $('statPhysReduction');
        this.evasion = $('statEvasion');
        this.block = $('statBlock');
        this.reflect = $('statReflect');
        this.stunReduction = $('statStunReduction');

        this.fireRes = $('statFireRes');
        this.coldRes = $('statColdRes');
        this.lightRes = $('statLightRes');
    }


    public Refresh(): void
    {
        const state = World.SingleComponent(GameStateComponent)!.GameState;

        if (!this.menuDialog) 
        {
            this.wasOpen = false;
            if (state.State == EGameState.PAUSE) this.gameStateService.Resume(state, "dialog:stats")
            return;
        }


        if (!this.menuDialog.Visibled && this.wasOpen)
        {
            this.menuDialog = null;
            return;
        }

        if (this.menuDialog.Visibled) return;

        const statsEntity = World.EntityFirst(EntityStatsComponent, HealthComponent, UserComponent);
        if (!statsEntity) return;

        this.gameStateService.Pause(state, "dialog:stats");

        const statsComp = World.GetComponent(statsEntity, EntityStatsComponent)!;
        const health = World.GetComponent(statsEntity, HealthComponent)!;
        const stats = statsComp.Final;

        // ─────────── ЖИЗНЬ ───────────
        this.hp.textContent = `${health.LifeCurrent?.toFixed() ?? 0}/${stats.LifeMax.toFixed()}`;
        this.regen.textContent = stats.LifePerSecond.toFixed(2);
        this.lifePerKill.textContent = stats.LifePerKill.toFixed();

        // ─────────── ХАРАКТЕРИСТИКИ ───────────
        this.str.textContent = stats.Str.toFixed();
        this.dex.textContent = stats.Dex.toFixed();
        this.int.textContent = stats.Int.toFixed();

        // ─────────── ПЕРЕДВИЖЕНИЕ ───────────
        this.speed.textContent = stats.MovementSpeed.toFixed();

        // ─────────── ЗАЩИТА ───────────
        this.es.textContent = `${health.EsCurrent?.toFixed() ?? 0}/${stats.ES.toFixed()}`;
        this.armor.textContent = stats.Armour.toFixed();
        this.physReduction.textContent = stats.PhysReduction.toFixed() + '%';
        this.evasion.textContent = stats.Evasion.toFixed();
        this.block.textContent = stats.Block.toFixed() + '%';
        this.reflect.textContent = stats.PhysReflect.toFixed();
        this.stunReduction.textContent = stats.StunReduction.toFixed() + '%';

        // ─────────── СОПРОТИВЛЕНИЯ ───────────
        this.fireRes.textContent = stats.FireResist.toFixed() + '%';
        this.coldRes.textContent = stats.ColdResist.toFixed() + '%';
        this.lightRes.textContent = stats.LightResist.toFixed() + '%';

        // ─────────── УРОН (диапазоны) ───────────
        this.physDmg.textContent = `${stats.PhysicalDamageMin.toFixed()}-${stats.PhysicalDamageMax.toFixed()}`;
        this.fireDmg.textContent = `${stats.FireDamageMin.toFixed()}-${stats.FireDamageMax.toFixed()}`;
        this.coldDmg.textContent = `${stats.ColdDamageMin.toFixed()}-${stats.ColdDamageMax.toFixed()}`;
        this.lightDmg.textContent = `${stats.LightDamageMin.toFixed()}-${stats.LightDamageMax.toFixed()}`;

        // Скрываем строки урона, у которых max = 0
        // this.toggleRow(this.physDmg,  s.PhysicalDamageMax > 0);
        // this.toggleRow(this.fireDmg,  s.FireDamageMax     > 0);
        // this.toggleRow(this.coldDmg,  s.ColdDamageMax     > 0);
        // this.toggleRow(this.lightDmg, s.LightDamageMax    > 0);

        // ─────────── АТАКА ───────────
        this.attackSpeed.textContent = stats.AttackSpeed.toFixed(2);
        this.attackRange.textContent = stats.AttackRange.toFixed();
        this.accuracy.textContent = stats.Accuracy.toFixed();
        this.critChance.textContent = stats.CriticalChance.toFixed() + '%';
        this.critMult.textContent = stats.CriticalMultiplier.toString() + 'x';
        this.stunInc.textContent = stats.StunInc.toFixed() + '%';

        // ─────────── ОРУЖИЕ (если есть компонент) ───────────
        this.updateWeaponName(statsEntity);

        this.menuDialog.Open();
        this.wasOpen = true;

    }


    // ============================================================
    // ВНУТРЕННИЕ ХЕЛПЕРЫ
    // ============================================================

    /** Скрыть/показать строку стата — работает с обёрткой .stat-item. */
    private toggleRow(valueEl: HTMLElement, visible: boolean): void
    {
        const row = valueEl.closest('.stat-item') as HTMLElement | null;
        if (row) row.style.display = visible ? '' : 'none';
    }


    private updateWeaponName(entity: number): void
    {
        const equipment = World.GetComponent(entity, EquipmentComponent)!;
        const weapon = equipment.Equipment.Slots[EEquipSlot.WEAPON];
        const name = weapon?.Name ?? 'Без оружия';
        const rarity = weapon?.Rarity ?? 'common';

        if (this.weaponName.textContent !== name)
        {
            this.weaponName.textContent = name;
            this.weaponName.className = `stat-value rarity-${rarity}`;
        }
    }
}

export function InitStatsModule(ticker: Ticker): void
{
    World.SystemAdd(new EntityStatsSystem());
    new UI(ticker);
}

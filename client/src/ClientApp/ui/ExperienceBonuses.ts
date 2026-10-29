//#region UI

import { UIDialog } from "./Dialog";
import { BonusEffect, BonusOffer } from "../model/GameState";
import { EBonusEffectType, EBonusModifier } from "../model/Bonus";
import { BonusCardView, BonusUI } from "./BonusCore";
import { IGameService } from "../services/IGameService";

/** UI выбора бонуса уровня. */
export class ExperienceBonusUI extends BonusUI
{
    private bonusStatResources: Partial<Record<EBonusEffectType, Partial<Record<EBonusModifier, BonusCardView>>>> = {
        [EBonusEffectType.Str]: {
            [EBonusModifier.FLAT]: { Icon: "💪", Title: "Сила", Unit: "STR", Description: "Добавляет силу", CssClass: "str" },
            [EBonusModifier.PERCENT]: { Icon: "💪", Title: "Сила", Unit: "%", Description: "Повышение силы", CssClass: "str" },
        },
        [EBonusEffectType.Dex]: {
            [EBonusModifier.FLAT]: { Icon: "🏹", Title: "Ловкость", Unit: "DEX", Description: "Добавляет ловкость", CssClass: "dex" },
            [EBonusModifier.PERCENT]: { Icon: "🏹", Title: "Ловкость", Unit: "%", Description: "Повышение ловкости", CssClass: "dex" },
        },
        [EBonusEffectType.Int]: {
            [EBonusModifier.FLAT]: { Icon: "🔮", Title: "Интеллект", Unit: "INT", Description: "Добавляет интеллект", CssClass: "int" },
            [EBonusModifier.PERCENT]: { Icon: "🔮", Title: "Интеллект", Unit: "%", Description: "Повышение интеллекта", CssClass: "int" },
        },
        [EBonusEffectType.LifeMax]: {
            [EBonusModifier.FLAT]: { Icon: "❤️", Title: "Здоровье", Unit: "HP", Description: "К максимуму здоровья", CssClass: "hp" },
            [EBonusModifier.PERCENT]: { Icon: "❤️", Title: "Прирост здоровья", Unit: "%", Description: "Повышение максимума здоровья", CssClass: "hp" },
        },
        [EBonusEffectType.LifePerSecond]: {
            [EBonusModifier.FLAT]: { Icon: "💚", Title: "Регенерация", Unit: "HP/s", Description: "Регенерация здоровья в секунду", CssClass: "hp" },
        },
        [EBonusEffectType.LifePerKill]: {
            [EBonusModifier.FLAT]: { Icon: "🩸", Title: "Здоровье за убийство", Unit: "HP", Description: "К здоровью за убийство", CssClass: "hp" },
        },
        [EBonusEffectType.Armour]: {
            [EBonusModifier.FLAT]: { Icon: "🛡️", Title: "Броня", Unit: "AR", Description: "К броне", CssClass: "def" },
            [EBonusModifier.PERCENT]: { Icon: "🛡️", Title: "Укрепление брони", Unit: "%", Description: "Повышение брони", CssClass: "def" },
        },
        [EBonusEffectType.Evasion]: {
            [EBonusModifier.FLAT]: { Icon: "💨", Title: "Уклонение", Unit: "EV", Description: "К уклонению", CssClass: "def" },
            [EBonusModifier.PERCENT]: { Icon: "💨", Title: "Ловкость в защите", Unit: "%", Description: "Повышение уклонения", CssClass: "def" },
        },
        [EBonusEffectType.ES]: {
            [EBonusModifier.FLAT]: { Icon: "🔷", Title: "Энергощит", Unit: "ES", Description: "К энергощиту", CssClass: "def" },
            [EBonusModifier.PERCENT]: { Icon: "🔷", Title: "Усиление щита", Unit: "%", Description: "Повышение энергощита", CssClass: "def" },
        },
        [EBonusEffectType.FireResist]: {
            [EBonusModifier.PERCENT_POINT]: { Icon: "🔥", Title: "Сопр. огню", Unit: "%", Description: "К сопротивлению огню", CssClass: "res" },
        },
        [EBonusEffectType.ColdResist]: {
            [EBonusModifier.PERCENT_POINT]: { Icon: "❄️", Title: "Сопр. холоду", Unit: "%", Description: "К сопротивлению холоду", CssClass: "res" },
        },
        [EBonusEffectType.LightResist]: {
            [EBonusModifier.PERCENT_POINT]: { Icon: "⚡", Title: "Сопр. молнии", Unit: "%", Description: "К сопротивлению молнии", CssClass: "res" },
        },
        [EBonusEffectType.PhysDamage]: {
            [EBonusModifier.PERCENT]: { Icon: "⚔️", Title: "Физический урон", Unit: "%", Description: "Повышение физического урона", CssClass: "dmg" },
        },
        [EBonusEffectType.FireDamage]: {
            [EBonusModifier.PERCENT]: { Icon: "🔥", Title: "Урон огнем", Unit: "%", Description: "Повышение урона огнём", CssClass: "fire" },
        },
        [EBonusEffectType.ColdDamage]: {
            [EBonusModifier.PERCENT]: { Icon: "❄️", Title: "Урон холодом", Unit: "%", Description: "Повышение урона холодом", CssClass: "cold" },
        },
        [EBonusEffectType.LightDamage]: {
            [EBonusModifier.PERCENT]: { Icon: "⚡", Title: "Урон молнией", Unit: "%", Description: "Повышение урона молнией", CssClass: "light" },
        },
        [EBonusEffectType.AttackSpeed]: {
            [EBonusModifier.PERCENT]: { Icon: "⚡", Title: "Скорость атаки", Unit: "%", Description: "Повышение скорости атаки", CssClass: "spd" },
        },
        [EBonusEffectType.AttackRange]: {
            [EBonusModifier.PERCENT]: { Icon: "🎯", Title: "Радиус атаки", Unit: "%", Description: "Повышение радиуса атаки", CssClass: "spd" },
        },
        [EBonusEffectType.MovementSpeed]: {
            [EBonusModifier.PERCENT_POINT]: { Icon: "🏃", Title: "Скорость бега", Unit: "%", Description: "К скорости передвижения", CssClass: "spd" },
        },
        [EBonusEffectType.Accuracy]: {
            [EBonusModifier.FLAT]: { Icon: "🎯", Title: "Меткость", Unit: "ACC", Description: "К меткости", CssClass: "spd" },
        },
        [EBonusEffectType.CriticalChance]: {
            [EBonusModifier.PERCENT_POINT]: { Icon: "💥", Title: "Шанс крита", Unit: "%", Description: "Повышает шанс критического удара", CssClass: "crit" },
        },
        [EBonusEffectType.CriticalMultiplier]: {
            [EBonusModifier.FLAT]: { Icon: "💥", Title: "Множитель крита", Unit: "x", Description: "Усиливает критический урон", CssClass: "crit" },
        },
        [EBonusEffectType.ESRegenDelay]: {
            [EBonusModifier.PERCENT]: { Icon: "⏳", Title: "Задержка щита", Unit: "%", Description: "Сокращает задержку перед регенерацией энергощита", CssClass: "def" },
        },
        [EBonusEffectType.ESRegenRate]: {
            [EBonusModifier.PERCENT]: { Icon: "🔷", Title: "Скорость регенерации щита", Unit: "%", Description: "Повышение скорости регенерации энергощита", CssClass: "def" },
            [EBonusModifier.FLAT]: { Icon: "🔷", Title: "Регенерация щита", Unit: "ES/s", Description: "Регенерация энергощита в секунду", CssClass: "def" },
        },
        [EBonusEffectType.StunInc]: {
            [EBonusModifier.FLAT]: { Icon: "💫", Title: "Шанс оглушения", Unit: "%", Description: "К шансу оглушить врага", CssClass: "crit" },
        },
        [EBonusEffectType.StunReduction]: {
            [EBonusModifier.FLAT]: { Icon: "💫", Title: "Сопротивление оглушению", Unit: "%", Description: "Снижение длительности оглушения", CssClass: "def" },
        },
        [EBonusEffectType.PhysReflect]: {
            [EBonusModifier.PERCENT]: { Icon: "🦔", Title: "Отражение урона", Unit: "%", Description: "Отражает часть физического урона", CssClass: "dmg" },
            [EBonusModifier.FLAT]: { Icon: "🦔", Title: "Отражение урона", Unit: "DMG", Description: "Отражает физический урон", CssClass: "dmg" },
        },
        [EBonusEffectType.PhysReduction]: {
            [EBonusModifier.PERCENT]: { Icon: "🛡️", Title: "Снижение физ. урона", Unit: "%", Description: "Снижает получаемый физический урон", CssClass: "def" },
        },
        [EBonusEffectType.Block]: {
            [EBonusModifier.PERCENT]: { Icon: "🧱", Title: "Блок", Unit: "%", Description: "Повышение эффективности блока", CssClass: "def" },
            [EBonusModifier.PERCENT_POINT]: { Icon: "🧱", Title: "Шанс блока", Unit: "%", Description: "К шансу блокировать атаку", CssClass: "def" },
        },
    };

    constructor(
        dialog: UIDialog,
        gameService: IGameService)
    {
        super(dialog, state => state.ExperienceBonusOffer, bonusId => gameService.ChooseLevelBonus(bonusId));
    }

    protected GetView(bonus: BonusOffer): BonusCardView | undefined
    {
        const primary = bonus.Effects[0];
        if (!primary) return undefined;

        return this.bonusStatResources[primary.Type]?.[primary.Mod] ?? {
            Icon: "❓",
            Title: `${primary.Type}:${primary.Mod}`,
            Unit: "",
            Description: "Бонус без описания",
            CssClass: "",
        };
    }

    protected RenderBody(bonus: BonusOffer): string
    {
        return bonus.Effects
            .map((e, i) => `<div class="bonus-value${i > 0 ? " secondary" : ""}">${this.FormatEffect(e)}</div>`)
            .join("");
    }

    protected FormatEffect(e: BonusEffect): string
    {
        if (e.Mod === EBonusModifier.PERCENT || e.Mod === EBonusModifier.PERCENT_POINT)
            return `${e.Value >= 0 ? "+" : ""}${e.Value} <small>%</small>`;

        const unit = this.bonusStatResources[e.Type]?.[e.Mod]?.Unit ?? "";
        const valueStr = e.Type === EBonusEffectType.CriticalMultiplier ? e.Value.toFixed(2) : String(e.Value);
        const sign = e.Value >= 0 ? "+" : "";
        return `${sign}${valueStr} <small>${unit}</small>`;
    }
}

//#endregion

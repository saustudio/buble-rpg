import { System, Ticker, World, EntityId } from "./core";
import { EGameState, GameStateComponent, GameStateService } from "./gamestate";
import { UserComponent } from "./user";
import { ExpComponent } from "./experience";
import bonusData from "../data/bonus.json";
import { UIDialog } from "./dialog";


//#region систеа

export enum EBonusMod
{
    FLAT = "flat",
    PERCENT = "percent",
    PERCENT_POINT = "percentPoint",
}

export type EBonusType =
    // ─── Характеристики ───
    | "Str"
    | "Dex"
    | "Int"

    // ─── Оглушение ───
    | "StunInc"
    | "StunReduction"

    // ─── Жизнь ───
    | "LifeMax"
    | "LifePerSecond"
    | "LifePerKill"

    // ─── Защита ───
    | "PhysReflect"
    | "PhysReduction"
    | "Armour"
    | "Evasion"
    | "ES"
    | "ESRegenDelay"
    | "ESRegenRate"
    | "Block"

    // ─── Сопротивления ───
    | "FireResist"
    | "ColdResist"
    | "LightResist"

    // ─── Групповые модификаторы урона ───
    | "PhysDamage"
    | "FireDamage"
    | "ColdDamage"
    | "LightDamage"

    // ─── Скорость / крит / точность ───
    | "AttackSpeed"
    | "AttackRange"
    | "MovementSpeed"
    | "Accuracy"
    | "CriticalChance"
    | "CriticalMultiplier";


/** Один статовый эффект. */
export interface IBonusEffect
{
    Type: EBonusType;
    Mod: EBonusMod;
    Value: number;
}

/** Конкретный бонус, выпавший игроку — только данные. */
export interface IBonus
{
    /** Стабильный идентификатор для сопоставления с рендером/локализацией. */
    Id: string;
    Primary: IBonusEffect;
    Secondary?: IBonusEffect;
    IsKeystone: boolean;
}

// ─── JSON-схема (только цифры) ───

interface IJsonEffect
{
    type: EBonusType;
    mod: EBonusMod;
    min: number;
    max: number;
}

interface IJsonPoolEntry extends IJsonEffect
{
    weight?: number;
}

interface IJsonKeystone
{
    id: string;
    weight?: number;
    primary: IJsonEffect;
    secondary: IJsonEffect;
}

interface IBonusJson
{
    pool: IJsonPoolEntry[];
    keystones: IJsonKeystone[];
}

// ─── Компоненты ───

export class BonusComponent
{
    public List: IBonus[] = [];
}

export class BonusChooseComponent
{
    public List: IBonus[] = [];
}

// ─── Система ───

export class BonusSystem implements System
{
    private static readonly KEYSTONE_CHANCE = 0.15;

    public Update(deltaTime: number): void
    {
        const gameState = World.SingleComponent(GameStateComponent)!.GameState;
        if (gameState.State == EGameState.PAUSE || gameState.State == EGameState.OVER) return;

        const userEntity = World.EntityFirst(UserComponent, ExpComponent);
        if (!userEntity) return;

        const exp = World.GetComponent(userEntity, ExpComponent)!;
        if (exp.Value < exp.Next) return;

        World.SetComponent(userEntity, new BonusChooseComponent());
        const bonus = World.GetComponent(userEntity, BonusChooseComponent)!;
        bonus.List = this.RollBonuses(3);
    }

    private RollBonuses(count: number): IBonus[]
    {
        const data = bonusData as IBonusJson;
        const pool = [...data.pool];
        const keystones = [...data.keystones];
        const result: IBonus[] = [];
        let keystoneUsed = false;

        for (let i = 0; i < count; i++)
        {
            const wantKeystone =
                !keystoneUsed &&
                keystones.length > 0 &&
                Math.random() < BonusSystem.KEYSTONE_CHANCE;

            if (wantKeystone)
            {
                const picked = this.PickWeighted(keystones);
                keystones.splice(keystones.indexOf(picked), 1);
                result.push(this.BuildKeystone(picked));
                keystoneUsed = true;
            }
            else
            {
                const picked = this.PickWeighted(pool);
                pool.splice(pool.indexOf(picked), 1);
                result.push(this.BuildSimple(picked));
            }
        }

        return result;
    }

    private PickWeighted<T extends { weight?: number }>(items: T[]): T
    {
        const total = items.reduce((s, b) => s + (b.weight ?? 1), 0);
        let roll = Math.random() * total;
        let picked = items[items.length - 1];
        for (const it of items)
        {
            roll -= it.weight ?? 1;
            if (roll <= 0) { picked = it; break; }
        }
        return picked;
    }

    private BuildSimple(e: IJsonPoolEntry): IBonus
    {
        return {
            Id: `${e.type}:${e.mod}`,
            Primary: { Type: e.type, Mod: e.mod, Value: this.RollValue(e.min, e.max) },
            IsKeystone: false,
        };
    }

    private BuildKeystone(k: IJsonKeystone): IBonus
    {
        return {
            Id: k.id,
            Primary: {
                Type: k.primary.type, Mod: k.primary.mod,
                Value: this.RollValue(k.primary.min, k.primary.max),
            },
            Secondary: {
                Type: k.secondary.type, Mod: k.secondary.mod,
                Value: this.RollValue(k.secondary.min, k.secondary.max),
            },
            IsKeystone: true,
        };
    }

    private RollValue(min: number, max: number): number
    {
        const raw = min + Math.random() * (max - min);
        return Math.abs(max) <= 5 ? Math.round(raw * 100) / 100 : Math.round(raw);
    }
}

//#endregion

//#region  Интерфейс
interface IBonusView
{
    Icon: string;
    Title: string;
    Unit: string;
    Description: string;
    CssClass: string;
}

const BonusStatResources: Record<string, IBonusView> = {
    "Str:flat": { Icon: "💪", Title: "Сила", Unit: "STR", Description: "Добавляет силу", CssClass: "str" },
    "Dex:flat": { Icon: "🏹", Title: "Ловкость", Unit: "DEX", Description: "Добавляет ловкость", CssClass: "dex" },
    "Int:flat": { Icon: "🔮", Title: "Интеллект", Unit: "INT", Description: "Добавляет интеллект", CssClass: "int" },

    "LifeMax:flat": { Icon: "❤️", Title: "Здоровье", Unit: "HP", Description: "К максимуму здоровья", CssClass: "hp" },
    "LifeMax:percent": { Icon: "❤️", Title: "Прирост здоровья", Unit: "%", Description: "Повышение максимума здоровья", CssClass: "hp" },
    "LifePerSecond:flat": { Icon: "💚", Title: "Регенерация", Unit: "HP/s", Description: "Регенерация здоровья в секунду", CssClass: "hp" },
    "LifePerKill:flat": { Icon: "🩸", Title: "Здоровье за убийство", Unit: "HP", Description: "К здоровью за убийство", CssClass: "hp" },

    "Armour:flat": { Icon: "🛡️", Title: "Броня", Unit: "AR", Description: "К броне", CssClass: "def" },
    "Armour:percent": { Icon: "🛡️", Title: "Укрепление брони", Unit: "%", Description: "Повышение брони", CssClass: "def" },
    "Evasion:flat": { Icon: "💨", Title: "Уклонение", Unit: "EV", Description: "К уклонению", CssClass: "def" },
    "Evasion:percent": { Icon: "💨", Title: "Ловкость в защите", Unit: "%", Description: "Повышение уклонения", CssClass: "def" },
    "ES:flat": { Icon: "🔷", Title: "Энергощит", Unit: "ES", Description: "К энергощиту", CssClass: "def" },
    "ES:percent": { Icon: "🔷", Title: "Усиление щита", Unit: "%", Description: "Повышение энергощита", CssClass: "def" },

    "FireResist:percentPoint": { Icon: "🔥", Title: "Сопр. огню", Unit: "%", Description: "К сопротивлению огню", CssClass: "res" },
    "ColdResist:percentPoint": { Icon: "❄️", Title: "Сопр. холоду", Unit: "%", Description: "К сопротивлению холоду", CssClass: "res" },
    "LightResist:percentPoint": { Icon: "⚡", Title: "Сопр. молнии", Unit: "%", Description: "К сопротивлению молнии", CssClass: "res" },

    "PhysDamage:percent": { Icon: "⚔️", Title: "Физический урон", Unit: "%", Description: "Повышение физического урона", CssClass: "dmg" },
    "FireDamage:percent": { Icon: "🔥", Title: "Урон огнем", Unit: "%", Description: "Повышение урона огнём", CssClass: "fire" },
    "ColdDamage:percent": { Icon: "❄️", Title: "Урон холодом", Unit: "%", Description: "Повышение урона холодом", CssClass: "cold" },
    "LightDamage:percent": { Icon: "⚡", Title: "Урон молнией", Unit: "%", Description: "Повышение урона молнией", CssClass: "light" },

    "AttackSpeed:percent": { Icon: "⚡", Title: "Скорость атаки", Unit: "%", Description: "Повышение скорости атаки", CssClass: "spd" },
    "AttackRange:percent": { Icon: "🎯", Title: "Радиус атаки", Unit: "%", Description: "Повышение радиуса атаки", CssClass: "spd" },
    "MovementSpeed:percentPoint": { Icon: "🏃", Title: "Скорость бега", Unit: "%", Description: "К скорости передвижения", CssClass: "spd" },
    "Accuracy:flat": { Icon: "🎯", Title: "Меткость", Unit: "ACC", Description: "К меткости", CssClass: "spd" },
    "CriticalChance:percentPoint": { Icon: "💥", Title: "Шанс крита", Unit: "%", Description: "Повышает шанс критического удара", CssClass: "crit" },
    "CriticalMultiplier:flat": { Icon: "💥", Title: "Множитель крита", Unit: "x", Description: "Усиливает критический урон", CssClass: "crit" },

    // ─── Percent-версии статов (Str/Dex/Int) ───
    "Str:percent": { Icon: "💪", Title: "Сила", Unit: "%", Description: "Повышение силы", CssClass: "str" },
    "Dex:percent": { Icon: "🏹", Title: "Ловкость", Unit: "%", Description: "Повышение ловкости", CssClass: "dex" },
    "Int:percent": { Icon: "🔮", Title: "Интеллект", Unit: "%", Description: "Повышение интеллекта", CssClass: "int" },

    // ─── Energy Shield (регенерация) ───
    "ESRegenDelay:percent": { Icon: "⏳", Title: "Задержка щита", Unit: "%", Description: "Сокращает задержку перед регенерацией энергощита", CssClass: "def" },
    "ESRegenRate:percent": { Icon: "🔷", Title: "Скорость регенерации щита", Unit: "%", Description: "Повышение скорости регенерации энергощита", CssClass: "def" },
    "ESRegenRate:flat": { Icon: "🔷", Title: "Регенерация щита", Unit: "ES/s", Description: "Регенерация энергощита в секунду", CssClass: "def" },

    // ─── Stun ───
    "StunInc:percent": { Icon: "💫", Title: "Увеличение оглушения", Unit: "%", Description: "Повышение длительности оглушения", CssClass: "crit" },
    "StunInc:percentPoint": { Icon: "💫", Title: "Шанс оглушения", Unit: "%", Description: "К шансу оглушить врага", CssClass: "crit" },
    "StunReduction:percent": { Icon: "💫", Title: "Сопротивление оглушению", Unit: "%", Description: "Снижение длительности оглушения", CssClass: "def" },
    "StunReduction:percentPoint": { Icon: "💫", Title: "Защита от оглушения", Unit: "%", Description: "К сопротивлению оглушению", CssClass: "def" },

    // ─── Reflect / Reduction / Block ───
    "PhysReflect:percent": { Icon: "🦔", Title: "Отражение урона", Unit: "%", Description: "Отражает часть физического урона", CssClass: "dmg" },
    "PhysReflect:flat": { Icon: "🦔", Title: "Отражение урона", Unit: "DMG", Description: "Отражает физический урон", CssClass: "dmg" },
    "PhysReduction:percent": { Icon: "🛡️", Title: "Снижение физ. урона", Unit: "%", Description: "Снижает получаемый физический урон", CssClass: "def" },

    "Block:percent": { Icon: "🧱", Title: "Блок", Unit: "%", Description: "Повышение эффективности блока", CssClass: "def" },
    "Block:percentPoint": { Icon: "🧱", Title: "Шанс блока", Unit: "%", Description: "К шансу блокировать атаку", CssClass: "def" },
};

/**
 * Капстоуны — сопоставление по Id из JSON.
 * Если добавишь новый капстоун в JSON — добавь запись сюда.
 */
export const BonusKeystoneResources: Record<string, IBonusView> = {
    blood_and_sand: {
        Icon: "🩸", Title: "Кровь и песок",
        Unit: "", Description: "Огромный физический урон ценой живучести",
        CssClass: "dmg",
    },

    glass_cannon: {
        Icon: "💥", Title: "Стеклянная пушка",
        Unit: "", Description: "Стихии бьют сильнее, но броня тает",
        CssClass: "dmg",
    },

    berserker_rage: {
        Icon: "🔥", Title: "Ярость берсерка",
        Unit: "", Description: "Скорость атаки в обмен на сопротивления",
        CssClass: "spd",
    },

    heavy_armour: {
        Icon: "🛡️", Title: "Тяжёлый доспех",
        Unit: "", Description: "Максимум брони, минимум мобильности",

        CssClass: "def",
    },
    light_step: {
        Icon: "💨", Title: "Лёгкий шаг",
        Unit: "", Description: "Уклонение в обмен на броню",
        CssClass: "def",
    },

    crystal_heart: {
        Icon: "🔷", Title: "Кристальное сердце",
        Unit: "", Description: "Огромный энергощит ценой здоровья",
        CssClass: "def",
    },

    pyromancer: {
        Icon: "🔥", Title: "Пиромант",
        Unit: "", Description: "Огонь сильнее, холод слабее",
        CssClass: "fire",
    },

    cryomancer: {
        Icon: "❄️", Title: "Криомант",
        Unit: "", Description: "Холод сильнее, огонь слабее",
        CssClass: "cold",
    },

    electromancer: {
        Icon: "⚡", Title: "Электромант",
        Unit: "", Description: "Молния сильнее, огонь слабее",
        CssClass: "light",
    },

    double_strike: {
        Icon: "⚔️", Title: "Двойной удар",
        Unit: "", Description: "Скорость атаки в обмен на силу удара",
        CssClass: "spd",
    },

    glass_resist: {
        Icon: "💠", Title: "Хрупкость стихий",
        Unit: "", Description: "Сопротивления в обмен на здоровье",
        CssClass: "res",
    },

    crit_lord: {
        Icon: "💥", Title: "Владыка критов",
        Unit: "", Description: "Критический урон в обмен на скорость",
        CssClass: "crit",
    },

    precision_strike: {
        Icon: "🎯", Title: "Точный удар",
        Unit: "", Description: "Точность и крит в обмен на урон",
        CssClass: "crit",
    },

    thorned_hide: {
        Icon: "🌵", Title: "Терновая кожа",
        Unit: "", Description: "Отражает урон ценой здоровья",
        CssClass: "dmg",
    },

    stun_lord: {
        Icon: "💫", Title: "Владыка оглушения",
        Unit: "", Description: "Оглушение в обмен на скорость атаки",
        CssClass: "crit",
    },

    block_master: {
        Icon: "🧱", Title: "Мастер блока",
        Unit: "", Description: "Блок в обмен на уклонение",
        CssClass: "def",
    },

    es_overflow: {
        Icon: "🔷", Title: "Переполнение щита",
        Unit: "", Description: "Регенерация щита в обмен на его запас",
        CssClass: "def",
    },
};


class UI
{
    private static readonly PAUSE_SOURCE = "dialog:bonus";

    constructor(
        private ticker: Ticker,
        private gameStateService: GameStateService = new GameStateService(),
        private dialog: UIDialog = new UIDialog("levelup")) 
    {
        ticker.OnTick((d) => this.Refresh());
    }

    public Refresh(): void
    {
        // 1. Игра окончена — выходим
        const gameState = World.SingleComponent(GameStateComponent)!.GameState;
        if (gameState.State === EGameState.OVER) return;

        // 2. Нет выбора бонуса — выходим
        const userEntity = World.EntityFirst(UserComponent, BonusChooseComponent);
        if (!userEntity) return;

        const chooseList = World.GetComponent(userEntity, BonusChooseComponent)!.List;

        // 3. Выбор сделан → закрыть, снять паузу, удалить компонент
        if (chooseList.length === 0)
        {
            this.dialog.Close();
            World.RemoveComponent(userEntity, BonusChooseComponent);
            this.gameStateService.Resume(gameState, UI.PAUSE_SOURCE);
            return;
        }

        // 4. Диалог уже открыт → ничего не делаем
        if (this.dialog.Visibled) return;

        // 5. Открыть и отрисовать
        this.dialog.Open();
        this.gameStateService.Pause(gameState, UI.PAUSE_SOURCE);
        this.ShowBonuses(userEntity, chooseList);
    }

    private ShowBonuses(userEntity: EntityId, chooseList: IBonus[]): void
    {
        this.dialog.Container.innerHTML = '';

        const userBonus = World.GetComponent(userEntity, BonusComponent)!;
        const cardContainer = document.createElement("div");
        cardContainer.className = "bonus-cards";

        for (const bonus of chooseList)
        {
            const card = this.BuildCard(bonus);
            card.addEventListener("click", () =>
            {
                userBonus.List.push(bonus);
                chooseList.length = 0;
            });

            cardContainer.appendChild(card);
        }

        this.dialog.Container.appendChild(cardContainer);
    }


    private BuildCard(bonus: IBonus): HTMLElement
    {
        const view = this.GetBonusView(bonus);
        if (!view) return this.BuildFallbackCard(bonus);

        const card = document.createElement("div");
        card.className = `bonus-card ${view.CssClass}${bonus.IsKeystone ? " keystone" : ""}`;

        const primaryLine = this.FormatEffect(bonus.Primary);
        const secondaryLine = bonus.Secondary ? this.FormatEffect(bonus.Secondary) : "";

        card.innerHTML = `
            <div class="bonus-icon">${view.Icon}</div>
            <div class="bonus-title">${view.Title}</div>
            <div class="bonus-value">${primaryLine}</div>
            ${secondaryLine ? `<div class="bonus-value secondary">${secondaryLine}</div>` : ""}
            <div class="bonus-desc">${view.Description}</div>`;

        return card;
    }

    private BuildFallbackCard(bonus: IBonus): HTMLElement
    {
        const card = document.createElement("div");
        card.className = `bonus-card${bonus.IsKeystone ? " keystone" : ""}`;

        card.innerHTML = `
        <div class="bonus-icon">❓</div>
        <div class="bonus-title">${bonus.Id}</div>
        <div class="bonus-value">${this.FormatEffect(bonus.Primary)}</div>
        ${bonus.Secondary ? `<div class="bonus-value secondary">${this.FormatEffect(bonus.Secondary)}</div>` : ""}
        <div class="bonus-desc">Описание отсутствует</div> `;

        return card;
    }

    private GetEffectUnit(e: IBonusEffect): string
    {
        return BonusStatResources[`${e.Type}:${e.Mod}`]?.Unit ?? "";
    }

    private FormatEffect(e: IBonusEffect): string
    {
        if (e.Mod === EBonusMod.PERCENT || e.Mod === EBonusMod.PERCENT_POINT)
            return `${e.Value >= 0 ? "+" : ""}${e.Value} <small>%</small>`;

        const unit = this.GetEffectUnit(e);
        const valueStr = e.Type === "CriticalMultiplier" ? e.Value.toFixed(2) : String(e.Value);
        const sign = e.Value >= 0 ? "+" : "";
        return `${sign}${valueStr} <small>${unit}</small>`;
    }


    private GetBonusView(bonus: IBonus): IBonusView | undefined
    {
        if (bonus.IsKeystone) return BonusKeystoneResources[bonus.Id] ?? {
            Icon: "❓",
            Title: bonus.Id,
            Unit: "",
            Description: "Капстоун без описания",
            CssClass: "",
        };

        const key = `${bonus.Primary.Type}:${bonus.Primary.Mod}`;
        return BonusStatResources[`${bonus.Primary.Type}:${bonus.Primary.Mod}`] ?? {
            Icon: "❓",
            Title: key,
            Unit: "",
            Description: "Бонус без описания",
            CssClass: "",
        };

    }
}

//#endregion


export function InitBonusModule(ticker: Ticker): void
{
    World.SystemAdd(new BonusSystem());
    new UI(ticker);
}



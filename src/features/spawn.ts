import { EntityId, IRenderer, System, World, Graphics, Ticker } from "./core";
import { GameStateComponent, EGameState, GameStateService } from "./gamestate";
import { HealthComponent } from "./health";
import { Transform2DComponent, VelocityComponent } from "./movement";
import { RigidbodyComponent } from "./physics";
import { EntityStatsComponent, EntityStatsService, IEntityStats, RawStats } from "./stats";
import { EquipmentComponent, Equipment, EquipmentService } from "./equipment";
import { EItemTag, ItemFactory, EAffixType } from "./items";
import { FractionComponent, PursuerComponent } from "./targeting";
import { UIDialog } from "./dialog";
import waveData from "../data/wave.json";

declare const PIXI: any;

export enum ESpawnEntityClass { WARIOR, ASSASIN, MONC }

//#region ФИЧА: волны — данные

export enum EWaveEffectType
{
    MONSTER_COUNT = "MonsterCount",
    MONSTER_LEVEL = "MonsterLevel",
    MONSTER_HEALTH = "MonsterHealth",
    MONSTER_DAMAGE = "MonsterDamage",
    MONSTER_SPEED = "MonsterSpeed",
    MONSTER_RESIST = "MonsterResist",
    SPAWN_SPEED = "SpawnSpeed",
    ELITE_CHANCE = "EliteChance",
    ITEM_QUANTITY = "ItemQuantity",
    ITEM_RARITY = "ItemRarity",
}

export enum EWaveValueType
{
    FLAT = "flat",
    PERCENT = "percent",
    PERCENT_POINT = "percentPoint",
}

/** Эффект модификатора: и хранилище (wave.json), и рантайм — один тип. */
export interface IWaveEffect
{
    Type: EWaveEffectType;
    ValueType: EWaveValueType;
    Min: number;
    Max: number;
}

/** Модификатор волны: и хранилище (wave.json), и рантайм — один тип. */
export interface IWaveModifier
{
    Id: string;
    Weight: number;
    Effects: IWaveEffect[];
}

interface IWaveStats
{
    MaxCount: number;
    MonsterLevel: number;
    SpawnInterval: number;
    HealthMult: number;
    DamageMult: number;
    SpeedMult: number;
    Resist: number;
    EliteChance: number;
    ItemQuantityMult: number;
    ItemRarityBonus: number;
}

//#endregion

export class SpawnEntityComponent { Type: ESpawnEntityClass; constructor(public Power: number) { } }

export class SpawnComponent
{
    Lvl: number = 1;
    Max: number = 0;
    Current: number = 0;
    Killed: number = 0;
    SpawnTimer: number = 0;
    PrepareTimer: number = 2;
    Modifiers: IWaveModifier[] = [];
}

/** Сигнал «волна пройдена, ждём выбор модификатора». */
export class WaveChooseComponent
{
    Offers: IWaveModifier[] = [];
    Chosen: IWaveModifier | null = null;
}

/** Логика волны: ролл предложений и пересчёт итогов по модели данных (без ECS). */
export class WaveService
{
    private static readonly BASE_MAX = 6;
    private static readonly BASE_MONSTER_LEVEL = 1;
    private static readonly BASE_SPAWN_INTERVAL = 2;
    private static readonly MIN_SPAWN_INTERVAL = 0.3;

    public RollMods(count: number): IWaveModifier[]
    {
        const pool = [...(waveData as IWaveModifier[])];
        const result: IWaveModifier[] = [];

        for (let i = 0; i < count && pool.length > 0; i++)
        {
            const picked = this.PickWeighted(pool);
            pool.splice(pool.indexOf(picked), 1);
            result.push(this.RollMod(picked));
        }

        return result;
    }

    public Stats(modifiers: IWaveModifier[]): IWaveStats
    {
        let countFlat = 0, countPercent = 0;
        let monsterLevel = 0;
        let healthPercent = 0, damagePercent = 0;
        let speedPoint = 0, spawnSpeedPercent = 0;
        let resistPoint = 0, elitePoint = 0;
        let itemQuantityPercent = 0, itemRarityPercent = 0;

        for (const modifier of modifiers)
        {
            for (const effect of modifier.Effects)
            {
                switch (effect.Type)
                {
                    case EWaveEffectType.MONSTER_COUNT:
                        if (effect.ValueType === EWaveValueType.FLAT) countFlat += effect.Min;
                        else countPercent += effect.Min;
                        break;
                    case EWaveEffectType.MONSTER_LEVEL: monsterLevel += effect.Min; break;
                    case EWaveEffectType.MONSTER_HEALTH: healthPercent += effect.Min; break;
                    case EWaveEffectType.MONSTER_DAMAGE: damagePercent += effect.Min; break;
                    case EWaveEffectType.MONSTER_SPEED: speedPoint += effect.Min; break;
                    case EWaveEffectType.SPAWN_SPEED: spawnSpeedPercent += effect.Min; break;
                    case EWaveEffectType.MONSTER_RESIST: resistPoint += effect.Min; break;
                    case EWaveEffectType.ELITE_CHANCE: elitePoint += effect.Min; break;
                    case EWaveEffectType.ITEM_QUANTITY: itemQuantityPercent += effect.Min; break;
                    case EWaveEffectType.ITEM_RARITY: itemRarityPercent += effect.Min; break;
                }
            }
        }

        const maxCount = Math.max(1, Math.round((WaveService.BASE_MAX + countFlat) * (1 + countPercent / 100)));
        const spawnInterval = Math.max(WaveService.MIN_SPAWN_INTERVAL, WaveService.BASE_SPAWN_INTERVAL / (1 + spawnSpeedPercent / 100));

        return {
            MaxCount: maxCount,
            MonsterLevel: WaveService.BASE_MONSTER_LEVEL + monsterLevel,
            SpawnInterval: spawnInterval,
            HealthMult: 1 + healthPercent / 100,
            DamageMult: 1 + damagePercent / 100,
            SpeedMult: 1 + speedPoint / 100,
            Resist: Math.min(75, resistPoint),
            EliteChance: Math.max(0, Math.min(0.9, elitePoint / 100)),
            ItemQuantityMult: 1 + itemQuantityPercent / 100,
            ItemRarityBonus: itemRarityPercent,
        };
    }

    private PickWeighted(items: IWaveModifier[]): IWaveModifier
    {
        const total = items.reduce((s, entry) => s + entry.Weight, 0);
        let roll = Math.random() * total;
        let picked = items[items.length - 1];

        for (const entry of items)
        {
            roll -= entry.Weight;
            if (roll <= 0) { picked = entry; break; }
        }

        return picked;
    }

    /** Коллапсит диапазон Min/Max в одно значение — далее везде Min === Max. */
    private RollMod(modifier: IWaveModifier): IWaveModifier
    {
        return {
            Id: modifier.Id,
            Weight: modifier.Weight,
            Effects: modifier.Effects.map((e) =>
            {
                const value = this.RollValue(e.Min, e.Max);
                return { Type: e.Type, ValueType: e.ValueType, Min: value, Max: value };
            }),
        };
    }

    private RollValue(min: number, max: number): number
    {
        const raw = min + Math.random() * (max - min);
        return Math.abs(max) <= 5 ? Math.round(raw * 100) / 100 : Math.round(raw);
    }
}

//#region ФИЧА: монстры

class SpawnSystem implements System
{
    private readonly waveService = new WaveService();

    public Update(deltaTime: number): void
    {
        const gameState = World.SingleComponent(GameStateComponent)!.GameState;
        if (gameState.State == EGameState.PAUSE || gameState.State == EGameState.OVER) return;

        //удаляем мертвые сущности
        const deathList = World.EntityQuery(SpawnEntityComponent, HealthComponent).filter(e => World.GetComponent(e, HealthComponent)!.LifeCurrent <= 0);
        for (const entity of deathList) World.EntityRemove(entity);

        let spawnEntity = World.EntityFirst(SpawnComponent);

        if (gameState.State == EGameState.INIT)
        {
            if (spawnEntity) { World.EntityRemove(spawnEntity); spawnEntity = null; }
            const entityList = World.EntityQuery(SpawnEntityComponent);
            for (const entity of entityList) World.EntityRemove(entity);
        }

        if (spawnEntity === null)
        {
            spawnEntity = World.EntityCreate().SetComponent(new SpawnComponent()).Entity;
            const created = World.GetComponent(spawnEntity, SpawnComponent)!;
            created.Max = this.waveService.Stats(created.Modifiers).MaxCount;
        }

        const wave = World.GetComponent(spawnEntity, SpawnComponent)!;

        // волна пройдена — спавн останавливается, ждём выбор модификатора от UI
        if (World.GetComponent(spawnEntity, WaveChooseComponent)) return;

        // время на подготовку к волне
        if (wave.PrepareTimer > 0)
        {
            wave.PrepareTimer = Math.max(0, wave.PrepareTimer - deltaTime);
            return;
        }

        const totals = this.waveService.Stats(wave.Modifiers);

        // Спавним врагов
        wave.SpawnTimer -= deltaTime;
        if (wave.SpawnTimer <= 0 && wave.Current < wave.Max)
        {
            this.SpawnEnemy(wave, totals);
            wave.Current++;
            wave.SpawnTimer = totals.SpawnInterval;
        }

        // Все враги заспавнены и убиты — предлагаем бонус на следующую волну
        if (wave.Current >= wave.Max && World.EntityQuery(SpawnEntityComponent).length === 0)
        {
            const choose = new WaveChooseComponent();
            choose.Offers = this.waveService.RollMods(3);
            World.SetComponent(spawnEntity, choose);
        }
    }

    private SpawnEnemy(wave: SpawnComponent, totals: IWaveStats): void
    {

        const entity = World.EntityCreate()
            .SetComponent(new FractionComponent(1))
            .Entity;

        //тип монстра
        const spawnConfig = {

            [ESpawnEntityClass.WARIOR]: { BaseHP: 38, Size: 20, MoveSpeed: 20, Str: 15, Dex: 0, Int: 0 },
            [ESpawnEntityClass.ASSASIN]: { BaseHP: 38, Size: 20, MoveSpeed: 10, Str: 0, Dex: 15, Int: 0 },
            [ESpawnEntityClass.MONC]: { BaseHP: 38, Size: 20, MoveSpeed: 10, Str: 0, Dex: 0, Int: 15 }

        } as Record<ESpawnEntityClass, { BaseHP: number, Size: number, MoveSpeed: number, Str: number, Dex: number, Int: number }>;


        const bossMult = wave.Lvl % 5 === 0 && wave.Current === 0 ? 3 : 1;
        const eliteMult = Math.random() < totals.EliteChance ? 2 : 1;
        const powerMult = bossMult * eliteMult;

        let entityType = ESpawnEntityClass.WARIOR; // Math.floor(Math.random() * 3) as ESpawnEntityClass; // 0, 1, 2
        const rand = Math.random();
        if (wave.Lvl > 2 && rand < 0.30) entityType = ESpawnEntityClass.MONC;
        if (wave.Lvl > 4 && rand < 0.10) entityType = ESpawnEntityClass.ASSASIN;

        const monsterLevel = totals.MonsterLevel;
        const baseStats = EntityStatsService.Default();
        baseStats.Str = (spawnConfig[entityType].Str + monsterLevel * powerMult) * totals.DamageMult;
        baseStats.Dex = (spawnConfig[entityType].Dex + monsterLevel * powerMult) * totals.DamageMult;
        baseStats.Int = (spawnConfig[entityType].Int + monsterLevel * powerMult) * totals.DamageMult;
        baseStats.LifeMax = spawnConfig[entityType].BaseHP * powerMult * totals.HealthMult;
        baseStats.MovementSpeed = spawnConfig[entityType].MoveSpeed * totals.SpeedMult;
        baseStats.FireResist = totals.Resist;
        baseStats.ColdResist = totals.Resist;
        baseStats.LightResist = totals.Resist;


        //подбор подходящей экипировки
        const equipment = this.EquipmentEnemy(monsterLevel, baseStats.Str, baseStats.Dex, baseStats.Int, totals);
        const size = spawnConfig[entityType].Size + powerMult * 5;
        const mass = 50 * powerMult;

        const rawStats = new RawStats();
        for (const item of EquipmentService.All(equipment.Equipment))
            for (const [type, value] of item.Final) rawStats.Add(EntityStatsService.AffixToRaw(type as EAffixType, value));
        const finalStats = EntityStatsService.Resolve(rawStats, baseStats);

        const power = this.EnemyPower(finalStats);

        // ----- БЛОК ПОЗИЦИОНИРОВАНИЯ (спавн за пределами арены) -----
        const areaWidth = Graphics.Width;
        const areaHeight = Graphics.Height;
        let x = Math.random() * areaWidth;
        let y = Math.random() * areaHeight;
        const pad = size + 10; // отступ за границу арены, чтобы враг появлялся из-за края
        const side = Math.floor(Math.random() * 4); // случайная сторона: 0-верх, 1-низ, 2-лево, 3-право
        if (side === 0) { x = Math.random() * areaWidth; y = -pad; }
        if (side === 1) { x = Math.random() * areaWidth; y = areaHeight + pad; }
        if (side === 2) { x = -pad; y = Math.random() * areaHeight; }
        if (side === 3) { x = areaWidth + pad; y = Math.random() * areaHeight; }

        x = Math.min(areaWidth + 20, Math.max(-20, x));
        y = Math.min(areaHeight + 20, Math.max(-20, y));

        World.SetComponent(entity, baseStats);
        World.SetComponent(entity, new EntityStatsComponent(baseStats));
        World.SetComponent(entity, new PursuerComponent());
        World.SetComponent(entity, new VelocityComponent());
        World.SetComponent(entity, new RigidbodyComponent(size, mass));
        World.SetComponent(entity, new HealthComponent());
        World.SetComponent(entity, new Transform2DComponent(x, y));
        World.SetComponent(entity, new SpawnEntityComponent(power));
        World.SetComponent(entity, equipment);
    }

    private EnemyPower(stats: IEntityStats): number
    {
        // helpers
        const avg = (min: number, max: number) => (min + max) * 0.5;

        // --- 1. Оффенс: средний урон в секунду с учётом критов и стихий ---
        const physAvg = avg(stats.PhysicalDamageMin, stats.PhysicalDamageMax);
        const elemAvg = avg(stats.FireDamageMin, stats.FireDamageMax)
            + avg(stats.ColdDamageMin, stats.ColdDamageMax)
            + avg(stats.LightDamageMin, stats.LightDamageMax);

        const critFactor = 1 + stats.CriticalChance * (stats.CriticalMultiplier - 1);
        const dps = (physAvg + elemAvg) * stats.AttackSpeed * critFactor;

        // --- 2. Эффективное HP: HP + ES, усиленные защитой ---
        // Резисты берём как среднее, приводим к множителю получаемого урона
        const avgResist = (stats.FireResist + stats.ColdResist + stats.LightResist) / 3;
        const resistFactor = 1 / Math.max(0.1, 1 - avgResist);          // 0% → 1, 50% → 2

        const armourFactor = 1 + Math.log10(1 + stats.Armour / 50) * 0.5;
        const evasionFactor = 1 + stats.Evasion / (stats.Evasion + 200); // 0..1 → 1..2
        const blockFactor = 1 + stats.Block * 0.5;

        const ehp = (stats.LifeMax + stats.ES)
            * resistFactor
            * armourFactor
            * evasionFactor
            * blockFactor;

        // --- 3. Мобильность: слабый, но нелинейный вклад ---
        //const mobility = 1 + Math.max(0, stats.MovementSpeed - 20) / 100;

        // --- 4. Итоговый рейтинг ---
        // Нормируем dps и ehp в «очки», чтобы порядки были сопоставимы
        const dpsScore = Math.sqrt(dps) * 2;   // 100 dps → 20
        const ehpScore = Math.sqrt(ehp) * 0.6; // 1000 ehp → ~19
        //const gearScore = EquipmentService.All(equipment).length * 6;

        //return (dpsScore + ehpScore) * mobility + gearScore;
        return dpsScore + ehpScore;
    }

    private EquipmentEnemy(level: number, str: number, dex: number, int: number, waveStats: IWaveStats): EquipmentComponent
    {
        // раритет экипировки с зависимостью от уровня
        // чем выше level, тем больше шанс высокого раритета
        const maxLevel = 50;
        const t = Math.min(1, Math.max(0, level / maxLevel + waveStats.ItemRarityBonus / 100)); // 0..1

        // Базовые пороги: rarity=0 при roll < p0, rarity=1 при roll < p1, иначе rarity=2
        // С ростом уровня p0 и p1 уменьшаются => выше шанс rarity=2
        const p0 = 0.7 * (1 - t) + 0.1 * t; // 0.7 -> 0.1
        const p1 = 0.9 * (1 - t) + 0.4 * t; // 0.9 -> 0.4

        let rarity = 2;
        const roll = Math.random();
        if (roll < p0) rarity = 0;
        else if (roll < p1) rarity = 1;

        const equipment = new Equipment();

        // Оружие одевается всегда
        const weapon = ItemFactory.Random(level, EItemTag.WEAPON, str, dex, int);
        if (weapon) EquipmentService.Equip(equipment, weapon);

        if (rarity === 0) return new EquipmentComponent(equipment);

        // Список слотов для добора (без оружия)
        const slots: Array<{ tag: EItemTag, chance: number }> = [
            { tag: EItemTag.HELM, chance: 0.7 },
            { tag: EItemTag.BODY_ARMOUR, chance: 0.7 },
            { tag: EItemTag.GLOVES, chance: 0.7 },
            { tag: EItemTag.AMULET, chance: 0.7 },
            { tag: EItemTag.RING, chance: 0.7 },
            { tag: EItemTag.BELT, chance: 0.7 },
            { tag: EItemTag.BOOTS, chance: 0.7 },
        ];

        // Сколько предметов нужно добрать
        let targetExtra: number;
        if (rarity === 1)
        {
            // от 2 до 4 предметов ВСЕГО (включая оружие)
            const totalTarget = 2 + Math.floor(Math.random() * 3); // 2..4
            targetExtra = totalTarget - 1; // минус уже надетое оружие
        } else
        {
            // rarity = 2: пробуем надеть всё с обычным шансом
            targetExtra = slots.length;
        }

        // Перемешиваем слоты, чтобы рандомизировать выбор
        for (let i = slots.length - 1; i > 0; i--)
        {
            const j = Math.floor(Math.random() * (i + 1));
            [slots[i], slots[j]] = [slots[j], slots[i]];
        }

        let equippedExtra = 0;
        for (const slot of slots)
        {
            if (equippedExtra >= targetExtra) break;
            if (Math.random() > Math.min(1, slot.chance * waveStats.ItemQuantityMult)) continue;

            const item = ItemFactory.Random(level, slot.tag, str, dex, int);
            if (item)
            {
                EquipmentService.Equip(equipment, item);
                equippedExtra++;
            }
        }

        return new EquipmentComponent(equipment);
    }
}


class SpawnRenderer implements IRenderer 
{
    Render(): void
    {
        const entityList = World.EntityQuery(RigidbodyComponent, Transform2DComponent, SpawnEntityComponent, EquipmentComponent);
        for (const entity of entityList)
        {
            const pos = World.GetComponent(entity, Transform2DComponent)!;
            const body = World.GetComponent(entity, RigidbodyComponent)!;
            const equipment = World.GetComponent(entity, EquipmentComponent)!;
            const spawn = World.GetComponent(entity, SpawnEntityComponent)!;

            // Определяем "раритет"
            let rarity = 0;
            if (spawn.Power > 40) rarity = 1;
            if (spawn.Power > 90) rarity = 2;

            let bodycolor = 0xD3D3D3; // обычный
            let outlineColor: number | null = 0x151d2b;

            if (rarity === 1) outlineColor = 0x1E90FF; // фиолетовая обводка
            if (rarity === 2) outlineColor = 0xffb703; // золотая обводка

            this.RenderBody(pos.X, pos.Y, body.Size, bodycolor, outlineColor);
            this.RenderEye(pos.X, pos.Y, body.Size);

            // Звёзды над монстром (1..3)
            let stars = 0;
            const itemCount = EquipmentService.All(equipment.Equipment).length;
            if (itemCount >= 2) stars = 1;
            if (itemCount >= 4) stars = 2;
            if (itemCount >= 7) stars = 3;

            if (stars > 0) this.RenderStars(pos.X, pos.Y - body.Size - 18, stars);
        }
    }

    private RenderBody(x: number, y: number, radius: number, fillColor: number, outlineColor: number)
    {
        Graphics.ShapeLayer.beginFill(fillColor);
        Graphics.ShapeLayer.drawCircle(x, y, radius);
        Graphics.ShapeLayer.endFill();
        //обводка
        Graphics.ShapeLayer.lineStyle(2.5, outlineColor);
        Graphics.ShapeLayer.drawCircle(x, y, radius);
        Graphics.ShapeLayer.lineStyle(2.5, 0x151d2b);
    }

    private RenderEye(x: number, y: number, radius: number)
    {
        Graphics.ShapeLayer.beginFill(0xf0f0f0);
        Graphics.ShapeLayer.drawCircle(x - radius * 0.3, y - radius * 0.2, radius * 0.22);
        Graphics.ShapeLayer.drawCircle(x + radius * 0.3, y - radius * 0.2, radius * 0.22);
        Graphics.ShapeLayer.endFill();
        Graphics.ShapeLayer.beginFill(0x1a1a2c);
        Graphics.ShapeLayer.drawCircle(x - radius * 0.3, y - radius * 0.1, radius * 0.12);
        Graphics.ShapeLayer.drawCircle(x + radius * 0.3, y - radius * 0.1, radius * 0.12);
        Graphics.ShapeLayer.endFill();
    }


    // Рисует N звёзд по центру над монстром
    // Рисует N звёзд-иконок по центру над монстром
    private RenderStars(cx: number, cy: number, count: number)
    {
        const style = new PIXI.TextStyle({
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: 12,
            fontWeight: 'bold',
            fill: 0xFFD700,          // золотой цвет звёзд
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        });

        const spacing = 12;
        const startX = cx - (count - 1) * spacing * 0.5;

        for (let i = 0; i < count; i++)
        {
            const x = startX + i * spacing;
            const starLabel = new PIXI.Text('★', style); // U+2605 — закрашенная звезда
            starLabel.anchor.set(0.5, 0.5);
            starLabel.position.set(x, cy);
            Graphics.TextLayer.addChild(starLabel);
        }
    }
}


interface IWaveModifierView
{
    Icon: string;
    Title: string;
    Description: string;
    CssClass: string;
}

class UI
{
    private static readonly PAUSE_SOURCE = "dialog:wave";

    private static readonly WaveEffectLabels: Record<EWaveEffectType, string> = {
        [EWaveEffectType.MONSTER_COUNT]: "Кол-во врагов",
        [EWaveEffectType.MONSTER_LEVEL]: "Уровень монстров",
        [EWaveEffectType.MONSTER_HEALTH]: "Здоровье монстров",
        [EWaveEffectType.MONSTER_DAMAGE]: "Урон монстров",
        [EWaveEffectType.MONSTER_SPEED]: "Скорость монстров",
        [EWaveEffectType.MONSTER_RESIST]: "Сопр. монстров",
        [EWaveEffectType.SPAWN_SPEED]: "Скорость спавна",
        [EWaveEffectType.ELITE_CHANCE]: "Шанс элиты",
        [EWaveEffectType.ITEM_QUANTITY]: "Кол-во предметов",
        [EWaveEffectType.ITEM_RARITY]: "Редкость предметов",
    };

    private static readonly WaveResources: Record<string, IWaveModifierView> = {
        horde: { Icon: "👥", Title: "Орда", Description: "В волне заметно больше врагов", CssClass: "dmg" },
        legion: { Icon: "👥", Title: "Легион", Description: "К волне добавляются новые враги", CssClass: "dmg" },
        veterans: { Icon: "⬆️", Title: "Ветераны", Description: "Монстры приходят более высокого уровня", CssClass: "crit" },
        toughened: { Icon: "🛡️", Title: "Закалённые", Description: "У монстров больше здоровья", CssClass: "def" },
        savage: { Icon: "⚔️", Title: "Свирепость", Description: "Монстры наносят больше урона", CssClass: "fire" },
        swift: { Icon: "💨", Title: "Стремительные", Description: "Монстры быстрее, а спавн чаще", CssClass: "spd" },
        surge: { Icon: "⚡", Title: "Прорыв", Description: "Враги появляются почти без паузы", CssClass: "spd" },
        warded: { Icon: "🔷", Title: "Защищённые", Description: "У монстров выше сопротивления", CssClass: "res" },
        greed: { Icon: "💰", Title: "Алчность", Description: "Больше врагов и больше добычи", CssClass: "light" },
        avidity: { Icon: "💎", Title: "Жадность", Description: "Больше и качественнее добыча", CssClass: "light" },
        elite: { Icon: "⭐", Title: "Элита", Description: "Выше шанс элитного монстра", CssClass: "crit" },
        cursed: { Icon: "☠️", Title: "Проклятые", Description: "Крепкие и стойкие монстры", CssClass: "res" },
        bloodlust: { Icon: "🩸", Title: "Кровавая жажда", Description: "Жестокие и частые враги", CssClass: "fire" },
    };

    private waveNotification: HTMLElement;
    private waveNumber: HTMLElement;
    private waveSub: HTMLElement;
    private statWave: HTMLElement;
    private statEnemiesLeft: HTMLElement;
    private wasChoiceOpen: boolean = false;


    constructor(
        ticker: Ticker,
        private gameStateService: GameStateService = new GameStateService(),
        private waveDialog: UIDialog = new UIDialog("wave"),
        private waveService: WaveService = new WaveService())
    {
        ticker.OnTick((d) => this.Refresh());

        this.waveNotification = document.getElementById('waveNotification')!;
        this.waveNumber = document.getElementById('waveNumber')!;
        this.waveSub = document.getElementById('waveSub')!;
        this.statWave = document.getElementById('statWave')!;
        this.statEnemiesLeft = document.getElementById('statEnemiesLeft')!;
    }

    Refresh(): void
    {
        this.ShowStats();
        this.ShowNextWave();
        this.ShowWaveChoice();
    }

    private ShowStats(): void
    {
        const waveEntity = World.EntityFirst(SpawnComponent);
        if (!waveEntity) return;

        const wave = World.GetComponent(waveEntity, SpawnComponent)!;

        const enemiesAlive = World.EntityQuery(SpawnEntityComponent).length;
        this.statWave.textContent = String(wave.Lvl || 1);
        this.statEnemiesLeft.textContent = String(enemiesAlive);
    }

    private ShowNextWave(): void
    {
        const waveEntity = World.EntityFirst(SpawnComponent);
        if (!waveEntity) return;

        const wave = World.GetComponent(waveEntity, SpawnComponent)!;
        const isPreparing = wave.PrepareTimer > 0;
        const isAlreadyShown = this.waveNotification.classList.contains('show');

        if (isAlreadyShown && !isPreparing)
        {
            this.waveNotification.classList.remove('show');
            return;
        }

        if (!isAlreadyShown && isPreparing)
        {
            const isBossWave = wave.Lvl % 5 === 0;
            this.waveNumber.textContent = String(wave.Lvl);
            this.waveSub.textContent = isBossWave ? '👑 БОСС ИДЁТ!' : `⚔️ ${wave.Max} врагов`;
            this.waveNotification.classList.add('show');
        }
    }

    private ShowWaveChoice(): void
    {
        const gameState = World.SingleComponent(GameStateComponent)!.GameState;
        if (gameState.State === EGameState.OVER) return;

        const spawnEntity = World.EntityFirst(SpawnComponent, WaveChooseComponent);

        // выбор сделан — закрываем диалог и снимаем паузу
        if (this.wasChoiceOpen && !spawnEntity)
        {
            this.wasChoiceOpen = false;
            this.waveDialog.Close();
            this.gameStateService.Resume(gameState, UI.PAUSE_SOURCE);
            return;
        }

        if (!spawnEntity) return;
        if (this.waveDialog.Visibled) return;

        const choose = World.GetComponent(spawnEntity, WaveChooseComponent)!;
        if (choose.Offers.length === 0) return;

        this.waveDialog.Open();
        this.wasChoiceOpen = true;
        this.gameStateService.Pause(gameState, UI.PAUSE_SOURCE);
        this.ShowOffers(spawnEntity, choose);
    }

    private ShowOffers(spawnEntity: EntityId, choose: WaveChooseComponent): void
    {
        this.waveDialog.Container.innerHTML = '';

        const cardContainer = document.createElement("div");
        cardContainer.className = "bonus-cards";

        for (const mod of choose.Offers)
        {
            const card = this.BuildWaveCard(mod);
            card.addEventListener("click", () =>
            {
                const wave = World.GetComponent(spawnEntity, SpawnComponent)!;
                wave.Modifiers.push(mod);

                wave.Lvl++;
                wave.Current = 0;
                wave.Killed = 0;
                wave.SpawnTimer = 0;
                wave.PrepareTimer = 2;
                wave.Max = this.waveService.Stats(wave.Modifiers).MaxCount;


                World.RemoveComponent(spawnEntity, WaveChooseComponent);
            });

            cardContainer.appendChild(card);
        }

        this.waveDialog.Container.appendChild(cardContainer);
    }

    private BuildWaveCard(offer: IWaveModifier): HTMLElement
    {
        const view = UI.WaveResources[offer.Id] ?? {
            Icon: "❓",
            Title: offer.Id,
            Description: "Модификатор волны",
            CssClass: "",
        };

        const effectLines = offer.Effects
            .map((e) =>
            {
                const label = UI.WaveEffectLabels[e.Type] ?? e.Type;
                return `<div class="wave-effect"><span class="wave-effect-label">${label}</span><span class="wave-effect-value">${this.FormatWaveEffect(e)}</span></div>`;
            })
            .join("");

        const card = document.createElement("div");
        card.className = `bonus-card ${view.CssClass}`;
        card.innerHTML = `
            <div class="bonus-icon">${view.Icon}</div>
            <div class="bonus-title">${view.Title}</div>
            <div class="wave-effects">${effectLines}</div>
            <div class="bonus-desc">${view.Description}</div>`;

        return card;
    }

    private FormatWaveEffect(effect: IWaveEffect): string
    {
        const sign = effect.Min >= 0 ? "+" : "";
        if (effect.ValueType === EWaveValueType.PERCENT || effect.ValueType === EWaveValueType.PERCENT_POINT) return `${sign}${effect.Min}%`;
        return `${sign}${effect.Min}`;
    }

}
//#endregion


export function InitSpawnModule(ticker: Ticker): void
{
    World.SystemAdd(new SpawnSystem());
    Graphics.RendererAdd(new SpawnRenderer());
    new UI(ticker);
}

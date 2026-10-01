import { Logger, IRenderer, System, World, Graphics, Ticker } from "./core";
import { GameStateComponent, EGameState } from "./gamestate";
import { HealthComponent } from "./health";
import { Transform2DComponent, VelocityComponent } from "./movement";
import { RigidbodyComponent } from "./physics";
import { EntityStatsComponent, EntityStatsService, IEntityStats, RawStats } from "./stats";
import { EquipmentComponent, Equipment, EquipmentService } from "./equipment";
import { EItemTag, ItemFactory, EAffixType } from "./items";
import { FractionComponent, PursuerComponent } from "./targeting";

declare const PIXI: any;

export enum ESpawnEntityClass { WARIOR, ASSASIN, MONC }
export class SpawnEntityComponent { Type: ESpawnEntityClass; constructor(public Power: number) { } }
export class SpawnComponent
{
    Lvl: number = 0;
    Max: number = 0;
    Current: number = 0;
    Killed: number = 0;
    SpawnTimer: number = 0;
    DurationTimer: number = 0;
    PrepareTimer: number = 2;
}

//#region ФИЧА: монстры

class SpawnSystem implements System
{
    private readonly WAVE_DURATION = 60; // полная длительность

    constructor()
    {

    }

    public Update(deltaTime: number): void
    {
        const gameState = World.SingleComponent(GameStateComponent)!.GameState;
        if (gameState.State == EGameState.PAUSE || gameState.State == EGameState.OVER) return;

        //удаляем мертвые сущности
        const deathList = World.EntityQuery(SpawnEntityComponent, HealthComponent).filter(e => World.GetComponent(e, HealthComponent)!.LifeCurrent <= 0);
        for (const entity of deathList) World.EntityRemove(entity);

        let waveEntity = World.EntityFirst(SpawnComponent);

        if (gameState.State == EGameState.INIT)
        {
            if (waveEntity) { World.EntityRemove(waveEntity); waveEntity = null; }
            const entityList = World.EntityQuery(SpawnEntityComponent);
            for (const entity of entityList) World.EntityRemove(entity);
        }

        if (waveEntity === null) waveEntity = World.EntityCreate().SetComponent(new SpawnComponent()).Entity;

        const wave = World.GetComponent(waveEntity, SpawnComponent)!;
        //время для новой волны
        if (wave.DurationTimer <= 0)
        {
            wave.Lvl++;
            wave.Max = Math.min(5 + wave.Lvl * 1.5, 30);
            wave.Current = 0;
            wave.Killed = 0;
            wave.SpawnTimer = 2;
            wave.PrepareTimer = 2;
            wave.DurationTimer = this.WAVE_DURATION;
            return;
        }

        //время на подготовку к влоне
        if (wave.PrepareTimer > 0)
        {
            wave.PrepareTimer = Math.max(0, wave.PrepareTimer - deltaTime);
            return;
        }

        wave.DurationTimer = Math.max(0, wave.DurationTimer - deltaTime);

        // Спавним врагов
        wave.SpawnTimer -= deltaTime;
        if (wave.SpawnTimer <= 0 && wave.Current < wave.Max)
        {
            this.SpawnEnemy(wave);
            wave.Current++;
            wave.SpawnTimer = 2;//TODO подумать над спавн таймером Math.max(0.15, 1 - wave.level * 0.03);
        }

        // Если всех заспавнили и врагов не осталось - завершаем волну
        if (wave.Current >= wave.Max)
        {
            const enemiesAlive = World.EntityQuery(SpawnEntityComponent).length;
            if (enemiesAlive === 0) wave.DurationTimer = 0;
        }
    }

    private SpawnEnemy(wave: SpawnComponent): void
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


        const bossMult = wave.Lvl % 5 === 0 && wave.Current == 0 ? 3 : 1;

        let entityType = ESpawnEntityClass.WARIOR; // Math.floor(Math.random() * 3) as ESpawnEntityClass; // 0, 1, 2
        const rand = Math.random();
        if (wave.Lvl > 2 && rand < 0.30) entityType = ESpawnEntityClass.MONC;
        if (wave.Lvl > 4 && rand < 0.10) entityType = ESpawnEntityClass.ASSASIN;

        const baseStats = EntityStatsService.Default();
        baseStats.Str = spawnConfig[entityType].Str + wave.Lvl * bossMult;
        baseStats.Dex = spawnConfig[entityType].Dex + wave.Lvl * bossMult;
        baseStats.Int = spawnConfig[entityType].Int + wave.Lvl * bossMult;
        baseStats.LifeMax = spawnConfig[entityType].BaseHP * bossMult;
        baseStats.MovementSpeed = spawnConfig[entityType].MoveSpeed;


        //подбор подходящей экипировки
        const equipment = this.EquipmentEnemy(wave.Lvl, baseStats.Str, baseStats.Dex, baseStats.Int);
        const size = spawnConfig[entityType].Size + bossMult * 5;
        const mass = 50 * bossMult;

        const rawStats = new RawStats();
        for (const item of EquipmentService.All(equipment.Equipment))
            for (const [type, value] of item.Final) rawStats.Add(EntityStatsService.AffixToRaw(type as EAffixType, value));
        const finalStats = EntityStatsService.Resolve(rawStats, baseStats);

        const power = this.SpawnEnemyPower(finalStats);

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

    private SpawnEnemyPower(stats: IEntityStats): number
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

    private EquipmentEnemy(level: number, str: number, dex: number, int: number): EquipmentComponent
    {
        // раритет экипировки с зависимостью от уровня
        // чем выше level, тем больше шанс высокого раритета
        const maxLevel = 50;
        const t = Math.min(1, Math.max(0, level / maxLevel)); // 0..1

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
            if (Math.random() > slot.chance) continue;

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


class UI
{
    private waveNotification: HTMLElement;
    private waveNumber: HTMLElement;
    private waveSub: HTMLElement;
    private statWave: HTMLElement;
    private statEnemiesLeft: HTMLElement;
    private statWaveTimer: HTMLElement;


    constructor(ticker: Ticker)
    {
        ticker.OnTick((d) => this.Refresh());

        this.waveNotification = document.getElementById('waveNotification')!;
        this.waveNumber = document.getElementById('waveNumber')!;
        this.waveSub = document.getElementById('waveSub')!;
        this.statWave = document.getElementById('statWave')!;
        this.statEnemiesLeft = document.getElementById('statEnemiesLeft')!;
        this.statWaveTimer = document.getElementById('statWaveTimer')!;
    }

    Refresh(): void
    {
        this.ShowStats();
        this.ShowNextWave();
    }

    private ShowStats(): void
    {
        const waveEntity = World.EntityFirst(SpawnComponent);
        if (!waveEntity) return;

        const wave = World.GetComponent(waveEntity, SpawnComponent)!;

        const displayTime = Math.max(0, Math.ceil(wave.DurationTimer));
        this.statWaveTimer.textContent = displayTime + 'с';
        this.statWaveTimer.className = 'stat-value timer-value';
        if (displayTime <= 5) this.statWaveTimer.classList.add('warning');

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

}
//#endregion


export function InitSpawnModule(ticker: Ticker): void
{
    World.SystemAdd(new SpawnSystem());
    Graphics.RendererAdd(new SpawnRenderer());
    new UI(ticker);
}

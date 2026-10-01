import { EntityId, IComponent, IRenderer, System, World, Graphics } from "./core";
import { EGameState, GameStateComponent } from "./gamestate";
import { Transform2DComponent } from "./movement";
import { RigidbodyComponent } from "./physics";
import { EntityStatsComponent } from "./stats";
import { FractionComponent } from "./targeting";
import { HealthComponent } from "./health";
import { StunComponent } from "./stun";
import { UIDialog } from "./dialog";
declare const PIXI: any;


//#region ФИЧА: атаки

export enum EAttackType
{
    PHYSICAL = 'PHYSICAL',     // Физический урон (мечи, стрелы)
    FIRE = 'FIRE',             // Огненный урон
    COLD = 'COLD',             // Ледяной урон
    LIGHT = 'LIGHT'           // Урон молнией
    // BLEED = 'bleed',           // Кровотечение
    // POISON = 'poison',         // Яд
    // BURN = 'burn',             // Ожог (отдельно от fire, т.к. может быть DoT)
    // SHADOW = 'shadow',         // Теневой урон
    // HOLY = 'holy',             // Святой урон
    // TRUE = 'true',             // Истинный урон (игнорирует всю защиту, кроме иммунитетов)
    // CHAOS = 'chaos'            // Хаотический урон (случайный тип)
}

class AttackInterval { constructor(public Value: number = 1) { } }
export class AttackHitComponent implements IComponent 
{
    public Phys: number = 0;
    public Fire: number = 0;
    public Cold: number = 0;
    public Light: number = 0;
    public IsCrit: boolean = false;

    constructor(public Source: EntityId, public Target: EntityId) { }
}

class AttackSystem implements System
{
    constructor(private dialog: UIDialog = new UIDialog("weapon"))
    {

    }

    public Update(deltaTime: number): void
    {
        const gameState = World.GetComponent(World.EntityFirst(GameStateComponent)!, GameStateComponent)!.GameState;
        if (gameState.State == EGameState.PAUSE || gameState.State == EGameState.OVER) return;

        const hitList = World.EntityQuery(AttackHitComponent);
        for (const hit of hitList) World.EntityRemove(hit);

        const sourceList = World.EntityQuery(Transform2DComponent, RigidbodyComponent, EntityStatsComponent, FractionComponent);

        for (const source of sourceList)
        {
            // оглушённые не атакуют
            if (World.HasComponent(source, StunComponent)) continue;

            // проверка готовности удара
            const cooldown = World.GetComponent(source, AttackInterval);
            if (cooldown)
            {
                if (cooldown.Value > 0)
                {
                    cooldown.Value -= deltaTime;
                    continue;
                }

                World.RemoveComponent(source, AttackInterval);
            }

            // сбор данных источника удара
            const sourcePos = World.GetComponent(source, Transform2DComponent)!;
            const sourceBody = World.GetComponent(source, RigidbodyComponent)!;
            const sourceFraction = World.GetComponent(source, FractionComponent)!;
            const sourceStats = World.GetComponent(source, EntityStatsComponent)!.Final;

            // поиск ближайшего врага в радиусе
            const target = World.EntityQuery(Transform2DComponent, RigidbodyComponent, FractionComponent).filter(id =>
            {
                const targetGroup = World.GetComponent(id, FractionComponent)!;
                return targetGroup.Value != sourceFraction.Value;
            }).reduce<{ entity: any; distance: number } | null>((nearest, target) =>
            {
                const targetPos = World.GetComponent(target, Transform2DComponent)!;
                const targetBody = World.GetComponent(target, RigidbodyComponent)!;
                const dx = targetPos.X - sourcePos.X;
                const dy = targetPos.Y - sourcePos.Y;
                const dist = Math.hypot(dx, dy) - targetBody.Size;
                const sourceAttackDistance = sourceBody.Size + sourceStats.AttackRange;
                if (dist > sourceAttackDistance) return nearest;

                if (!nearest || dist < nearest.distance) return { entity: target, distance: dist };
                return nearest;
            }, null);

            if (!target) continue;

            // кулдаун
            const cooldownValue = sourceStats.AttackSpeed > 0 ? 1 / sourceStats.AttackSpeed : 0;
            World.SetComponent(source, new AttackInterval(cooldownValue));

            // генерация сырого урона
            const hit = new AttackHitComponent(source, target.entity);
            hit.Phys = Math.floor(sourceStats.PhysicalDamageMin + Math.random() * (sourceStats.PhysicalDamageMax - sourceStats.PhysicalDamageMin + 1));
            hit.Fire = Math.floor(sourceStats.FireDamageMin + Math.random() * (sourceStats.FireDamageMax - sourceStats.FireDamageMin + 1));
            hit.Cold = Math.floor(sourceStats.ColdDamageMin + Math.random() * (sourceStats.ColdDamageMax - sourceStats.ColdDamageMin + 1));
            hit.Light = Math.floor(sourceStats.LightDamageMin + Math.random() * (sourceStats.LightDamageMax - sourceStats.LightDamageMin + 1));

            const isCrit = Math.random() * 100 < sourceStats.CriticalChance;
            hit.IsCrit = isCrit;
            if (isCrit) { hit.Phys *= sourceStats.CriticalMultiplier; hit.Fire *= sourceStats.CriticalMultiplier; hit.Cold *= 2; hit.Light *= sourceStats.CriticalMultiplier; }

            World.EntityCreate().SetComponent(hit);
        }
    }
}


class AttackRenderer implements IRenderer
{

    public Render(): void
    {
        const entityList = World.EntityQuery(EntityStatsComponent, Transform2DComponent, RigidbodyComponent);
        for (const entity of entityList)
        {
            const pos = World.GetComponent(entity, Transform2DComponent)!;
            const body = World.GetComponent(entity, RigidbodyComponent)!;
            const stats = World.GetComponent(entity, EntityStatsComponent)!.Final;
            const hitCooldown = World.GetComponent(entity, AttackInterval);
            const speed = stats.AttackSpeed || 1;
            const color = this.GetAttackColor(stats);

            this.RenderRange(pos.X, pos.Y, body.Size + stats.AttackRange, hitCooldown ? false : true, color, speed / 100);
            //this.RenderWeapon(pos.X, pos.Y, 15, body.Size + stats.AttackRange, 0x4a7fc7, "sword");
        }
    }

    private RenderRange(
        x: number, y: number,
        radius: number,
        enabled: boolean,
        color: number,
        attackSpeed: number
    ): void
    {
        const g = Graphics.ShapeLayer;
        const drawColor = enabled ? color : 0xff4444;

        // Период мерцания = период атаки
        // В кулдауне — медленное "дежурное" дыхание
        const periodMs = enabled ? 1000 / Math.max(0.1, attackSpeed) : 2000;

        const phase = (Date.now() % periodMs) / periodMs;
        const pulse = Math.sin(phase * Math.PI * 2) * 0.5 + 0.5;

        const baseAlpha = enabled ? 0.18 : 0.18;
        //const fillAlpha = baseAlpha * (0.4 + pulse * 0.6);
        const fillAlpha = baseAlpha * 0.4;
        const lineAlpha = baseAlpha * 0.8;

        g.lineStyle(1, drawColor, lineAlpha);
        g.drawCircle(x, y, radius);

        g.beginFill(drawColor, fillAlpha);
        g.drawCircle(x, y, radius);
        g.endFill();

        const halo = this.LightenColor(drawColor, 1.6);
        g.lineStyle(1, halo, lineAlpha * 0.4);
        g.drawCircle(x, y, radius + 4);

        g.lineStyle(1, halo, lineAlpha * 0.2);
        g.drawCircle(x, y, radius + 8);
    }

    /** Осветлить цвет (factor > 1 — светлее, < 1 — темнее). */
    private LightenColor(color: number, factor: number): number
    {
        const r = Math.min(255, Math.floor(((color >> 16) & 0xff) * factor));
        const g = Math.min(255, Math.floor(((color >> 8) & 0xff) * factor));
        const b = Math.min(255, Math.floor((color & 0xff) * factor));
        return (r << 16) | (g << 8) | b;
    }

    /** Смешать два цвета. t=0 → colorA, t=1 → colorB. */
    private MixColor(colorA: number, colorB: number, t: number): number
    {
        const ar = (colorA >> 16) & 0xff, ag = (colorA >> 8) & 0xff, ab = colorA & 0xff;
        const br = (colorB >> 16) & 0xff, bg = (colorB >> 8) & 0xff, bb = colorB & 0xff;
        const r = Math.round(ar + (br - ar) * t);
        const g = Math.round(ag + (bg - ag) * t);
        const b = Math.round(ab + (bb - ab) * t);
        return (r << 16) | (g << 8) | b;
    }
    private GetAttackColor(stats: any): number
    {
        const phys = stats.PhysicalDamageMax || 0;
        const fire = stats.FireDamageMax || 0;
        const cold = stats.ColdDamageMax || 0;
        const light = stats.LightDamageMax || 0;

        const max = Math.max(phys, fire, cold, light);
        if (max <= 0) return 0xb8a888;

        if (max === fire) return 0xff5533;
        if (max === cold) return 0x55ddff;
        if (max === light) return 0xffee44;
        return 0xb8a888; // physical — тёплый нейтральный
    }

}



//#endregion

//#region ФИЧА: защита
export class DefenceEvasionComponent implements IComponent { constructor(public Source: EntityId, public Target: EntityId) { } }
export class DefenceBlockComponent implements IComponent { constructor(public Source: EntityId, public Target: EntityId) { } }
export class DefenceSystem implements System
{
    public Update(deltaTime: number): void
    {
        const gameState = World.GetComponent(World.EntityFirst(GameStateComponent)!, GameStateComponent)!.GameState;
        if (gameState.State == EGameState.PAUSE || gameState.State == EGameState.OVER) return;

        const evasionList = World.EntityQuery(DefenceEvasionComponent);
        for (const evasion of evasionList) World.EntityRemove(evasion);

        const blockList = World.EntityQuery(DefenceBlockComponent);
        for (const block of blockList) World.EntityRemove(block);

        const hitList = World.EntityQuery(AttackHitComponent);
        for (const entity of hitList)
        {
            const hit = World.GetComponent(entity, AttackHitComponent)!;

            const sourceStats = World.GetComponent(hit.Source, EntityStatsComponent)?.Final;
            const targetStats = World.GetComponent(hit.Target, EntityStatsComponent)?.Final;
            if (!targetStats) { World.EntityRemove(entity); continue; }

            // --- 1. Попадание (Accuracy vs Evasion) ---
            if (sourceStats)
            {
                const accuracy = sourceStats.Accuracy;
                const evasion = targetStats.Evasion;

                // защита от NaN при нулевых статах
                const denom = accuracy + evasion * 0.5;
                const chanceToHit = denom > 0 ? accuracy / denom : 1;

                const maxChanceToHit = 0.95;
                const minChanceToHit = 0.05;
                const clampedChance = Math.max(minChanceToHit, Math.min(maxChanceToHit, chanceToHit));

                if (Math.random() > clampedChance)
                {
                    World.EntityCreate().SetComponent(new DefenceEvasionComponent(hit.Source, hit.Target));
                    World.EntityRemove(entity);
                    continue;
                }
            }

            // --- 2. Блок ---
            if (Math.random() * 100 < targetStats.Block)
            {
                World.EntityCreate().SetComponent(new DefenceBlockComponent(hit.Source, hit.Target));
                World.EntityRemove(entity);
                continue;
            }

            // --- 3. Броня и сопротивления ---
            hit.Phys = hit.Phys * (1 - Math.min(targetStats.Armour / (targetStats.Armour + hit.Phys * 5), 0.9)) * (1 - targetStats.PhysReduction / 100);
            hit.Fire = hit.Fire * (1 - Math.min(targetStats.FireResist / 100, 0.9));
            hit.Cold = hit.Cold * (1 - Math.min(targetStats.ColdResist / 100, 0.9));
            hit.Light = hit.Light * (1 - Math.min(targetStats.LightResist / 100, 0.9));


            // --- 4. Отраженный урон ---
            if (targetStats.PhysReflect > 0)
            {
                const reflectHit = new AttackHitComponent(hit.Target, hit.Source);
                reflectHit.Phys = targetStats.PhysReflect;
                World.EntityCreate().SetComponent(reflectHit);
            }
        }
    }
}

//#endregion

//#region ФИЧА: урон

export class DamageSystem implements System
{
    public Update(deltaTime: number): void
    {
        const gameState = World.GetComponent(World.EntityFirst(GameStateComponent)!, GameStateComponent)!.GameState;
        if (gameState.State == EGameState.PAUSE || gameState.State == EGameState.OVER) return;

        const hitList = World.EntityQuery(AttackHitComponent);
        for (const entity of hitList)
        {
            //повреждения
            const damage = World.GetComponent(entity, AttackHitComponent)!;
            const health = World.GetComponent(damage.Target, HealthComponent)!;
            let amount = damage.Phys + damage.Fire + damage.Cold + damage.Light;

            // Сначала ES
            if (Number.isNaN(health.EsCurrent)) health.EsCurrent = 0;
            if (Number.isNaN(health.LifeCurrent)) health.LifeCurrent = 0;

            const esAbsorb = Math.min(health.EsCurrent, amount);
            health.EsCurrent -= esAbsorb;
            amount -= esAbsorb;

            // Потом HP
            health.LifeCurrent -= amount;

            //нормализация
            health.EsCurrent = Math.max(0, health.EsCurrent);
            health.LifeCurrent = Math.max(0, health.LifeCurrent);
        }
    }
}

//#endregion

//#region ФИЧА: эффекты боя

export class BlockEffectComponent implements IComponent { constructor(public Source: EntityId, public Target: EntityId, public Lifetime: number, public Elapsed: number = 0) { } }
export class MissEffectComponent implements IComponent { constructor(public Source: EntityId, public Target: EntityId, public Lifetime: number, public Elapsed: number = 0) { } }
export class HitEffectComponent implements IComponent { constructor(public Source: EntityId, public Target: EntityId, public Amount: number, public IsCrit: boolean, public Lifetime: number, public Elapsed: number = 0) { } }

export class BattleEffectSystem implements System
{
    public Update(deltaTime: number): void
    {
        const gameState = World.GetComponent(World.EntityFirst(GameStateComponent)!, GameStateComponent)!.GameState;
        if (gameState.State == EGameState.PAUSE || gameState.State == EGameState.OVER) return;

        // 1. Читаем события — создаём эффекты
        const missEvents = World.EntityQuery(DefenceEvasionComponent);
        for (const eventId of missEvents)
        {
            const e = World.GetComponent(eventId, DefenceEvasionComponent)!;
            this.SpawnMissEffect(e.Source, e.Target);
        }

        const hitEvents = World.EntityQuery(AttackHitComponent);
        for (const eventId of hitEvents)
        {
            const e = World.GetComponent(eventId, AttackHitComponent)!;
            const total = e.Phys + e.Fire + e.Cold + e.Light;
            this.SpawnHitEffect(e.Source, e.Target, total, e.IsCrit);
        }

        const blockEvents = World.EntityQuery(DefenceBlockComponent);
        for (const eventId of blockEvents)
        {
            const e = World.GetComponent(eventId, DefenceBlockComponent)!;
            this.SpawnBlockEffect(e.Source, e.Target);
        }


        // 2. Тикаем эффекты — удаляем просроченные
        const missEffects = World.EntityQuery(MissEffectComponent);
        for (const entityId of missEffects)
        {
            const effect = World.GetComponent(entityId, MissEffectComponent)!;
            effect.Elapsed += deltaTime;
            if (effect.Elapsed >= effect.Lifetime) World.EntityRemove(entityId);
        }

        const hitEffects = World.EntityQuery(HitEffectComponent);
        for (const entityId of hitEffects)
        {
            const effect = World.GetComponent(entityId, HitEffectComponent)!;
            effect.Elapsed += deltaTime;
            if (effect.Elapsed >= effect.Lifetime) World.EntityRemove(entityId);
        }

        const blockEffects = World.EntityQuery(BlockEffectComponent);
        for (const entityId of blockEffects)
        {
            const effect = World.GetComponent(entityId, BlockEffectComponent)!;
            effect.Elapsed += deltaTime;
            if (effect.Elapsed >= effect.Lifetime) World.EntityRemove(entityId);
        }
    }

    private SpawnMissEffect(source: EntityId, target: EntityId): void
    {
        const targetBody = World.GetComponent(target, RigidbodyComponent)!;
        const targetPos = World.GetComponent(target, Transform2DComponent)!;
        const x = targetPos.X;
        const y = targetPos.Y - targetBody.Size;

        World.EntityCreate()
            .SetComponent(new Transform2DComponent(x, y))
            .SetComponent(new MissEffectComponent(source, target, 0.6));
    }

    private SpawnBlockEffect(source: EntityId, target: EntityId): void
    {
        const targetBody = World.GetComponent(target, RigidbodyComponent)!;
        const targetPos = World.GetComponent(target, Transform2DComponent)!;
        const x = targetPos.X;
        const y = targetPos.Y - targetBody.Size;

        World.EntityCreate()
            .SetComponent(new Transform2DComponent(x, y))
            .SetComponent(new BlockEffectComponent(source, target, 0.6));
    }

    private SpawnHitEffect(source: EntityId, target: EntityId, amount: number, isCrit: boolean): void
    {
        const targetBody = World.GetComponent(target, RigidbodyComponent)!;
        const targetPos = World.GetComponent(target, Transform2DComponent)!;
        const x = targetPos.X;
        const y = targetPos.Y - targetBody.Size;

        World.EntityCreate()
            .SetComponent(new Transform2DComponent(x, y))
            .SetComponent(new HitEffectComponent(source, target, amount, isCrit, 0.6));
    }
}

export class BattleEffectRenderer implements IRenderer
{

    public Render(): void
    {
        const missEffects = World.EntityQuery(MissEffectComponent, Transform2DComponent);
        for (const entity of missEffects)
        {
            const pos = World.GetComponent(entity, Transform2DComponent)!;
            const effect = World.GetComponent(entity, MissEffectComponent)!;
            const progress = Math.min(1, effect.Elapsed / Math.max(0.0001, effect.Lifetime));
            this.RenderEffect(pos.X, pos.Y, progress, 1 - progress, "MISS", 0xffffff);
        }

        const blockEffects = World.EntityQuery(BlockEffectComponent, Transform2DComponent);
        for (const entity of blockEffects)
        {
            const pos = World.GetComponent(entity, Transform2DComponent)!;
            const effect = World.GetComponent(entity, BlockEffectComponent)!;
            const progress = Math.min(1, effect.Elapsed / Math.max(0.0001, effect.Lifetime));
            this.RenderEffect(pos.X, pos.Y, progress, 1 - progress, "BLOCK", 0xffffff);
        }


        const hitEffects = World.EntityQuery(HitEffectComponent, Transform2DComponent);
        for (const entity of hitEffects)
        {
            const pos = World.GetComponent(entity, Transform2DComponent)!;
            const effect = World.GetComponent(entity, HitEffectComponent)!;
            const progress = Math.min(1, effect.Elapsed / Math.max(0.0001, effect.Lifetime));
            const color = effect.IsCrit ? 0xffff00 : 0xffffff;
            this.RenderEffect(pos.X, pos.Y, progress, 1 - progress, effect.Amount.toFixed(), color);
        }

    }

    private RenderEffect(x: number, y: number, progress: number, alpha: number, text: string, fill: number): void
    {
        // Всплытие вверх
        const rise = 32 * progress;
        const baseY = y - rise;

        // Лёгкий "pop" — увеличение в начале и возврат к норме
        const scale = 1 + 0.4 * Math.sin(progress * Math.PI);
        const style = new PIXI.TextStyle({
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: 14,
            fontWeight: 'bold',
            fill: fill,
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
        });

        const missLabel = new PIXI.Text(text, style);
        missLabel.anchor.set(0.5, 0.5);
        missLabel.position.set(x, baseY);
        missLabel.alpha = alpha;
        missLabel.scale.set(scale);

        Graphics.TextLayer.addChild(missLabel);
    }
}


//#endregion

export function InitAttackModule(): void
{
    World.SystemAdd(new AttackSystem());
    World.SystemAdd(new DefenceSystem());
    World.SystemAdd(new DamageSystem());
    World.SystemAdd(new BattleEffectSystem());

    Graphics.RendererAdd(new AttackRenderer());
    Graphics.RendererAdd(new BattleEffectRenderer());
}
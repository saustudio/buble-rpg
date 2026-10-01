import { EntityId, IComponent, IRenderer, System, World, Graphics } from "./core";
import { EGameState, GameStateComponent } from "./gamestate";
import { EntityStatsComponent } from "./stats";
import { HealthComponent } from "./health";
import { AttackHitComponent } from "./attack";
import { Transform2DComponent } from "./movement";
import { RigidbodyComponent } from "./physics";
declare const PIXI: any;

//#region ФИЧА: оглушение

export class StunComponent implements IComponent
{
    constructor(
        public Source: EntityId,
        public Duration: number,
        public Remaining: number = Duration
    ) { }
}

class StunSystem implements System
{
    /** Базовая длительность оглушения в секундах. */
    private static readonly BaseDuration = 1.0;
    /** Прибавка к шансу (%) за каждый 1% максимального здоровья цели, снятый ударом. */
    private static readonly ChancePerLifePercent = 50;
    /** Максимальное снижение длительности сопротивлением (%). */
    private static readonly MaxDurationReduction = 90;

    public Update(deltaTime: number): void
    {
        const gameState = World.GetComponent(World.EntityFirst(GameStateComponent)!, GameStateComponent)!.GameState;
        if (gameState.State == EGameState.PAUSE || gameState.State == EGameState.OVER) return;

        this.Tick(deltaTime);
        this.Apply();
    }

    /** Уменьшает оставшееся время оглушения и снимает его по истечении. */
    private Tick(deltaTime: number): void
    {
        const stunList = World.EntityQuery(StunComponent);
        for (const entity of stunList)
        {
            const stun = World.GetComponent(entity, StunComponent)!;
            stun.Remaining -= deltaTime;
            if (stun.Remaining <= 0) World.RemoveComponent(entity, StunComponent);
        }
    }

    /** Накладывает оглушение на цели состоявшихся ударов. */
    private Apply(): void
    {
        const hitList = World.EntityQuery(AttackHitComponent);
        for (const hitEntity of hitList)
        {
            const hit = World.GetComponent(hitEntity, AttackHitComponent)!;
            const targetStats = World.GetComponent(hit.Target, EntityStatsComponent)?.Final;
            const targetHealth = World.GetComponent(hit.Target, HealthComponent);
            if (!targetStats || !targetHealth || targetHealth.LifeCurrent <= 0) continue;

            const damage = hit.Phys + hit.Fire + hit.Cold + hit.Light;
            if (damage <= 0) continue;

            const sourceStats = World.GetComponent(hit.Source, EntityStatsComponent)?.Final;
            const effectiveLife = Math.max(1, targetStats.LifeMax + targetStats.ES);
            const baseChance = damage / effectiveLife * StunSystem.ChancePerLifePercent;
            const chance = Math.max(0, Math.min(100, baseChance + (sourceStats?.StunInc ?? 0) - targetStats.StunReduction));

            if (Math.random() * 100 >= chance) continue;

            const reduction = Math.max(0, Math.min(StunSystem.MaxDurationReduction, targetStats.StunDurationReduction)) / 100;
            const duration = Math.max(0.1,
                StunSystem.BaseDuration
                * (1 + (sourceStats?.StunDurationInc ?? 0) / 100)
                * (1 - reduction));

            const existing = World.GetComponent(hit.Target, StunComponent);
            if (existing)
            {
                existing.Duration = Math.max(existing.Duration, duration);
                existing.Remaining = Math.max(existing.Remaining, duration);
                continue;
            }

            World.SetComponent(hit.Target, new StunComponent(hit.Source, duration));
        }
    }
}

class StunRenderer implements IRenderer
{
    public Render(): void
    {
        const entityList = World.EntityQuery(StunComponent, Transform2DComponent, RigidbodyComponent);
        for (const entity of entityList)
        {
            const pos = World.GetComponent(entity, Transform2DComponent)!;
            const body = World.GetComponent(entity, RigidbodyComponent)!;

            this.RenderStunIcon(pos.X, pos.Y - body.Size - 26);
        }
    }

    private RenderStunIcon(x: number, y: number): void
    {
        const time = Date.now() / 1000;
        const style = new PIXI.TextStyle({
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: 18,
            fill: 0xffe066,
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        });

        const label = new PIXI.Text('💫', style);
        label.anchor.set(0.5, 0.5);
        label.position.set(x, y + Math.sin(time * 6) * 2);
        label.rotation = Math.sin(time * 3) * 0.3;
        Graphics.TextLayer.addChild(label);
    }
}

//#endregion

export function InitStunModule(): void
{
    World.SystemAdd(new StunSystem());
    Graphics.RendererAdd(new StunRenderer());
}

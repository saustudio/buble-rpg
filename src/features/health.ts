import { System, World, Logger, Graphics, IRenderer } from "./core";
import { GameStateComponent, EGameState } from "./gamestate";
import { EntityStatsComponent } from "./stats";
import { ExpComponent } from "./experience";
import { AttackHitComponent } from "./attack";
import { SpawnEntityComponent } from "./spawn";
import { Transform2DComponent } from "./movement";
import { RigidbodyComponent } from "./physics";
declare const PIXI: any;

//#region ФИЧА: здоровье

export class HealthComponent
{
    public LifeCurrent: number;
    public EsCurrent: number;
    public EsCurrentPrev: number;
    public EsRegenDelay: number = 10;
}
export class HealthSystem implements System
{
    public Update(deltaTime: number): void
    {
        const gameState = World.SingleComponent(GameStateComponent)!.GameState;
        if (gameState.State == EGameState.PAUSE || gameState.State == EGameState.OVER) return;


        const entities = World.EntityQuery(HealthComponent, EntityStatsComponent);
        for (const entity of entities)
        {
            const stats = World.GetComponent(entity, EntityStatsComponent)!.Final;
            const health = World.GetComponent(entity, HealthComponent)!;

            if (health.LifeCurrent === undefined) health.LifeCurrent = stats.LifeMax;
            if (health.EsCurrent === undefined) health.EsCurrent = stats.ES;
            if (health.EsCurrentPrev === undefined) health.EsCurrentPrev = health.EsCurrent;

            if (health.LifeCurrent <= 0) continue;

            if (health.EsCurrent < health.EsCurrentPrev) { health.EsRegenDelay = stats.ESRegenDelay; health.EsCurrentPrev = health.EsCurrent; }
            if (health.EsRegenDelay > 0) health.EsRegenDelay -= deltaTime;
            if (health.EsRegenDelay <= 0 && health.EsCurrent < stats.ES) { health.EsCurrent += stats.ES * stats.ESRegenRate / 100 * deltaTime; health.EsCurrentPrev = health.EsCurrent; }

            health.LifeCurrent += stats.LifePerSecond * deltaTime;


            //здоровье за убийство
            const hitList = World.EntityQuery(AttackHitComponent);
            for (const entity of hitList)
            {
                //повреждения
                const damage = World.GetComponent(entity, AttackHitComponent)!;
                const targetHealth = World.GetComponent(damage.Target, HealthComponent);
                if (!targetHealth || targetHealth.LifeCurrent > 0) continue;
                health.LifeCurrent += stats.LifePerKill;
            }


            //восстанавливаем здоровье если было повышение уровня
            const exp = World.GetComponent(entity, ExpComponent)!;
            if (exp && exp.Value > exp.Next) 
            {
                health.LifeCurrent = stats.LifeMax;
                health.EsCurrent = stats.ES;
            }

            health.LifeCurrent = Math.min(health.LifeCurrent, stats.LifeMax);
            health.EsCurrent = Math.min(health.EsCurrent, stats.ES);
        }

    }
}

export class HealthRenderer implements IRenderer
{
    Render(): void
    {
        const entities = World.EntityQuery(HealthComponent, EntityStatsComponent, Transform2DComponent, RigidbodyComponent);
        for (const entity of entities)
        {
            const health = World.GetComponent(entity, HealthComponent)!;
            const stats = World.GetComponent(entity, EntityStatsComponent)!.Final;
            const pos = World.GetComponent(entity, Transform2DComponent)!;
            const body = World.GetComponent(entity, RigidbodyComponent)!;

            if (health.LifeCurrent === undefined) continue;

            // Определяем стиль HP по наличию других компонентов
            const isEnemy = World.HasComponent(entity, SpawnEntityComponent);

            if (isEnemy) this.RenderHealthShort(pos.X, pos.Y, body.Size, health.LifeCurrent, stats.LifeMax);
            else this.RenderHealth(pos.X, pos.Y, body.Size, health.LifeCurrent, stats.LifeMax);
        }

    }

    private RenderHealth(x: number, y: number, radius: number, health: number, healthMax: number): void
    {
        const barWidth = radius * 2.4;
        const barHeight = 6;
        const barY = y - radius - 10;

        Graphics.ShapeLayer.beginFill(0x2a1f1f);
        Graphics.ShapeLayer.drawRect(x - barWidth / 2, barY, barWidth, barHeight);
        Graphics.ShapeLayer.endFill();

        Graphics.ShapeLayer.lineStyle(1, 0x1a1f2a, 0.6);
        Graphics.ShapeLayer.drawRect(x - barWidth / 2, barY, barWidth, barHeight);

        const hpPercent = health / healthMax;
        let fillColor = 0x44dd44;
        if (hpPercent < 0.3) fillColor = 0xdd4444;
        else if (hpPercent < 0.6) fillColor = 0xddcc44;

        const fillWidth = Math.max(0, barWidth * hpPercent);
        if (fillWidth > 0)
        {
            Graphics.ShapeLayer.beginFill(fillColor);
            Graphics.ShapeLayer.drawRect(x - barWidth / 2, barY, fillWidth, barHeight);
            Graphics.ShapeLayer.endFill();
        }

        Graphics.ShapeLayer.lineStyle(1, 0x88ccff, 0.2);
        Graphics.ShapeLayer.drawRect(x - barWidth / 2, barY, barWidth, barHeight);

        const style = new PIXI.TextStyle({
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: 9,
            fontWeight: 'bold',
            fill: 0xffffff,
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        });

        const hpLabel = new PIXI.Text(`${health.toFixed()}/${healthMax.toFixed()}`, style);
        hpLabel.anchor.set(0.5, 0.5);
        hpLabel.position.set(x, barY - 6);
        Graphics.TextLayer.addChild(hpLabel);

    }

    private RenderHealthShort(x: number, y: number, radius: number, health: number, healthMax: number)
    {
        // Добавляем health bar
        const barWidth = radius * 2 + 6;
        const barY = y - radius - 10;

        // Background
        Graphics.ShapeLayer.lineStyle(0);
        Graphics.ShapeLayer.beginFill(0x3a1f1f);
        Graphics.ShapeLayer.drawRect(x - barWidth / 2, barY, barWidth, 5);
        Graphics.ShapeLayer.endFill();

        // Health fill
        const hpPercent = health / healthMax;
        Graphics.ShapeLayer.beginFill(0xe34f4f);
        Graphics.ShapeLayer.drawRect(x - barWidth / 2, barY, barWidth * hpPercent, 5);
        Graphics.ShapeLayer.endFill();
    }
}

export function InitHealthModule(): void
{
    World.SystemAdd(new HealthSystem());
    Graphics.RendererAdd(new HealthRenderer());
}

//#endregion

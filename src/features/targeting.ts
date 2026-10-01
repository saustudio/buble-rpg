import { Input, Logger, IRenderer, System, World, EntityId, Graphics } from "./core";
import { EGameState, GameStateComponent } from "./gamestate";
import { EntityStatsComponent } from "./stats";
import { Transform2DComponent, VelocityComponent } from "./movement";
import { RigidbodyComponent } from "./physics";

//#region ФИЧА: целеуказание 

export class TargetComponent 
{
    public X: number
    public Y: number

}
//логика
class TargetSystem implements System
{
    constructor()
    {
        Logger.Info(TargetSystem.name, '✅ система успешно инициализирована');
    }

    public Update(deltaTime: number): void
    {
        const gameState = World.SingleComponent(GameStateComponent)!.GameState;
        if (gameState.State == EGameState.PAUSE || gameState.State == EGameState.OVER) return;

        const entityList = World.EntityQuery(TargetComponent, VelocityComponent, Transform2DComponent, RigidbodyComponent);
        for (const entity of entityList)
        {

            const target = World.GetComponent(entity, TargetComponent)!;
            const body = World.GetComponent(entity, RigidbodyComponent)!;
            const pos = World.GetComponent(entity, Transform2DComponent)!;
            const vel = World.GetComponent(entity, VelocityComponent)!;

            target.X = Input.Mouse.X;
            target.Y = Input.Mouse.Y;

            const dx = target.X - pos.X;
            const dy = target.Y - pos.Y;
            const dist = Math.hypot(dx, dy);

            if (dist > body.Size + 20) 
            {
                vel.DirX = dx / dist;
                vel.DirY = dy / dist;
            }

        }
    }

}
//визуализация
class TargetRenderer implements IRenderer
{
    public Render(): void
    {
        const entityList = World.EntityQuery(TargetComponent);
        for (const entity of entityList)
        {
            const target = World.GetComponent(entity, TargetComponent)!;
            const pos = World.GetComponent(entity, Transform2DComponent)!;

            Graphics.ShapeLayer.lineStyle(2, 0x44ddff, 0.6);
            Graphics.ShapeLayer.drawCircle(target.X, target.Y, 8);
            Graphics.ShapeLayer.lineStyle(2, 0x44ddff, 0.4);
            Graphics.ShapeLayer.moveTo(target.X - 10, target.Y);
            Graphics.ShapeLayer.lineTo(target.X + 10, target.Y);
            Graphics.ShapeLayer.moveTo(target.X, target.Y - 10);
            Graphics.ShapeLayer.lineTo(target.X, target.Y + 10);

            const pulse = 0.3 + Math.sin(Date.now() / 300) * 0.2;
            Graphics.ShapeLayer.lineStyle(1, 0x44ddff, pulse * 0.3);
            Graphics.ShapeLayer.drawCircle(target.X, target.Y, 16);
            Graphics.ShapeLayer.lineStyle(1, 0x44ddff, 0.15);
            Graphics.ShapeLayer.moveTo(pos.X, pos.Y);
            Graphics.ShapeLayer.lineTo(target.X, target.Y);
        }
    }
}


//#endregion

//#region ФИЧА: фракции
export class FractionComponent { constructor(public Value: number) { } }

//#endregion

//#region ФИЧА: преследование

export class PreyComponent { }

export class PursuerComponent { }

class PursueSystem implements System
{
    public Update(deltaTime: number): void
    {
        // 1. Получаем ВСЕХ жертв ОДИН РАЗ
        const preyList = World.EntityQuery(PreyComponent, Transform2DComponent, RigidbodyComponent);
        if (preyList.length === 0) return; // Если нет жертв - выходим

        // 2. Получаем всех преследователей
        const pursuers = World.EntityQuery(PursuerComponent, Transform2DComponent, VelocityComponent, RigidbodyComponent, EntityStatsComponent);

        for (const pursuer of pursuers)
        {
            // Получаем компоненты преследователя
            const pursuerPos = World.GetComponent(pursuer, Transform2DComponent)!;
            const pursuerBody = World.GetComponent(pursuer, RigidbodyComponent)!;
            const pursuerVel = World.GetComponent(pursuer, VelocityComponent)!;
            const pursuerStats = World.GetComponent(pursuer, EntityStatsComponent)!.Final;

            // 3. Находим БЛИЖАЙШУЮ жертву
            const nearest = this.FindNearestPrey(pursuerPos, preyList, 0);

            // Если нет жертвы в радиусе - пропускаем
            if (!nearest) continue;

            // Получаем компоненты жертвы
            const preyPos = World.GetComponent(nearest, Transform2DComponent)!;
            const preyBody = World.GetComponent(nearest, RigidbodyComponent)!;

            // Вычисляем расстояние
            const dx = preyPos.X - pursuerPos.X;
            const dy = preyPos.Y - pursuerPos.Y;
            const dist = Math.hypot(dx, dy);

            // Дистанция остановки (с учётом размеров)
            const stopDistance = pursuerBody.Size + preyBody.Size + pursuerStats.AttackRange;

            // Если достаточно близко - останавливаемся
            if (dist < stopDistance) 
            {
                pursuerVel.DirX = 0;
                pursuerVel.DirY = 0;
                continue;
            }

            // Двигаемся в направлении цели
            pursuerVel.DirX = dx / dist;
            pursuerVel.DirY = dy / dist;
        }
    }

    private FindNearestPrey(pursuerPos: Transform2DComponent, preyList: EntityId[], searchRadius: number): EntityId | null
    {
        let nearest: EntityId | null = null;
        let nearestDist = Infinity;

        for (const prey of preyList)
        {
            const preyPos = World.GetComponent(prey, Transform2DComponent)!;

            const dx = preyPos.X - pursuerPos.X;
            const dy = preyPos.Y - pursuerPos.Y;
            const dist = Math.hypot(dx, dy);

            // Проверяем радиус поиска (если указан)
            if (searchRadius > 0 && dist > searchRadius) continue;

            if (dist < nearestDist)
            {
                nearestDist = dist;
                nearest = prey;
            }
        }

        return nearest;
    }
}

//#endregion

export function InitTargetingModule(): void
{
    World.SystemAdd(new TargetSystem());
    World.SystemAdd(new PursueSystem());
    Graphics.RendererAdd(new TargetRenderer());
}

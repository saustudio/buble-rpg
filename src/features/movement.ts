import { System, World, Logger } from "./core";
import { GameStateComponent, EGameState } from "./gamestate"
import { RigidbodyComponent } from "./physics";
import { EntityStatsComponent } from "./stats";
import { TargetComponent } from "./targeting";
import { StunComponent } from "./stun";

//#region ФИЧА: движение

export class Transform2DComponent { constructor(public X: number, public Y: number) { } }
export class VelocityComponent
{
    public DirX: number = 0;
    public DirY: number = 0;
}
export class MovementSystem implements System
{
    constructor() { Logger.Info(MovementSystem.name, '✅ система успешно инициализирована'); }

    public Update(deltaTime: number)
    {
        const gameState = World.GetComponent(World.EntityFirst(GameStateComponent)!, GameStateComponent)!.GameState;
        if (gameState.State == EGameState.PAUSE || gameState.State == EGameState.OVER) return;

        const entities = World.EntityQuery(Transform2DComponent, VelocityComponent, RigidbodyComponent, EntityStatsComponent);
        for (const entity of entities)
        {
            const pos = World.GetComponent(entity, Transform2DComponent)!;
            const vel = World.GetComponent(entity, VelocityComponent)!;
            const body = World.GetComponent(entity, RigidbodyComponent)!;
            const stats = World.GetComponent(entity, EntityStatsComponent)!.Final;

            // оглушённые не двигаются
            if (World.HasComponent(entity, StunComponent))
            {
                vel.DirX = 0;
                vel.DirY = 0;
                continue;
            }

            let speed = stats.MovementSpeed;
            speed *= (body.BaseMass / body.Mass);

            let speedX = vel.DirX * speed;
            let speedY = vel.DirY * speed;

            const target = World.GetComponent(entity, TargetComponent)!;
            if (target)
            {
                const dx = target.X - pos.X;
                const dy = target.Y - pos.Y;
                const dist = Math.hypot(dx, dy);
                if (dist <= body.Size + 20) 
                {
                    speedX = 0;
                    speedY = 0
                }
            }

            pos.X += speedX * deltaTime;
            pos.Y += speedY * deltaTime;
        }
    }
}


//#endregion

export function InitMovementModule(): void
{
    World.SystemAdd(new MovementSystem());
}

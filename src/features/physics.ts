import { System, World } from "./core"
import { Transform2DComponent } from "./movement"

//#region ФИЧА: физика
export class RigidbodyComponent { constructor(public Size: number, public BaseMass: number, public Mass: number = BaseMass, public IsStatic: boolean = false) { } }

export class RigidbodySystem implements System
{
    public Update(deltaTime: number): void
    {
        const entities = World.EntityQuery(Transform2DComponent, RigidbodyComponent);

        // //перерасчет массы
        // for (const entity of entities)
        // {
        //     const health = World.GetComponent(entity, HealthComponent);
        //     let healthMass = 0;
        //     if (health) healthMass = health.Max * 0.5;

        //     const body = World.GetComponent(entity, RigidbodyComponent)!;
        //     body.Mass = body.BaseMass + healthMass;
        // }

        //инерция при столкновении
        for (let i = 0; i < entities.length; i++)
        {

            for (let j = i + 1; j < entities.length; j++)
            {
                const entityA = entities[i];
                const entityB = entities[j];

                const posA = World.GetComponent(entityA, Transform2DComponent)!;
                const posB = World.GetComponent(entityB, Transform2DComponent)!;
                const bodyA = World.GetComponent(entityA, RigidbodyComponent)!;
                const bodyB = World.GetComponent(entityB, RigidbodyComponent)!;

                const minDistance = bodyA.Size + bodyB.Size;
                const dx = posB.X - posA.X;
                const dy = posB.Y - posA.Y;
                const distance = Math.hypot(dx, dy);

                if (distance < minDistance && distance > 0.001)
                {
                    const nx = dx / distance;
                    const ny = dy / distance;
                    const overlap = (minDistance - distance) / 2;
                    const totalMass = bodyA.Mass + bodyB.Mass;

                    // Чем больше масса, тем меньше сдвиг
                    const pushA = bodyA.IsStatic ? 0 : overlap * (bodyB.Mass / totalMass);
                    const pushB = bodyB.IsStatic ? 0 : overlap * (bodyA.Mass / totalMass);

                    posA.X -= nx * pushA;
                    posA.Y -= ny * pushA;
                    posB.X += nx * pushB;
                    posB.Y += ny * pushB;
                }

            }
        }

    }
}


//#endregion

export function InitPhysicsModule(): void
{
    World.SystemAdd(new RigidbodySystem());
}

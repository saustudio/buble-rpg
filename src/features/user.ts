import { Graphics, IRenderer, World } from "./core";
import { RigidbodyComponent } from "./physics"
import { Transform2DComponent, VelocityComponent } from "./movement"

//#region ФИЧА: игрок

export class UserComponent { public IsBusy: boolean }

class UserRenderer implements IRenderer 
{
    Render(): void
    {
        const entityList = World.EntityQuery(RigidbodyComponent, Transform2DComponent, VelocityComponent, UserComponent);
        for (const entity of entityList)
        {
            const body = World.GetComponent(entity, RigidbodyComponent)!;
            const pos = World.GetComponent(entity, Transform2DComponent)!;
            const vel = World.GetComponent(entity, VelocityComponent)!;

            let bodycolor = 0x4a7fc7;
            this.RenderBody(pos.X, pos.Y, body.Size, bodycolor);
            this.RenderEyeTarget(pos.X, pos.Y, body.Size, Math.atan2(vel.DirY, vel.DirX));
        }
    }


    private RenderBody(x: number, y: number, radius: number, fillColor: number)
    {
        Graphics.ShapeLayer.beginFill(fillColor);
        Graphics.ShapeLayer.drawCircle(x, y, radius);
        Graphics.ShapeLayer.endFill();

        Graphics.ShapeLayer.lineStyle(2.5, 0x151d2b);
        Graphics.ShapeLayer.drawCircle(x, y, radius);
    }

    private RenderEyeTarget(x: number, y: number, radius: number, angle: number)
    {
        const eyeOffsetX = Math.cos(angle) * (radius * 0.45);
        const eyeOffsetY = Math.sin(angle) * (radius * 0.45);

        Graphics.ShapeLayer.beginFill(0xf0f8ff);
        Graphics.ShapeLayer.drawCircle(x + eyeOffsetX - radius * 0.3, y + eyeOffsetY - radius * 0.2, radius * 0.28);
        Graphics.ShapeLayer.drawCircle(x + eyeOffsetX + radius * 0.3, y + eyeOffsetY - radius * 0.2, radius * 0.28);
        Graphics.ShapeLayer.endFill();

        Graphics.ShapeLayer.beginFill(0x1b1f2e);
        Graphics.ShapeLayer.drawCircle(x + eyeOffsetX - radius * 0.25, y + eyeOffsetY - radius * 0.1, radius * 0.14);
        Graphics.ShapeLayer.drawCircle(x + eyeOffsetX + radius * 0.35, y + eyeOffsetY - radius * 0.1, radius * 0.14);
        Graphics.ShapeLayer.endFill();
    }
}


//#endregion

export function InitUserModule(): void
{
    Graphics.RendererAdd(new UserRenderer());
}

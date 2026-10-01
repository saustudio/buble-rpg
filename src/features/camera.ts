import { Input, IRenderer, System, World, Graphics } from "./core";


export class CameraComponent
{
    constructor(
        public X: number = 0,
        public Y: number = 0,
        public Zoom: number = 1,
        public MinZoom: number = 0.3,
        public MaxZoom: number = 2.5,
        public ZoomSpeed: number = 0.1,
    ) { }
}

class CameraSystem implements System
{
    public Update(deltaTime: number): void
    {
        const camera = World.SingleComponent(CameraComponent);
        if (!camera) return;

        const wheelDelta = Input.MouseWheelDelta;
        if (wheelDelta !== 0)
        {
            // Получаем позицию мыши для зума относительно курсора
            const mouseX = Input.Mouse.X;
            const mouseY = Input.Mouse.Y;

            const delta = wheelDelta * camera.ZoomSpeed;
            const newZoom = Math.min(camera.MaxZoom, Math.max(camera.MinZoom, camera.Zoom + delta));

            const zoomFactor = newZoom / camera.Zoom;
            camera.X = mouseX - (mouseX - camera.X) * zoomFactor;
            camera.Y = mouseY - (mouseY - camera.Y) * zoomFactor;
            camera.Zoom = newZoom;
        }
    }
}



class CameraRenderer implements IRenderer
{
    public Render(deltaTime: number): void
    {
        const camera = World.SingleComponent(CameraComponent);
        if (!camera) return;

        // Применяем трансформацию камеры ко всем слоям
        const layers = [
            Graphics.ShapeLayer,
            Graphics.EffectsLayer,
            Graphics.UILayer,
            Graphics.TextLayer
        ];

        for (const layer of layers)
        {
            layer.position.set(-camera.X * camera.Zoom, -camera.Y * camera.Zoom);
            layer.scale.set(camera.Zoom, camera.Zoom);
        }
    }
}


class UI
{
    private zoomText: HTMLElement;

    constructor()
    {
        this.zoomText = document.getElementById('statZoom')!;
    }

    Update(deltaTime: number): void
    {
        const camera = World.SingleComponent(CameraComponent);
        if (camera) this.zoomText.textContent = camera.Zoom.toFixed(1) + 'x';
    }
}





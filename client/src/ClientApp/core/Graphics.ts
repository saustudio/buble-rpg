//#region renderer

import * as PIXI from "pixi.js";
import { IRenderer } from "./Contracts";

export class Graphics
{
    public static Width: number;
    public static Height: number;
    public static ShapeLayer: any;
    public static TextLayer: any;
    public static EffectsLayer: any;
    public static UILayer: any;

    private static app: PIXI.Application;

    private static renderers: IRenderer[] = [];
    private static isRendering: boolean = false;

    static
    {
        Graphics.Width = 1000;
        Graphics.Height = 800;
    }

    private static Initialize(): void
    {
        if (Graphics.app) return;

        const canvasContainer = document.getElementById("pixiCanvas");
        if (!canvasContainer) throw new Error("Missing #pixiCanvas element.");

        const app = new PIXI.Application({
            width: Graphics.Width,
            height: Graphics.Height,
            backgroundColor: 0x2f3b4c,
            antialias: true,
            resolution: 1,
            autoStart: false
        });

        Graphics.app = app;
        Graphics.ShapeLayer = new PIXI.Graphics();
        Graphics.EffectsLayer = new PIXI.Graphics();
        Graphics.UILayer = new PIXI.Graphics();
        Graphics.TextLayer = new PIXI.Container();

        Graphics.app.stage.addChild(Graphics.ShapeLayer);
        Graphics.app.stage.addChild(Graphics.EffectsLayer);
        Graphics.app.stage.addChild(Graphics.UILayer);
        Graphics.app.stage.addChild(Graphics.TextLayer);

        canvasContainer.appendChild(app.view as unknown as Node);

        app.ticker.add((deltaTime: number) =>
        {
            if (Graphics.isRendering) Graphics.Render(deltaTime);
        });
    }


    public static RendererAdd(renderer: IRenderer): void
    {
        Graphics.renderers.push(renderer);
    }

    private static ClearLayers(): void
    {
        Graphics.app.stage.removeChild(Graphics.ShapeLayer);
        Graphics.ShapeLayer.destroy({ children: true, texture: true, baseTexture: true });
        Graphics.ShapeLayer = new PIXI.Graphics();
        Graphics.app.stage.addChildAt(Graphics.ShapeLayer, 0);

        const destroyAll = (c: any) =>
        {
            while (c.children.length > 0)
            {
                const child = c.children[0];
                c.removeChild(child);
                child.destroy({ children: true, texture: true, baseTexture: true });
            }
        };

        destroyAll(Graphics.TextLayer);
        destroyAll(Graphics.EffectsLayer);
        destroyAll(Graphics.UILayer);
    }

    private static Render(deltaTime: number): void
    {
        this.ClearLayers();
        for (const renderer of Graphics.renderers) renderer.Render(deltaTime);
    }

    public static Start(): void
    {
        Graphics.Initialize();
        Graphics.isRendering = true;
        Graphics.app.ticker.start();
    }

    public static Stop(): void
    {
        Graphics.isRendering = false;
        Graphics.app.ticker.stop();
    }
}

//#endregion

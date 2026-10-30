//#region renderer

import * as PIXI from "pixi.js";
import { Graphics, IRenderer } from "../core/Core";
import { EMonsterRarity, GameState, MonsterState } from "../model/GameState";
import { GameStateRepository } from "../store/GameStateRepository";

/** Рендер монстров 1:1 из v1 `SpawnRenderer`. */
export class MonsterRenderer implements IRenderer
{
    private readonly renderDelay = 100;

    private static readonly StarStyle = new PIXI.TextStyle({
        fontFamily: "Segoe UI, sans-serif",
        fontSize: 12,
        fontWeight: "bold",
        fill: 0xFFD700,
        stroke: "#000000",
        strokeThickness: 2,
        align: "center"
    });

    constructor(private readonly repository: GameStateRepository) { }

    public Render(): void
    {
        const monsters = this.QueryRenderState();
        if (!monsters) return;

        for (const monster of monsters) this.RenderMonster(monster);
    }

    private QueryRenderState(): MonsterState[] | null
    {
        const stateList = this.repository.List();
        if (stateList.length === 0) return null;
        if (stateList.length === 1) return stateList[0].Monsters;

        const latest = stateList[stateList.length - 1];
        const renderTime = performance.now() - this.renderDelay;

        if (renderTime <= stateList[0].CreatedAt) return stateList[0].Monsters;
        if (renderTime >= latest.CreatedAt) return latest.Monsters;

        let nextIndex = 1;
        while (nextIndex < stateList.length && stateList[nextIndex].CreatedAt < renderTime) nextIndex++;
        if (nextIndex >= stateList.length) return latest.Monsters;

        const previous = stateList[nextIndex - 1];
        const next = stateList[nextIndex];

        if (previous.Phase !== next.Phase) return next.Monsters;

        const duration = next.CreatedAt - previous.CreatedAt;
        if (duration <= 0) return next.Monsters;

        const t = (renderTime - previous.CreatedAt) / duration;
        return this.Interpolate(previous, next, t);
    }

    private Interpolate(previous: GameState, next: GameState, t: number): MonsterState[]
    {
        const previousById = new Map(previous.Monsters.map(monster => [monster.Id, monster]));

        return next.Monsters.map(monster =>
        {
            const before = previousById.get(monster.Id);
            if (!before) return monster;

            return {
                ...monster,
                X: this.Lerp(before.X, monster.X, t),
                Y: this.Lerp(before.Y, monster.Y, t),
                DirX: this.Lerp(before.DirX, monster.DirX, t),
                DirY: this.Lerp(before.DirY, monster.DirY, t),
            };
        });
    }

    private Lerp(from: number, to: number, t: number): number
    {
        return from + (to - from) * t;
    }

    private RenderMonster(monster: MonsterState): void
    {
        let outlineColor = 0x151d2b;
        if (monster.Rarity === EMonsterRarity.RARE) outlineColor = 0x1E90FF;
        if (monster.Rarity === EMonsterRarity.ELITE) outlineColor = 0xffb703;

        this.RenderBody(monster.X, monster.Y, monster.Size, 0xD3D3D3, outlineColor);
        this.RenderEye(monster.X, monster.Y, monster.Size);
        this.RenderHealth(monster.X, monster.Y, monster.Size, monster.LifeCurrent, monster.LifeMax);
        this.RenderRange(monster.X, monster.Y, monster.AttackRange, monster.AttackReady);

        let stars = 0;
        if (monster.ItemCount >= 2) stars = 1;
        if (monster.ItemCount >= 4) stars = 2;
        if (monster.ItemCount >= 7) stars = 3;
        if (stars > 0) this.RenderStars(monster.X, monster.Y - monster.Size - 18, stars);
    }

    private RenderBody(x: number, y: number, radius: number, fillColor: number, outlineColor: number): void
    {
        Graphics.ShapeLayer.beginFill(fillColor);
        Graphics.ShapeLayer.drawCircle(x, y, radius);
        Graphics.ShapeLayer.endFill();

        Graphics.ShapeLayer.lineStyle(2.5, outlineColor);
        Graphics.ShapeLayer.drawCircle(x, y, radius);
        Graphics.ShapeLayer.lineStyle(2.5, 0x151d2b);
    }

    private RenderEye(x: number, y: number, radius: number): void
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

    private RenderStars(cx: number, cy: number, count: number): void
    {
        const spacing = 12;
        const startX = cx - (count - 1) * spacing * 0.5;

        for (let i = 0; i < count; i++)
        {
            const star = new PIXI.Text("★", MonsterRenderer.StarStyle);
            star.anchor.set(0.5, 0.5);
            star.position.set(startX + i * spacing, cy);
            Graphics.TextLayer.addChild(star);
        }
    }

    /** Короткая полоска HP врага 1:1 из v1 `HealthRenderer.RenderHealthShort`. */
    private RenderHealth(x: number, y: number, radius: number, health: number, healthMax: number): void
    {
        if (!(healthMax > 0)) return;

        const barWidth = radius * 2 + 6;
        const barY = y - radius - 10;
        const hpPercent = Math.max(0, Math.min(1, health / healthMax));

        Graphics.ShapeLayer.lineStyle(0);
        Graphics.ShapeLayer.beginFill(0x3a1f1f);
        Graphics.ShapeLayer.drawRect(x - barWidth / 2, barY, barWidth, 5);
        Graphics.ShapeLayer.endFill();

        Graphics.ShapeLayer.beginFill(0xe34f4f);
        Graphics.ShapeLayer.drawRect(x - barWidth / 2, barY, barWidth * hpPercent, 5);
        Graphics.ShapeLayer.endFill();
    }

    public RenderRange(x: number, y: number, radius: number, ready: boolean): void
    {
        const canvas = Graphics.ShapeLayer;
        const drawColor = ready ? 0xb8a888 : 0xff4444;

        const baseAlpha = 0.18;
        const fillAlpha = baseAlpha * 0.4;
        const lineAlpha = baseAlpha * 0.8;

        canvas.lineStyle(1, drawColor, lineAlpha);
        canvas.drawCircle(x, y, radius);

        canvas.beginFill(drawColor, fillAlpha);
        canvas.drawCircle(x, y, radius);
        canvas.endFill();

        const r = Math.min(255, Math.floor(((drawColor >> 16) & 0xff) * 1.6));
        const g = Math.min(255, Math.floor(((drawColor >> 8) & 0xff) * 1.6));
        const b = Math.min(255, Math.floor((drawColor & 0xff) * 1.6));
        const halo = (r << 16) | (g << 8) | b;

        canvas.lineStyle(1, halo, lineAlpha * 0.4);
        canvas.drawCircle(x, y, radius + 4);

        canvas.lineStyle(1, halo, lineAlpha * 0.2);
        canvas.drawCircle(x, y, radius + 8);
    }
}

//#endregion

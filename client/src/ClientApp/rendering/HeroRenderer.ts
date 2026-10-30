//#region renderer

import { Graphics, Input, IRenderer } from "../core/Core";
import * as PIXI from "pixi.js";
import { GameState, HeroState } from "../model/GameState";
import { GameStateRepository } from "../store/GameStateRepository";
import { AttackRange } from "./AttackRange";

/** Рендер героев: своего (с прицелом и кругом) и чужих (FFA). */
export class HeroRenderer implements IRenderer
{
    private readonly renderDelay = 100;

    private static readonly HealthStyle = new PIXI.TextStyle({
        fontFamily: "Segoe UI, sans-serif",
        fontSize: 9,
        fontWeight: "bold",
        fill: 0xffffff,
        stroke: "#000000",
        strokeThickness: 2,
        align: "center"
    });

    constructor(private readonly repository: GameStateRepository) { }

    public Render(): void
    {
        const state = this.QueryRenderState();
        if (!state) return;

        // Свой мёртвый герой не рисуется (герой остаётся в мире до респавна).
        if (state.MyHero && state.MyHero.LifeCurrent > 0) this.RenderOwnHero(state.MyHero);

        for (const hero of state.EnemyHeroes) this.RenderEnemyHero(hero);
    }

    private RenderOwnHero(hero: HeroState): void
    {
        // Дух вне боя: без прицела и круга атаки, полупрозрачный.
        const alpha = hero.IsGhost ? 0.4 : 1;

        this.RenderTarget(hero);
        this.RenderBody(hero.X, hero.Y, hero.Size, 0x4a7fc7, 0x151d2b, alpha);
        this.RenderEye(hero.X, hero.Y, hero.Size, Math.atan2(hero.DirY, hero.DirX), alpha);
        this.RenderHealth(hero);
        this.RenderRange(hero.X, hero.Y, hero.Size + hero.AttackRange, hero.AttackReady);
    }

    private RenderEnemyHero(hero: HeroState): void
    {
        const alpha = hero.IsGhost ? 0.4 : 1;

        let outlineColor = 0x151d2b;
        if (hero.WeaponRarity === "magic") outlineColor = 0x1E90FF;
        if (hero.WeaponRarity === "rare") outlineColor = 0xffb703;

        this.RenderBody(hero.X, hero.Y, hero.Size, 0xc77f4a, outlineColor, alpha);
        this.RenderEye(hero.X, hero.Y, hero.Size, Math.atan2(hero.DirY, hero.DirX), alpha);
        this.RenderHealth(hero);
        this.RenderRange(hero.X, hero.Y, hero.Size + hero.AttackRange, hero.AttackReady);
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
        const halo =  (r << 16) | (g << 8) | b;

        canvas.lineStyle(1, halo, lineAlpha * 0.4);
        canvas.drawCircle(x, y, radius + 4);

        canvas.lineStyle(1, halo, lineAlpha * 0.2);
        canvas.drawCircle(x, y, radius + 8);
    }


    private QueryRenderState(): GameState | null
    {
        const stateList = this.repository.List();
        if (stateList.length === 0) return null;
        if (stateList.length === 1) return stateList[0];

        const latest = stateList[stateList.length - 1];
        const renderTime = performance.now() - this.renderDelay;

        if (renderTime <= stateList[0].CreatedAt) return stateList[0];
        if (renderTime >= latest.CreatedAt) return latest;

        let nextIndex = 1;
        while (nextIndex < stateList.length && stateList[nextIndex].CreatedAt < renderTime) nextIndex++;
        if (nextIndex >= stateList.length) return latest;

        const previous = stateList[nextIndex - 1];
        const next = stateList[nextIndex];

        if (previous.Phase !== next.Phase) return next;

        const duration = next.CreatedAt - previous.CreatedAt;
        if (duration <= 0) return next;

        const t = (renderTime - previous.CreatedAt) / duration;
        return this.Interpolate(previous, next, t);
    }

    private Interpolate(previous: GameState, next: GameState, t: number): GameState
    {
        return {
            ...next,
            MyHero: this.InterpolateHero(previous.MyHero, next.MyHero, t),
            EnemyHeroes: this.InterpolateHeroes(previous, next, t),
        };
    }

    private InterpolateHero(previous: HeroState | null, next: HeroState | null, t: number): HeroState | null
    {
        if (!previous || !next || previous.Id !== next.Id) return next;

        return {
            ...next,
            X: this.Lerp(previous.X, next.X, t),
            Y: this.Lerp(previous.Y, next.Y, t),
            DirX: this.Lerp(previous.DirX, next.DirX, t),
            DirY: this.Lerp(previous.DirY, next.DirY, t),
        };
    }

    private InterpolateHeroes(previous: GameState, next: GameState, t: number): HeroState[]
    {
        const previousById = new Map(previous.EnemyHeroes.map(hero => [hero.Id, hero]));

        return next.EnemyHeroes.map(hero =>
        {
            const before = previousById.get(hero.Id);
            if (!before) return hero;

            return {
                ...hero,
                X: this.Lerp(before.X, hero.X, t),
                Y: this.Lerp(before.Y, hero.Y, t),
                DirX: this.Lerp(before.DirX, hero.DirX, t),
                DirY: this.Lerp(before.DirY, hero.DirY, t),
            };
        });
    }

    private Lerp(from: number, to: number, t: number): number
    {
        return from + (to - from) * t;
    }

    /** Прицел мыши: рисуется от той же интерполированной позиции героя, что и тело. */
    private RenderTarget(hero: HeroState): void
    {
        if (!Input.IsMouseInside) return;

        const target = Input.Mouse;

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
        Graphics.ShapeLayer.moveTo(hero.X, hero.Y);
        Graphics.ShapeLayer.lineTo(target.X, target.Y);
    }

    private RenderBody(x: number, y: number, radius: number, fillColor: number, outlineColor: number, alpha: number = 1): void
    {
        Graphics.ShapeLayer.beginFill(fillColor, alpha);
        Graphics.ShapeLayer.drawCircle(x, y, radius);
        Graphics.ShapeLayer.endFill();

        Graphics.ShapeLayer.lineStyle(2.5, outlineColor, alpha);
        Graphics.ShapeLayer.drawCircle(x, y, radius);
        Graphics.ShapeLayer.lineStyle(2.5, 0x151d2b);
    }

    private RenderEye(x: number, y: number, radius: number, angle: number, alpha: number = 1): void
    {
        const eyeOffsetX = Math.cos(angle) * (radius * 0.45);
        const eyeOffsetY = Math.sin(angle) * (radius * 0.45);

        Graphics.ShapeLayer.beginFill(0xf0f8ff, alpha);
        Graphics.ShapeLayer.drawCircle(x + eyeOffsetX - radius * 0.3, y + eyeOffsetY - radius * 0.2, radius * 0.28);
        Graphics.ShapeLayer.drawCircle(x + eyeOffsetX + radius * 0.3, y + eyeOffsetY - radius * 0.2, radius * 0.28);
        Graphics.ShapeLayer.endFill();

        Graphics.ShapeLayer.beginFill(0x1b1f2e, alpha);
        Graphics.ShapeLayer.drawCircle(x + eyeOffsetX - radius * 0.25, y + eyeOffsetY - radius * 0.1, radius * 0.14);
        Graphics.ShapeLayer.drawCircle(x + eyeOffsetX + radius * 0.35, y + eyeOffsetY - radius * 0.1, radius * 0.14);
        Graphics.ShapeLayer.endFill();
    }

    private RenderHealth(hero: HeroState): void
    {
        const barWidth = hero.Size * 2.4;
        const barHeight = 6;
        const barY = hero.Y - hero.Size - 10;
        const barX = hero.X - barWidth / 2;

        const hpPercent = hero.LifeMax > 0
            ? Math.min(1, Math.max(0, hero.LifeCurrent / hero.LifeMax))
            : 0;

        Graphics.ShapeLayer.beginFill(0x2a1f1f);
        Graphics.ShapeLayer.drawRect(barX, barY, barWidth, barHeight);
        Graphics.ShapeLayer.endFill();

        Graphics.ShapeLayer.lineStyle(1, 0x1a1f2a, 0.6);
        Graphics.ShapeLayer.drawRect(barX, barY, barWidth, barHeight);

        let fillColor = 0x44dd44;
        if (hpPercent < 0.3) fillColor = 0xdd4444;
        else if (hpPercent < 0.6) fillColor = 0xddcc44;

        const fillWidth = barWidth * hpPercent;
        if (fillWidth > 0)
        {
            Graphics.ShapeLayer.beginFill(fillColor);
            Graphics.ShapeLayer.drawRect(barX, barY, fillWidth, barHeight);
            Graphics.ShapeLayer.endFill();
        }

        Graphics.ShapeLayer.lineStyle(1, 0x88ccff, 0.2);
        Graphics.ShapeLayer.drawRect(barX, barY, barWidth, barHeight);

        const label = new PIXI.Text(`${hero.LifeCurrent.toFixed()}/${hero.LifeMax.toFixed()}`, HeroRenderer.HealthStyle);
        label.anchor.set(0.5, 0.5);
        label.position.set(hero.X, barY - 6);
        Graphics.TextLayer.addChild(label);
    }
}

//#endregion

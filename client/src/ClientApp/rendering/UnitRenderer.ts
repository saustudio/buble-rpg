//#region renderer

import { Graphics, Input, IRenderer } from "../core/Core";
import * as PIXI from "pixi.js";
import { GameState, Unit } from "../model/GameState";
import { UnitService } from "../services/UnitService";
import { GameStateRepository } from "../store/GameStateRepository";
import { AttackRange } from "./AttackRange";

/**
 * Рендер всех юнитов. Модель одна, поэтому общее — тело, глаза, круг атаки, интерполяция —
 * живёт здесь, а отличия визуализации задаёт список, в котором пришёл юнит.
 */
export class UnitRenderer implements IRenderer
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
        const state = this.QueryRenderState();
        if (!state) return;

        // Свой мёртвый герой не рисуется (герой остаётся в мире до респавна).
        if (state.MyHero && state.MyHero.Vitals.LifeCurrent > 0) this.RenderOwnHero(state.MyHero);

        for (const hero of state.EnemyHeroes) this.RenderEnemyHero(hero);
        for (const monster of state.Monsters) this.RenderMonster(monster);
    }

    private RenderOwnHero(hero: Unit): void
    {
        // Дух вне боя: без прицела и круга атаки, полупрозрачный.
        const alpha = hero.IsGhost ? 0.4 : 1;
        const location = hero.Location;
        const size = hero.Attributes.Size;

        this.RenderTarget(hero);
        this.RenderBody(location.X, location.Y, size, 0x4a7fc7, 0x151d2b, alpha);
        this.RenderEye(location.X, location.Y, size, Math.atan2(location.DirY, location.DirX), alpha);
        this.RenderLongHealth(hero);
        AttackRange.Render(location.X, location.Y, size + hero.Attack.Range, hero.Attack.Ready);
    }

    private RenderEnemyHero(hero: Unit): void
    {
        const alpha = hero.IsGhost ? 0.4 : 1;
        const location = hero.Location;
        const size = hero.Attributes.Size;
        const outlineColor = UnitRenderer.RarityOutline(UnitService.ItemInSlot(hero, "weapon")?.Rarity);

        this.RenderBody(location.X, location.Y, size, 0xc77f4a, outlineColor, alpha);
        this.RenderEye(location.X, location.Y, size, Math.atan2(location.DirY, location.DirX), alpha);
        this.RenderLongHealth(hero);
        AttackRange.Render(location.X, location.Y, size + hero.Attack.Range, hero.Attack.Ready);
    }

    private RenderMonster(monster: Unit): void
    {
        const location = monster.Location;
        const size = monster.Attributes.Size;
        const outlineColor = UnitRenderer.RarityOutline(UnitService.MaxRarity(monster));

        this.RenderBody(location.X, location.Y, size, 0xD3D3D3, outlineColor);
        this.RenderEye(location.X, location.Y, size, 0);
        this.RenderShortHealth(monster);
        AttackRange.Render(location.X, location.Y, size + monster.Attack.Range, monster.Attack.Ready);

        // Звёзды — визуализация количества надетого, считается на клиенте.
        const items = monster.Equipment.Items.length;
        const stars = items >= 7 ? 3 : items >= 4 ? 2 : items >= 2 ? 1 : 0;
        if (stars > 0) this.RenderStars(location.X, location.Y - size - 18, stars);
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
            MyHero: this.InterpolateUnit(previous.MyHero, next.MyHero, t),
            EnemyHeroes: this.InterpolateUnits(previous.EnemyHeroes, next.EnemyHeroes, t),
            Monsters: this.InterpolateUnits(previous.Monsters, next.Monsters, t),
        };
    }

    private InterpolateUnit(previous: Unit | null, next: Unit | null, t: number): Unit | null
    {
        if (!previous || !next || previous.Id !== next.Id) return next;
        return this.InterpolateLocation(previous, next, t);
    }

    private InterpolateUnits(previous: Unit[], next: Unit[], t: number): Unit[]
    {
        const previousById = new Map(previous.map(unit => [unit.Id, unit]));

        return next.map(unit =>
        {
            const before = previousById.get(unit.Id);
            return before ? this.InterpolateLocation(before, unit, t) : unit;
        });
    }

    private InterpolateLocation(previous: Unit, next: Unit, t: number): Unit
    {
        return {
            ...next,
            Location: {
                ...next.Location,
                X: this.Lerp(previous.Location.X, next.Location.X, t),
                Y: this.Lerp(previous.Location.Y, next.Location.Y, t),
                DirX: this.Lerp(previous.Location.DirX, next.Location.DirX, t),
                DirY: this.Lerp(previous.Location.DirY, next.Location.DirY, t),
            },
        };
    }

    private Lerp(from: number, to: number, t: number): number
    {
        return from + (to - from) * t;
    }

    /** Прицел мыши: рисуется от той же интерполированной позиции героя, что и тело. */
    private RenderTarget(hero: Unit): void
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
        Graphics.ShapeLayer.moveTo(hero.Location.X, hero.Location.Y);
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

    /** Глаза повёрнуты по направлению движения; у монстра направление не рисуется. */
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

    /** Полоска героя: с подписью текущего запаса жизни. */
    private RenderLongHealth(unit: Unit): void
    {
        const { X, Y } = unit.Location;
        const size = unit.Attributes.Size;
        const { LifeCurrent, LifeMax } = unit.Vitals;

        const barWidth = size * 2.4;
        const barHeight = 6;
        const barY = Y - size - 10;
        const barX = X - barWidth / 2;

        const hpPercent = LifeMax > 0
            ? Math.min(1, Math.max(0, LifeCurrent / LifeMax))
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

        const label = new PIXI.Text(`${LifeCurrent.toFixed()}/${LifeMax.toFixed()}`, UnitRenderer.HealthStyle);
        label.anchor.set(0.5, 0.5);
        label.position.set(X, barY - 6);
        Graphics.TextLayer.addChild(label);
    }

    /** Короткая полоска врага 1:1 из v1 `HealthRenderer.RenderHealthShort`. */
    private RenderShortHealth(unit: Unit): void
    {
        const { X, Y } = unit.Location;
        const size = unit.Attributes.Size;
        const { LifeCurrent, LifeMax } = unit.Vitals;

        if (!(LifeMax > 0)) return;

        const barWidth = size * 2 + 6;
        const barY = Y - size - 10;
        const hpPercent = Math.max(0, Math.min(1, LifeCurrent / LifeMax));

        Graphics.ShapeLayer.lineStyle(0);
        Graphics.ShapeLayer.beginFill(0x3a1f1f);
        Graphics.ShapeLayer.drawRect(X - barWidth / 2, barY, barWidth, 5);
        Graphics.ShapeLayer.endFill();

        Graphics.ShapeLayer.beginFill(0xe34f4f);
        Graphics.ShapeLayer.drawRect(X - barWidth / 2, barY, barWidth * hpPercent, 5);
        Graphics.ShapeLayer.endFill();
    }

    private RenderStars(cx: number, cy: number, count: number): void
    {
        const spacing = 12;
        const startX = cx - (count - 1) * spacing * 0.5;

        for (let i = 0; i < count; i++)
        {
            const star = new PIXI.Text("★", UnitRenderer.StarStyle);
            star.anchor.set(0.5, 0.5);
            star.position.set(startX + i * spacing, cy);
            Graphics.TextLayer.addChild(star);
        }
    }

    /** Обводка по редкости: клиент решает, как показать «крутизну» юнита. */
    private static RarityOutline(rarity: string | undefined): number
    {
        if (rarity === "magic") return 0x1E90FF;
        if (rarity === "rare") return 0xffb703;
        return 0x151d2b;
    }
}

//#endregion

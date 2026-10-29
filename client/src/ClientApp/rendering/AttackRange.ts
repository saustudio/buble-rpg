//#region renderer

import { Graphics } from "../core/Core";
import { EAttackType } from "../model/GameState";

/** Круг дистанции поражения 1:1 из v1 `AttackRenderer.RenderRange`. */
export class AttackRange
{
    private static readonly Color: Record<EAttackType, number> =
    {
        [EAttackType.PHYSICAL]: 0xb8a888,
        [EAttackType.FIRE]: 0xff5533,
        [EAttackType.COLD]: 0x55ddff,
        [EAttackType.LIGHT]: 0xffee44,
    };

    public static Render(x: number, y: number, radius: number, ready: boolean, type: EAttackType): void
    {
        const g = Graphics.ShapeLayer;
        const drawColor = ready ? AttackRange.Color[type] : 0xff4444;

        const baseAlpha = 0.18;
        const fillAlpha = baseAlpha * 0.4;
        const lineAlpha = baseAlpha * 0.8;

        g.lineStyle(1, drawColor, lineAlpha);
        g.drawCircle(x, y, radius);

        g.beginFill(drawColor, fillAlpha);
        g.drawCircle(x, y, radius);
        g.endFill();

        const halo = AttackRange.LightenColor(drawColor, 1.6);
        g.lineStyle(1, halo, lineAlpha * 0.4);
        g.drawCircle(x, y, radius + 4);

        g.lineStyle(1, halo, lineAlpha * 0.2);
        g.drawCircle(x, y, radius + 8);
    }

    /** Осветлить цвет (factor > 1 — светлее, < 1 — темнее). */
    private static LightenColor(color: number, factor: number): number
    {
        const r = Math.min(255, Math.floor(((color >> 16) & 0xff) * factor));
        const g = Math.min(255, Math.floor(((color >> 8) & 0xff) * factor));
        const b = Math.min(255, Math.floor((color & 0xff) * factor));
        return (r << 16) | (g << 8) | b;
    }
}

//#endregion

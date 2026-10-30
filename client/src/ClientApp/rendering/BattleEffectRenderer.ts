//#region renderer

import * as PIXI from "pixi.js";
import { AttackHit } from "../model/Combat";
import { Graphics, IRenderer } from "../core/Core";
import { GameState } from "../model/GameState";
import { GameStateRepository } from "../store/GameStateRepository";

/** Всплывающий текст боя: урон, MISS, BLOCK. Длительность, позиция и анимация — целиком клиентские. */
export class BattleEffectRenderer implements IRenderer
{
    private static readonly Duration = 600;
    private static readonly Rise = 32;
    private static readonly PopStrength = 0.4;

    private static readonly NormalStyle = new PIXI.TextStyle({
        fontFamily: "Segoe UI, sans-serif",
        fontSize: 14,
        fontWeight: "bold",
        fill: 0xffffff,
        stroke: "#000000",
        strokeThickness: 3,
        align: "center"
    });

    private static readonly CritStyle = new PIXI.TextStyle({
        fontFamily: "Segoe UI, sans-serif",
        fontSize: 14,
        fontWeight: "bold",
        fill: 0xffff00,
        stroke: "#000000",
        strokeThickness: 3,
        align: "center"
    });

    private readonly active: ActiveBattleEffect[] = [];

    /** Цели текущего снапшота: по ним находится точка всплытия события. */
    private targets = new Map<number, TargetPoint>();

    /** Цели прошлого снапшота: добитый герой пропадает из ответа, а цифра за последний удар нужна. */
    private previousTargets = new Map<number, TargetPoint>();

    private lastState: GameState | null = null;

    constructor(private readonly repository: GameStateRepository) { }

    public Render(): void
    {
        const now = performance.now();

        this.Ingest();

        for (let i = this.active.length - 1; i >= 0; i--)
        {
            const effect = this.active[i];
            const progress = (now - effect.StartMs) / BattleEffectRenderer.Duration;
            if (progress >= 1)
            {
                this.active.splice(i, 1);
                continue;
            }

            this.RenderEffect(effect, progress);
        }
    }

    /**
     * Забирает события всех снапшотов, пришедших с прошлого кадра. Каждое событие стартует
     * в момент своего снапшота (`CreatedAt`), поэтому события разных тиков не слипаются в один кадр.
     */
    private Ingest(): void
    {
        const states = this.repository.List();
        if (states.length === 0) return;

        const previous = this.lastState;
        let start = 0;
        if (previous !== null)
        {
            const index = states.indexOf(previous);
            start = index >= 0 ? index + 1 : states.length;
        }

        for (let i = start; i < states.length; i++)
        {
            const state = states[i];
            this.RememberTargets(state);

            for (const hit of state.Hits) this.AddHit(hit, state.CreatedAt);
            for (const evasion of state.Evasions) this.AddEffect(evasion.Target, "MISS", BattleEffectRenderer.NormalStyle, state.CreatedAt);
            for (const block of state.Blocks) this.AddEffect(block.Target, "BLOCK", BattleEffectRenderer.NormalStyle, state.CreatedAt);
        }

        this.lastState = states[states.length - 1];
    }

    private RememberTargets(state: GameState): void
    {
        this.previousTargets = this.targets;
        this.targets = new Map();

        if (state.MyHero) this.Remember(state.MyHero.Id, state.MyHero);
        for (const hero of state.EnemyHeroes) this.Remember(hero.Id, hero);
        for (const monster of state.Monsters) this.Remember(monster.Id, monster);
    }

    private Remember(id: number, target: TargetPoint): void
    {
        this.targets.set(id, target);
    }

    private AddHit(hit: AttackHit, now: number): void
    {
        const damage = hit.Phys + hit.Fire + hit.Cold + hit.Light;
        const style = hit.IsCrit ? BattleEffectRenderer.CritStyle : BattleEffectRenderer.NormalStyle;

        this.AddEffect(hit.Target, damage.toFixed(), style, now);
    }

    /** Точка всплытия — над целью на момент удара; дальше эффект живёт сам. */
    private AddEffect(target: number, text: string, style: PIXI.TextStyle, now: number): void
    {
        const point = this.targets.get(target) ?? this.previousTargets.get(target);
        if (!point) return;

        this.active.push({
            X: point.X,
            Y: point.Y - point.Size,
            Text: text,
            Style: style,
            StartMs: now
        });
    }

    private RenderEffect(effect: ActiveBattleEffect, progress: number): void
    {
        const label = new PIXI.Text(effect.Text, effect.Style);
        label.anchor.set(0.5, 0.5);
        label.position.set(effect.X, effect.Y - BattleEffectRenderer.Rise * progress);
        label.alpha = 1 - progress;
        label.scale.set(1 + BattleEffectRenderer.PopStrength * Math.sin(progress * Math.PI));

        Graphics.TextLayer.addChild(label);
    }
}

interface ActiveBattleEffect
{
    readonly X: number;
    readonly Y: number;
    readonly Text: string;
    readonly Style: PIXI.TextStyle;
    readonly StartMs: number;
}

interface TargetPoint
{
    readonly X: number;
    readonly Y: number;
    readonly Size: number;
}

//#endregion

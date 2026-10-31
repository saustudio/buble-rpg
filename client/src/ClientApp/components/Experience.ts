//#region UI

import { IGameStateView } from "../core/Core";
import { GameState } from "../model/GameState";

export class ExperienceUI implements IGameStateView
{
    private readonly xpText: HTMLElement;
    private readonly statLevel: HTMLElement;
    private readonly xpBarFill: HTMLElement;

    constructor()
    {
        this.xpText = document.getElementById('xpText')!;
        this.statLevel = document.getElementById('statLevel')!;
        this.xpBarFill = document.getElementById('xpBarFill')!;
    }

    public Refresh(state: GameState): void
    {
        const hero = state.MyHero;
        if (!hero) return;

        const progress = hero.Progress;

        this.xpText.textContent = `${Math.floor(progress.Experience)}/${progress.ExperienceNext}`;
        this.statLevel.textContent = String(progress.Level);
        this.xpBarFill.style.width = `${progress.ExperienceNext > 0 ? (progress.Experience / progress.ExperienceNext) * 100 : 0}%`;
    }
}

//#endregion

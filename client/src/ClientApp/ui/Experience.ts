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
        const hero = state.Hero;
        if (!hero) return;

        this.xpText.textContent = `${Math.floor(hero.Experience)}/${hero.ExperienceNext}`;
        this.statLevel.textContent = String(hero.Level);
        this.xpBarFill.style.width = `${hero.ExperienceNext > 0 ? (hero.Experience / hero.ExperienceNext) * 100 : 0}%`;
    }
}

//#endregion

//#region UI

import { EventBus, GameEvents } from "../core/Core";
import { GameStateRepository } from "../store/GameStateRepository";

export class ExperienceUI
{
    private readonly xpText: HTMLElement;
    private readonly statLevel: HTMLElement;
    private readonly xpBarFill: HTMLElement;
    private readonly unsubscribeState: () => void;

    constructor(
        events: EventBus,
        private readonly repository: GameStateRepository)
    {
        this.xpText = document.getElementById('xpText')!;
        this.statLevel = document.getElementById('statLevel')!;
        this.xpBarFill = document.getElementById('xpBarFill')!;

        this.unsubscribeState = events.Subscribe<unknown>(GameEvents.StateChanged, () => this.Refresh());
    }

    public Refresh(): void
    {
        const hero = this.repository.Last()?.MyHero;
        if (!hero) return;

        const progress = hero.Progress;

        this.xpText.textContent = `${Math.floor(progress.Experience)}/${progress.ExperienceNext}`;
        this.statLevel.textContent = String(progress.Level);
        this.xpBarFill.style.width = `${progress.ExperienceNext > 0 ? (progress.Experience / progress.ExperienceNext) * 100 : 0}%`;
    }
}

//#endregion

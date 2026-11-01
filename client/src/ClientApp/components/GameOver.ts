//#region UI

import { EventBus, GameEvents } from "../core/Core";
import { UIDialog } from "./Dialog";
import { EGameState, GameState } from "../model/GameState";
import { GameStateRepository } from "../store/GameStateRepository";

export class GameOverUI
{
    private readonly unsubscribeState: () => void;

    constructor(
        events: EventBus,
        private readonly repository: GameStateRepository,
        private readonly dialog: UIDialog,
        private readonly onRestart?: () => void)
    {
        const btnRestart = this.dialog.Container.querySelector<HTMLElement>(".btn-restart");
        btnRestart?.addEventListener("click", () => this.onRestart?.());

        this.unsubscribeState = events.Subscribe<unknown>(GameEvents.StateChanged, () => this.Refresh());
    }

    public Refresh(): void
    {
        const state = this.repository.Last();
        if (!state) return;

        // После респавна фаза снова PLAY — окно закрывается, соединение остаётся.
        if (state.Phase !== EGameState.OVER)
        {
            if (this.dialog.Visibled) this.dialog.Close();
            return;
        }

        if (this.dialog.Visibled) return;

        this.ShowStats(state);
        this.dialog.Open();
    }

    private ShowStats(state: GameState): void
    {
        this.dialog.Container.querySelector("#gameOverWave")!.textContent = String(state.Wave?.Lvl ?? 0);
        this.dialog.Container.querySelector("#gameOverLevel")!.textContent = String(state.MyHero?.Progress.Level ?? 0);
    }
}

//#endregion

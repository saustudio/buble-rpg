//#region UI

import { IGameStateView } from "../core/Core";
import { UIDialog } from "./Dialog";
import { EGameState, GameState } from "../model/GameState";

export class GameOverUI implements IGameStateView
{
    constructor(
        private readonly dialog: UIDialog,
        private readonly onRestart?: () => void)
    {
        const btnRestart = this.dialog.Container.querySelector<HTMLElement>(".btn-restart");
        btnRestart?.addEventListener("click", () => this.onRestart?.());
    }

    public Refresh(state: GameState): void
    {
        if (state.Phase !== EGameState.OVER) return;
        if (this.dialog.Visibled) return;

        this.ShowStats(state);
        this.dialog.Open();
    }

    private ShowStats(state: GameState): void
    {
        this.dialog.Container.querySelector("#gameOverWave")!.textContent = String(state.Wave?.Lvl ?? 0);
        this.dialog.Container.querySelector("#gameOverLevel")!.textContent = String(state.Hero?.Level ?? 0);
    }
}

//#endregion

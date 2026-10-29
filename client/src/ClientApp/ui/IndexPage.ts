//#region module

import { EventBus, GameEvents, IGameStateView, Input } from "../core/Core";
import { UIDialog } from "./Dialog";
import { WaveUI } from "./Wave";
import { WaveBonusUI } from "./WaveBonuses";
import { StatsUI } from "./Stats";
import { EnemyHudUI } from "./EnemyHud";
import { LootUI } from "./Loot";
import { ExperienceUI } from "./Experience";
import { ExperienceBonusUI } from "./ExperienceBonuses";
import { GameOverUI } from "./GameOver";
import { GameState } from "../model/GameState";
import { GameStateRepository } from "../store/GameStateRepository";
import { IGameService } from "../services/IGameService";

export class IndexPage
{
    private views: IGameStateView[] = [];
    private closeHandlers: (() => void)[] = [];
    private errorDialog: UIDialog | null = null;
    private loadingDialog: UIDialog | null = null;

    constructor(
        private readonly repository: GameStateRepository,
        private readonly events: EventBus,
        private readonly gameService: IGameService)
    {
        document.addEventListener("DOMContentLoaded", this.OnLoad.bind(this), { once: true });
        window.addEventListener("beforeunload", this.OnUnload.bind(this));
        this.events.Subscribe<unknown>(GameEvents.Error, this.OnGameError.bind(this));
    }

    public OnClose(handler: () => void): void
    {
        this.closeHandlers.push(handler);
    }

    private OnLoad(): void
    {
        Input.OnMouseMove(this.OnMouseMove.bind(this));
        Input.OnMouseLeave(this.OnMouseLeave.bind(this));

        document.getElementById("errorRestartBtn")?.addEventListener("click", this.OnRestartClick.bind(this));

        this.errorDialog = new UIDialog("error");
        this.loadingDialog = new UIDialog("loading");
        this.loadingDialog.Open();

        this.views =
            [
                new WaveUI(),
                new WaveBonusUI(new UIDialog("wave"), this.gameService),
                new StatsUI(),
                new EnemyHudUI(),
                new LootUI(new UIDialog("loot")),
                new ExperienceUI(),
                new ExperienceBonusUI(new UIDialog("levelup"), this.gameService),
                new GameOverUI(new UIDialog("gameover"), () => window.location.reload()),
            ];

        this.events.Subscribe<GameState>(GameEvents.StateChanged, this.OnGameStateChanged.bind(this));
    }

    private OnUnload(): void
    {
        for (const handler of this.closeHandlers) handler();
    }

    private OnMouseMove(x: number, y: number): void
    {
        void this.gameService.MoveTo(x, y);
    }

    private OnMouseLeave(): void
    {
        const hero = this.repository.Last()?.Hero;
        if (!hero) return;

        // Остановка: цель там, где герой стоит сейчас.
        void this.gameService.MoveTo(hero.X, hero.Y);
    }

    private OnGameStateChanged(state: GameState): void
    {
        if (this.loadingDialog.Visibled) this.loadingDialog.Close();
        for (const view of this.views) view.Refresh(state);
    }

    private OnGameError(error: unknown): void
    {
        const message = error instanceof Error ? error.message : String(error);
        if (this.loadingDialog.Visibled) this.loadingDialog.Close();
        this.errorDialog.Container.querySelector("#errorMessage")!.textContent = message;
        this.errorDialog?.Open();
    }


    private OnRestartClick(): void
    {
        window.location.reload();
    }
}

//#endregion

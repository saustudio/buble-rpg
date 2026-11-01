//#region module

import { EventBus, GameEvents, Input } from "../core/Core";
import { UIDialog } from "./Dialog";
import { WaveUI } from "./Wave";
import { WaveBonusUI } from "./WaveBonuses";
import { WeaponStatsUI, CharacterStatsUI, DefenceStatsUI } from "./Stats";
import { EnemyHudUI } from "./EnemyHud";
import { InventoryUI } from "./Inventory";
import { ExperienceUI } from "./Experience";
import { ExperienceBonusUI } from "./ExperienceBonuses";
import { GameOverUI } from "./GameOver";
import { MiscUI } from "./MiscUI";
import { MapUI } from "./MapUI";
import { QuestsUI } from "./QuestsUI";
import { SkillsUI } from "./SkillsUI";
import { NavBarUI } from "./NavBar";
import { SystemDialog } from "./SystemDialog";
import { GameStateRepository } from "../store/GameStateRepository";
import { LootRepository } from "../store/LootRepository";
import { IGameService } from "../services/IGameService";

export class IndexPage
{
    private closeHandlers: (() => void)[] = [];
    private errorDialog: UIDialog | null = null;
    private loadingDialog: UIDialog | null = null;

    constructor(
        private readonly repository: GameStateRepository,
        private readonly lootRepository: LootRepository,
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

        this.errorDialog = new SystemDialog("error");
        this.loadingDialog = new SystemDialog("loading");
        this.loadingDialog.Open();

        new WaveUI(this.events, this.repository);
        new EnemyHudUI(this.events, this.repository);
        new ExperienceUI(this.events, this.repository);
        new GameOverUI(this.events, this.repository, new SystemDialog("gameover"), () => void this.gameService.Respawn());

        const navBar = new NavBarUI(this.events, this.repository, this.lootRepository);
        navBar.RegisterDialogs([
            new WaveBonusUI(this.events, this.repository, this.gameService, navBar),
            new WeaponStatsUI(this.events, this.repository),
            new CharacterStatsUI(this.events, this.repository),
            new DefenceStatsUI(this.events, this.repository),
            new InventoryUI(this.events, this.repository, this.lootRepository, this.gameService),
            new SkillsUI(),
            new QuestsUI(),
            new MapUI(),
            new MiscUI(),
            new ExperienceBonusUI(this.events, this.repository, this.gameService, navBar)]);

        // Снимок приходит каждый тик, но заглушку загрузки закрываем только один раз.
        this.events.Subscribe<unknown>(GameEvents.StateChanged, this.OnFirstState.bind(this));
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
        const hero = this.repository.Last()?.MyHero;
        if (!hero) return;

        // Остановка: цель там, где герой стоит сейчас.
        void this.gameService.MoveTo(hero.Location.X, hero.Location.Y);
    }

    private OnFirstState(): void
    {
        if (this.loadingDialog?.Visibled) this.loadingDialog.Close();
    }

    private OnGameError(error: unknown): void
    {
        const message = error instanceof Error ? error.message : String(error);
        if (this.loadingDialog?.Visibled) this.loadingDialog.Close();
        this.errorDialog!.Container.querySelector("#errorMessage")!.textContent = message;
        this.errorDialog?.Open();
    }


    private OnRestartClick(): void
    {
        window.location.reload();
    }
}

//#endregion

import { UIDialog } from "./Dialog";
import { EventBus, GameEvents } from "../core/Core";
import { EGameState } from "../model/GameState";
import { GameStateRepository } from "../store/GameStateRepository";
import { LootRepository } from "../store/LootRepository";

export class NavBarUI
{
    private readonly dialogs = new Map<string, UIDialog>();
    private activeDialog: UIDialog | null = null;
    private buttonsBound = false;
    private readonly badges = new Map<string, HTMLElement>();

    constructor(
        events: EventBus,
        private readonly gameStateRepository: GameStateRepository,
        private readonly lootRepository: LootRepository)
    {
        for (const id of ["inventory", "levelup", "wave"])
        {
            const badge = document.querySelector<HTMLElement>(`#navBar .nav-btn[data-dialog="${id}"] .nav-badge`);
            if (badge) this.badges.set(id, badge);
        }

        events.Subscribe<unknown>(GameEvents.StateChanged, () => this.SyncBadges());
        events.Subscribe<unknown>(GameEvents.LootChanged, () => this.SyncBadges());
        this.SyncBadges();
    }

    public RegisterDialogs(dialogs: readonly UIDialog[]): void
    {
        for (const dialog of dialogs)
        {
            if (this.dialogs.has(dialog.Id))
                throw new Error(`Duplicate nav dialog id: ${dialog.Id}`);

            this.dialogs.set(dialog.Id, dialog);
            const closeButton = document
                .querySelector<HTMLElement>(`.ui-dialog-overlay[data-dialog="${dialog.Id}"] .ui-dialog-close`);
            closeButton?.addEventListener("click", () => this.Close(dialog.Id));
        }

        if (!this.buttonsBound)
        {
            const buttons = document.querySelectorAll<HTMLElement>("#navBar .nav-btn");
            for (const button of buttons)
                button.addEventListener("click", () => this.Toggle(button.dataset.dialog!));
            this.buttonsBound = true;
        }

        this.SyncNavButtons();
    }

    private SyncBadges(): void
    {
        const state = this.gameStateRepository.Last();
        const isGameOver = !state || state.Phase === EGameState.OVER;

        this.SetBadge("inventory", this.lootRepository.Drops.length);
        this.SetBadge("levelup", isGameOver ? 0 : state.ExperienceBonusOffer.length);
        this.SetBadge("wave", isGameOver ? 0 : state.WaveBonusOffer.length);
    }

    private SetBadge(dialogId: string, count: number): void
    {
        const badge = this.badges.get(dialogId);
        if (!badge) return;

        badge.textContent = String(count);
        badge.style.display = count > 0 ? "flex" : "none";
    }

    public Close(dialogId: string): void
    {
        const dialog = this.dialogs.get(dialogId);
        if (!dialog) return;

        dialog.Close();
        if (this.activeDialog === dialog) this.activeDialog = null;
        this.SyncNavButtons();
    }

    private Toggle(dialogId: string): void
    {
        const dialog = this.dialogs.get(dialogId);
        if (!dialog) return;

        if (this.activeDialog === dialog && dialog.Visibled)
        {
            this.Close(dialogId);
            return;
        }

        if (this.activeDialog && this.activeDialog !== dialog)
            this.activeDialog.Close();
        this.activeDialog = null;

        dialog.Open();
        this.activeDialog = dialog.Visibled ? dialog : null;
        this.SyncNavButtons();
    }

    private SyncNavButtons(): void
    {
        const activeId = this.activeDialog?.Visibled ? this.activeDialog.Id : null;
        document.querySelectorAll<HTMLElement>("#navBar .nav-btn").forEach(button =>
            button.classList.toggle("active", button.dataset.dialog === activeId));
    }
}

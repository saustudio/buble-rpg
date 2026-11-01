//#region UI

import { UIDialog } from "./Dialog";
import { BonusEffect, BonusOffer, EGameState, GameState } from "../model/GameState";
import { EventBus, GameEvents } from "../core/Core";
import { GameStateRepository } from "../store/GameStateRepository";
import { NavBarUI } from "./NavBar";

/** Описание карточки бонуса для UI. */
export interface BonusCardView
{
    Icon: string;
    Title: string;
    Unit: string;
    Description: string;
    CssClass: string;
}

/**
 * Общий UI отображения серверного предложения бонусов.
 */
export abstract class BonusUI extends UIDialog
{
    private lastOfferSignature = "";

    protected constructor(
        id: string,
        events: EventBus,
        protected readonly repository: GameStateRepository,
        protected readonly navBar: NavBarUI,
        protected readonly getOffer: (state: GameState) => readonly BonusOffer[],
        protected readonly onChoose: (bonusId: string) => void)
    {
        super(id);
        events.Subscribe<unknown>(GameEvents.StateChanged, () => this.Refresh());
    }

    protected abstract GetView(bonus: BonusOffer): BonusCardView | undefined;
    protected abstract RenderBody(bonus: BonusOffer): string;
    protected abstract FormatEffect(effect: BonusEffect): string;

    public Refresh(): void
    {
        const state = this.repository.Last();
        const offer = !state || state.Phase === EGameState.OVER ? [] : this.getOffer(state);

        if (offer.length === 0)
        {
            if (this.Visibled) this.navBar.Close(this.Id);
            this.lastOfferSignature = "";
            return;
        }

        if (this.Visibled && this.lastOfferSignature !== JSON.stringify(offer))
            this.LoadDialog(offer);
    }

    protected OpenOffer(): void
    {
        const state = this.repository.Last();
        if (!state || state.Phase === EGameState.OVER || this.getOffer(state).length === 0) return;

        super.Open();
        this.Refresh();
    }

    private LoadDialog(list: readonly BonusOffer[]): void
    {
        this.lastOfferSignature = JSON.stringify(list);
        this.Container.innerHTML = '';

        const cardContainer = document.createElement("div");
        cardContainer.className = "bonus-cards";

        for (const bonus of list)
        {
            const card = this.BuildCard(bonus);
            card.addEventListener("click", () => this.onChoose(bonus.Id));
            cardContainer.appendChild(card);
        }

        this.Container.appendChild(cardContainer);
    }

    private BuildCard(bonus: BonusOffer): HTMLElement
    {
        const view = this.GetView(bonus);
        const cssClass = view?.CssClass ? ` ${view.CssClass}` : "";

        const card = document.createElement("div");
        card.className = `bonus-card${cssClass}`;
        card.innerHTML = `
            <div class="bonus-icon">${view?.Icon ?? "❓"}</div>
            <div class="bonus-title">${view?.Title ?? bonus.Id}</div>
            ${this.RenderBody(bonus)}
            <div class="bonus-desc">${view?.Description ?? "Описание отсутствует"}</div>`;

        return card;
    }
}

//#endregion


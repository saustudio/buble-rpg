//#region UI

import { UIDialog } from "./Dialog";
import { BonusEffect, BonusOffer, EGameState, GameState } from "../model/GameState";
import { IGameStateView } from "../core/Core";

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
export abstract class BonusUI implements IGameStateView
{
    protected constructor(
        protected readonly dialog: UIDialog,
        protected readonly getOffer: (state: GameState) => readonly BonusOffer[],
        protected readonly onChoose: (bonusId: string) => void)
    {
    }

    protected abstract GetView(bonus: BonusOffer): BonusCardView | undefined;
    protected abstract RenderBody(bonus: BonusOffer): string;
    protected abstract FormatEffect(effect: BonusEffect): string;

    public Refresh(state: GameState): void
    {
        if (state.Phase === EGameState.OVER)
        {
            this.dialog.Close();
            return;
        }

        const offer = this.getOffer(state);
        if (offer.length === 0)
        {
            this.dialog.Close();
            return;
        }

        if (this.dialog.Visibled) return;

        this.dialog.Open();
        this.LoadDialog(offer);
    }

    private LoadDialog(list: readonly BonusOffer[]): void
    {
        this.dialog.Container.innerHTML = '';

        const cardContainer = document.createElement("div");
        cardContainer.className = "bonus-cards";

        for (const bonus of list)
        {
            const card = this.BuildCard(bonus);
            card.addEventListener("click", () => this.onChoose(bonus.Id));
            cardContainer.appendChild(card);
        }

        this.dialog.Container.appendChild(cardContainer);
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


//#region UI

import { EventBus, GameEvents } from "../core/Core";
import { UIDialog } from "./Dialog";
import { LootDrop, LootItem } from "../model/network/LootMessage";
import { UnitItem } from "../model/Unit";
import { ItemResources } from "../model/ItemResources";
import { ItemService } from "../services/ItemService";
import { IGameService } from "../services/IGameService";
import { GameStateRepository } from "../store/GameStateRepository";
import { LootRepository } from "../store/LootRepository";

/**
 * Сумка: ряд мешков с трупов сверху и карточки предметов выбранного мешка снизу.
 * Бой не останавливается — диалог только показывает данные, а клик по предмету
 * отправляет команду на сервер. Клиент не оптимистичен: ждём следующего
 * `LootMessage`, который перезапишет всё.
 * <para/>
 * На каждое состояние DOM не пересобирается: рендер идёт только когда изменился лут,
 * экипировка своего героя, видимость диалога или выбранный мешок.
 * <para/>
 * TODO: детали экипировки сервер шлёт только своему герою, поэтому сравнение для чужого лута без
 * надетого аналога — это ожидаемо пустая колонка.
 */
export class InventoryUI extends UIDialog
{
    private readonly bagsPanel: HTMLElement;
    private readonly itemsPanel: HTMLElement;
    private selectedBagId: number | null = null;

    // Guard от лишних пересборок DOM.
    private lootDirty = true;
    private wasVisible = false;
    private lastSelectedBagId: number | null = null;
    private lastEquipmentSignature = "";

    constructor(
        events: EventBus,
        private readonly repository: GameStateRepository,
        private readonly lootRepository: LootRepository,
        private readonly gameService: IGameService)
    {
        super("inventory");
        this.bagsPanel = document.getElementById("inventoryBags")!;
        this.itemsPanel = document.getElementById("inventoryItems")!;

        // Лут меняется отдельным событием; снимок состояния — каждый тик.
        events.Subscribe<unknown>(GameEvents.LootChanged, () =>
        {
            this.lootDirty = true;
            this.Refresh();
        });

        //this.unsubscribeState = events.Subscribe<unknown>(GameEvents.StateChanged, () => this.Refresh());
    }

    public Open(): void
    {
        super.Open();
        this.Refresh();
    }

    public Refresh(): void
    {
        const drops = this.lootRepository.Drops;
        const visibleDrops = drops.slice(0, 10);

        const visible = this.Visibled;
        const signature = this.EquipmentSignature();

        // Выбранный мешок мог исчезнуть (предмет забрали) — становимся на первый доступный.
        if (this.selectedBagId == null || !visibleDrops.some(drop => drop.BagId === this.selectedBagId))
            this.selectedBagId = visibleDrops.length > 0 ? visibleDrops[0].BagId : null;

        const changed = this.lootDirty
            || visible !== this.wasVisible
            || this.selectedBagId !== this.lastSelectedBagId
            || signature !== this.lastEquipmentSignature;

        this.lootDirty = false;
        this.wasVisible = visible;
        this.lastSelectedBagId = this.selectedBagId;
        this.lastEquipmentSignature = signature;

        if (!changed) return;
        if (!visible)
        {
            this.selectedBagId = visibleDrops.length > 0 ? visibleDrops[0].BagId : null;
            return;
        }

        this.RenderBags(visibleDrops);
        this.RenderItems(visibleDrops.find(drop => drop.BagId === this.selectedBagId) ?? null);
    }

    /**
     * Сигнатура экипировки своего героя: слот-тег, редкость, имя и характеристики надетых
     * предметов плюс базовые атрибуты. Пока строка та же — DOM не трогаем.
     */
    private EquipmentSignature(): string
    {
        const hero = this.repository.Last()?.MyHero;
        if (!hero) return "";

        const { Str, Dex, Int } = hero.Attributes;
        return `${JSON.stringify(hero.Equipment.Items)}|${Str}|${Dex}|${Int}`;
    }

    /**
     * Ряд мешков сверху диалога. Мешки — горизонтальный flex с переносом,
     * поэтому «пустой» placeholder на всю ширину не вставляем, чтобы не
     * ломать ряд: при отсутствии мешков просто очищаем панель.
     */
    private RenderBags(drops: readonly LootDrop[]): void
    {
        this.bagsPanel.innerHTML = "";

        if (drops.length === 0) return;

        this.bagsPanel.setAttribute("role", "tablist");

        for (const drop of drops)
        {
            const label = `Мешок #${drop.BagId}`;
            const button = document.createElement("button");
            button.type = "button";
            button.className = `inventory-bag${drop.BagId === this.selectedBagId ? " active" : ""}`;
            button.title = label;
            button.setAttribute("aria-label", label);
            button.setAttribute("role", "tab");
            button.setAttribute("aria-selected", drop.BagId === this.selectedBagId ? "true" : "false");
            button.innerHTML = `
                <span class="inventory-bag-icon" aria-hidden="true">
                    <svg viewBox="0 0 32 32" focusable="false">
                        <path d="M4 10 16 4.5 28 10v13L16 28.5 4 23z" fill="#704522" stroke="#d7a94f" stroke-linejoin="round" stroke-width="1.5" />
                        <path d="m4.5 10 11.5 5.5L27.5 10M16 15.5v12" fill="none" stroke="#f0c86c" stroke-width="1.5" />
                        <path d="m8 8.2 12 5.5v12.2M24 8.2l-12 5.5v12.2" fill="none" stroke="#b77b35" stroke-linejoin="round" stroke-width="1.2" />
                        <path d="M14 16.5h4v4h-4z" fill="#f0c86c" stroke="#704522" stroke-width="1" />
                    </svg>
                </span>
                <span class="inventory-bag-count">${drop.Items.length}</span>`;

            button.addEventListener("click", () =>
            {
                this.selectedBagId = drop.BagId;
                this.Refresh();
            });

            this.bagsPanel.appendChild(button);
        }

        const selectedDrop = drops.find(drop => drop.BagId === this.selectedBagId);
        if (selectedDrop)
        {
            const discard = document.createElement("button");
            discard.type = "button";
            discard.className = "inventory-discard";
            discard.title = "Удалить мешок";
            discard.setAttribute("aria-label", "Удалить мешок");
            discard.innerHTML = `
                <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
                    <path d="M4 10 16 4.5 28 10v13L16 28.5 4 23z" fill="#704522" stroke="#d7a94f" stroke-linejoin="round" stroke-width="1.5" />
                    <path d="m4.5 10 11.5 5.5L27.5 10M16 15.5v12" fill="none" stroke="#f0c86c" stroke-width="1.5" />
                    <path d="m8 8.2 12 5.5v12.2M24 8.2l-12 5.5v12.2" fill="none" stroke="#b77b35" stroke-linejoin="round" stroke-width="1.2" />
                    <path d="M14 16.5h4v4h-4z" fill="#f0c86c" stroke="#704522" stroke-width="1" />
                    <path d="m7 7 18 18M25 7 7 25" fill="none" stroke="#ff3434" stroke-linecap="round" stroke-width="3" />
                </svg>`;
            discard.addEventListener("click", () =>
            {
                void this.gameService.DiscardLoot(selectedDrop.BagId);
            });
            this.bagsPanel.appendChild(discard);
        }
    }

    private RenderItems(drop: LootDrop | null): void
    {
        this.itemsPanel.innerHTML = "";

        if (!drop || drop.Items.length === 0)
        {
            const empty = document.createElement("div");
            empty.className = "inventory-empty";
            empty.textContent = "Мешок пуст";
            this.itemsPanel.appendChild(empty);
            return;
        }

        for (const item of drop.Items) this.itemsPanel.appendChild(this.BuildCard(drop.BagId, item));
    }

    private BuildCard(bagId: number, item: LootItem): HTMLElement
    {
        const hero = this.repository.Last()?.MyHero ?? null;
        const met = ItemService.RequirementsMet(item, hero);

        const rarity = ItemResources.RarityClasses[item.Rarity] ?? "common";
        const rarityName = ItemResources.RarityNames[item.Rarity] ?? item.Rarity;
        const stars = ItemService.RarityStars(Object.keys(item.Explicits).length);

        // Надетый предмет того же слота: сравниваем группы базовых и прочих статов по отдельности.
        const equipped = this.EquippedItem(item);
        const baseGroup = ItemService.Compare(ItemService.BaseStats(item), InventoryUI.FilterBase(equipped?.Final, equipped?.Base));
        const otherGroup = ItemService.Compare(ItemService.OtherStats(item), InventoryUI.FilterOther(equipped?.Final, equipped?.Base));

        const card = document.createElement("button");
        card.className = `loot-choice-btn${met ? "" : " blocked"}`;
        card.disabled = !met;

        // Иконка едет ссылкой; её может не быть — тогда карточка без картинки.
        const icon = item.ImageUrl ? `<img class="loot-icon-img" src="${item.ImageUrl}" alt="">` : "";

        card.innerHTML = `
            ${icon}
            <span class="loot-info">
                <span class="loot-name rarity-${rarity}">${stars} ${item.Name}<span class="loot-item-type">${item.Class}</span></span>
                <span class="loot-meta">
                    <span class="rarity-tag-${rarity}">${rarityName}</span>
                    <span class="loot-level">Уровень ${item.Level}</span>
                </span>
                ${this.RequirementsLine(item, met)}
                ${baseGroup}
                ${otherGroup ? `<div class="stats-divider"></div>${otherGroup}` : ""}
            </span>`;

        const image = card.querySelector<HTMLImageElement>("img.loot-icon-img");
        image?.addEventListener("error", () => InventoryUI.OnIconError(image), { once: true });

        // Один клик = сразу команда. Остальные предметы мешка сгорят на сервере.
        card.addEventListener("click", () => { void this.gameService.PickLoot(bagId, item.Id); });

        return card;
    }

    /** Идемпотентная заглушка битой иконки: снимаем src, чтобы не зациклить `error`. */
    private static OnIconError(image: HTMLImageElement): void
    {
        if (image.dataset.fallback === "1") return;

        image.dataset.fallback = "1";
        image.removeAttribute("src");
        image.alt = "?";
    }

    /** Надетый предмет того же слота: сначала по `Tag`, затем по `Slot` как fallback. */
    private EquippedItem(item: LootItem): UnitItem | null
    {
        const hero = this.repository.Last()?.MyHero;
        if (!hero) return null;

        const items = hero.Equipment.Items;
        return items.find(equipped => equipped.Tag === item.Tag)
            ?? items.find(equipped => equipped.Slot === item.Slot)
            ?? null;
    }

    private static FilterBase(final?: Record<string, number>, base?: Record<string, number>): [string, number][]
    {
        if (!final || !base) return [];
        return Object.entries(final).filter(([key]) => key in base);
    }

    private static FilterOther(final?: Record<string, number>, base?: Record<string, number>): [string, number][]
    {
        if (!final || !base) return [];
        return Object.entries(final).filter(([key]) => !(key in base));
    }

    private RequirementsLine(item: LootItem, met: boolean): string
    {
        const req = ItemService.Requirements(item);
        const parts: string[] = [];

        if (req.Str > 0) parts.push(`Сила ${req.Str}`);
        if (req.Dex > 0) parts.push(`Ловкость ${req.Dex}`);
        if (req.Int > 0) parts.push(`Интеллект ${req.Int}`);
        if (parts.length === 0) return "";

        const state = met ? "" : " unmet";
        return `<span class="loot-requirements${state}">Требует: ${parts.join(", ")}</span>`;
    }
}

//#endregion
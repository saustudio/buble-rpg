# Спецификация: UI-слой без привязки к ECS

## Цель

Отделить UI от ECS. UI работает с клиентской моделью данных (DTO),
не знает ни про World, ни про компоненты, ни про EntityId.
Диалоги переиспользуемы, тестируемы в изоляции, готовы к мультиплееру.

## Общая архитектура

    [Источник данных]
       │
       │ (сейчас — ECS-маппер, потом — сеть)
       ▼
    UI-DTO (семантический, без презентации)
       │
       │ (клиентский маппер DTO → View)
       ▼
    View-модель (презентационная, локальная для диалога)
       │
       ▼
    Dialog.OnOpen(viewModel) → DOM

## Три слоя

### 1. UI-DTO — контракт между источником и UI

Живёт в shared-пакете. Используется и сервером (для отправки),
и клиентом (для приёма). Никаких DOM-типов, никакого ECS.

**Только семантика.** Факты, не зависящие от способа отображения:

- `rarity: "rare"` — да
- `rarityClass: "rarity-rare"` — нет
- `explicitCount: 3` — да
- `stars: "★★"` — нет
- `statChanges: [{ statId, delta, unit }]` — да
- `compareText: "(+12)"` — нет
- `requirements: { str: 20, met: false }` — да
- `requirementText: "Требует 20 Сила"` — нет

### 2. Клиентский маппер DTO → View

Живёт на клиенте, в папке рядом с диалогом. Чистая функция.
Отвечает за всю презентацию: звёздочки, css-классы, локализацию,
форматирование значений, иконки.

Маппер знает:
- UI-DTO
- Локальные типы View-модели

Маппер не знает:
- ECS
- DOM
- сеть

### 3. Dialog — чистый View

Принимает View-модель. Рендерит DOM. Не считает, не ходит в World,
не парсит DTO.

## Границы типов

Правило выноса типов наружу:

1. Тип живёт в одном файле → инлайн или локальный `type`.
2. Тип повторяется в одном файле → локальный `type`.
3. Тип пересекает границу модуля → экспортируемый `interface`.
4. Суффикс — только у корневого типа диалога (`LootDialogState`,
   `LevelUpDialogState`). Вложенные структуры — без суффиксов.

Запрещённые суффиксы: `VM`, `ViewModel` на каждом типе.
Для корневого типа допустимы: `State`, `Data`, `Model` (на выбор).

## Пример структуры

    ui/
      dialogs/
        LootDialog.ts           ← Dialog, локальный маппер, локальные View-типы
        LevelUpDialog.ts
        StatWindowDialog.ts
      models/
        LootItemView.ts         ← только если реально переиспользуется
    shared/
      protocol/
        LootDialog.ts           ← DTO, общий с сервером

## Пример кода

### UI-DTO (shared/protocol/LootDialog.ts)

    export interface LootDialogMessage {
        kind: "loot_dialog";
        dialogId: string;
        items: LootItemDto[];
    }

    export interface LootItemDto {
        id: string;
        name: string;
        iconRef: string;
        itemClass: string;
        rarity: ItemRarity;
        itemLevel: number;
        requirements: { str: number; dex: number; int: number; met: boolean };
        mods: ItemModDto[];
        statChanges: StatChangeDto[];
    }

    export interface ItemModDto {
        kind: "base" | "implicit" | "explicit" | "unique";
        statId: string;
        value: number;
        unit: "flat" | "percent" | "range";
        rangeMax?: number;
    }

    export interface StatChangeDto {
        statId: string;
        delta: number;
        unit: "flat" | "percent";
    }

### Dialog (ui/dialogs/LootDialog.ts)

    import type { LootDialogMessage, LootItemDto } from "../../shared/protocol/LootDialog";

    // Локальная View-модель. Используется только в этом файле.
    interface LootItemView {
        id: string;
        displayName: string;
        displayIcon: string;
        displayRarityClass: string;
        displayRarityLabel: string;
        displayRequirement: string;
        modLines: ModLineView[];
        changeLines: ChangeLineView[];
    }

    interface ModLineView {
        icon: string;
        label: string;
        value: string;
        compare?: { text: string; style: "better" | "worse" | "equal" };
    }

    interface ChangeLineView {
        icon: string;
        label: string;
        value: string;
        style: "better" | "worse" | "equal";
    }

    export interface LootDialogState {
        items: LootItemView[];
        onPick: (itemId: string) => void;
    }

    export class LootDialog extends Dialog {
        public readonly Key = "loot";
        public readonly PausesGame = true;

        private itemsEl: HTMLElement;
        private closeBtn: HTMLButtonElement;

        constructor() {
            super();
            this.itemsEl = document.getElementById("lootChoiceItems")!;
            this.closeBtn = document.getElementById("lootCloseBtn") as HTMLButtonElement;
            this.closeBtn.addEventListener("click", () => UI.Close(this.Key));
        }

        public OnOpen(state: LootDialogState): void {
            this.itemsEl.innerHTML = "";
            for (const item of state.items) {
                this.itemsEl.appendChild(this.renderItem(item, state.onPick));
            }
        }

        public OnClose(): void {
            this.itemsEl.innerHTML = "";
        }

        private renderItem(item: LootItemView, onPick: (id: string) => void): HTMLElement {
            // Только DOM. Никаких расчётов.
        }
    }

    // Маппер — чистая функция. Локальная для диалога.
    function mapLootItem(dto: LootItemDto): LootItemView {
        return {
            id: dto.id,
            displayName: formatName(dto),
            displayIcon: iconUrl(dto.iconRef),
            displayRarityClass: `rarity-${RARITY_CSS[dto.rarity]}`,
            displayRarityLabel: RARITY_LABELS[dto.rarity],
            displayRequirement: formatRequirement(dto.requirements),
            modLines: dto.mods.map(mapMod),
            changeLines: dto.statChanges.map(mapChange),
        };
    }

    export function buildLootDialogState(
        msg: LootDialogMessage,
        onPick: (itemId: string) => void,
    ): LootDialogState {
        return {
            items: msg.items.map(mapLootItem),
            onPick,
        };
    }

## UI-фасад

Фасад управляет стеком диалогов, паузой, регистрацией.
Не знает ни про ECS, ни про конкретные диалоги.

    export abstract class Dialog {
        public abstract readonly Key: string;
        public readonly PausesGame: boolean = true;
        public abstract OnOpen(payload: unknown): void;
        public OnClose(): void {}
        public CanCloseByUser(): boolean { return true; }
    }

    export class UI {
        private dialogs = new Map<string, Dialog>();
        private stack: Dialog[] = [];

        public Register(dialog: Dialog): void { ... }
        public Open(key: string, payload?: unknown): boolean { ... }
        public Close(key?: string): void { ... }
        public CloseAll(): void { ... }
        public HandleEscape(): void { ... }
    }

    export const UI = new UI();

`UI` — синглтон. Альтернатива — сервис, инжектируемый через конструктор.

## Потребитель UI (в single-player)

Сейчас — ECS-система, которая формирует DTO и вызывает UI.

    export class LootSystem implements System {
        Update(dt: number): void {
            // ... собрали лут ...
            const msg = LootMessageBuilder.Build(userEntity, loot);
            const state = buildLootDialogState(msg, (itemId) => {
                bus.Emit("player.picks_loot", { player: userEntity, itemId });
            });
            UI.Open("loot", state);
        }
    }

`LootMessageBuilder` — маппер ECS → DTO. Живёт рядом с ECS,
потом переедет на сервер без изменений.

## Потребитель UI (в мультиплеере)

Клиентский сервис, который получил DTO по сети.

    export class LootClientService {
        constructor(private ui: UI, private net: NetworkClient) {
            net.On("loot_dialog", (msg: LootDialogMessage) => this.onLoot(msg));
        }

        private onLoot(msg: LootDialogMessage): void {
            const state = buildLootDialogState(msg, (itemId) => {
                this.net.Send({ kind: "loot_pick", dialogId: msg.dialogId, itemId });
            });
            this.ui.Open("loot", state);
        }
    }

Dialog не меняется между single-player и мультиплеером.

## Что запрещено

- Dialog импортирует что-либо из ECS (`World`, `LootComponent`, `EntityId`).
- Dialog читает `World.GetComponent(...)`.
- Dialog содержит `Map<string, number>` с сырыми статами вместо View-полей.
- UI-DTO содержит css-классы, локализованные строки, иконки-эмодзи, звёздочки.
- Маппер знает про DOM.
- Фасад UI знает про конкретные диалоги.

## Что разрешено

- Dialog хранит локальные View-типы в своём файле.
- Dialog содержит маппер DTO → View, если он используется только им.
- Маппер — чистая функция без побочных эффектов.
- View-модель содержит только примитивы, пригодные для сериализации
  (кроме функций-обработчиков типа `onPick`).

## Тестирование

- Dialog: скормить мок View-модели → проверить DOM.
- Маппер: скормить мок DTO → проверить View-модель.
- ECS-маппер (MessageBuilder): скормить мок World → проверить DTO.

Все три теста независимы. Никаких моков ECS в тестах Dialog, никаких
моков DOM в тестах маппера.

## Правило проверки границы

Для каждого поля в DTO задать вопрос:

> "Если выйдет патч, меняющий только внешний вид (шрифт, цвет, иконку,
> порядок элементов), должно ли это поле измениться?"

- Да → поле презентационное, живёт на клиенте, не в DTO.
- Нет → поле семантическое, едет в DTO.
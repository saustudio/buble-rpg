# Спецификация: Сетевой слой без вторжения в ECS

## Цель

Добавить мультиплеер, не меняя ECS-симуляцию. ECS не знает про сеть.
Сеть не пишет в ECS. Всё взаимодействие — через компоненты и шину событий.

## Принципы

1. ECS никогда не ждёт сеть. Всё, что должно пережить задержку, живёт
   в компонентах (`ExpiresAt`, `dirty`, `Claimed`).
2. Сеть никогда не пишет в ECS-компоненты. Только читает.
3. Команды от клиента приходят как события в шину, ECS обрабатывает
   их как обычный input.
4. Единственный контракт между ECS и сетью — компоненты и события.
5. Сеть — сервис, а не ECS-система, если у неё есть собственное
   состояние (retryQueue, ackTracker, lastSentHash).

## Разделение: система vs сервис

- **ECS-система:** работает через компоненты, не хранит своего
  состояния (или хранит полностью восстановимое из компонентов),
  тикает в общем цикле.
- **Сервис:** хранит собственное состояние, работает с внешними
  ресурсами (сокеты, время, файлы), тикает отдельно или реагирует
  на события.

Примеры:

| Объект | Тип | Почему |
|---|---|---|
| LootDropSystem | Система | Создаёт компонент, ничего своего |
| PendingLootExpirySystem | Система | Читает ExpiresAt, удаляет сущности |
| LootPickSystem | Система | Обрабатывает событие через сервисы ECS |
| PendingLootBroadcaster | Сервис | Хранит retryQueue, lastSentHash, транспорт |
| NetworkTransport | Сервис | Сокеты, не про мир |
| InterestService | Сервис | Подписки, зоны, не про мир |

## Схема

    ┌─────────────────────────────────────────────────────┐
    │  СЕРВЕР                                             │
    │                                                     │
    │  ECS-системы ── пишут ──▶ Компоненты                │
    │       │                       ▲                     │
    │       │ эмитят                │ читает              │
    │       ▼                       │                     │
    │  ┌──────────────────────────────────────────────┐  │
    │  │ EventBus                                     │  │
    │  └──────────────────────────────────────────────┘  │
    │       ▲                       │                     │
    │       │ слушает               │ эмитит              │
    │       │                       ▼                     │
    │  Сервисы сети ◀──── транспорт ────▶ Клиент          │
    └─────────────────────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼─────────────────────┐
    │  КЛИЕНТ                       ▼                     │
    │  NetworkClient ──▶ ClientServices ──▶ UI.Open       │
    └─────────────────────────────────────────────────────┘

## Состояние vs событие

Ключевое правило:

> Если что-то важно не потерять — держи как **состояние**, не как событие.
> Событие = оптимизация (мгновенная реакция). Состояние = гарантия
> (восстановление после сбоя).

| Событие | Состояние |
|---|---|
| выпал лут X | PendingLootComponent на игроке |
| нанесён урон Y | HealthComponent.LifeCurrent |
| повысился уровень | StatsComponent.Level |
| открылся диалог лута | PendingLootComponent + dialogId |
| игрок взял предмет | EquipmentComponent игрока |

События шлём для мгновенной реакции. Состояния шлём для восстановления.
UI открывается по состоянию, а не по событию.

## Пример: лут

### Компонент-состояние

    class PendingLootComponent {
        public Items: Item[] = [];
        public DialogId: string = "";
        public AssignedTo: EntityId = 0;
        public ExpiresAt: number = 0;
        public Claimed: boolean = false;
        public OriginPosition: Vec2 = { x: 0, y: 0 };
    }

### ECS-система: создание лута

    export class LootDropSystem implements System {
        public Update(dt: number): void {
            for (const mob of this.deadMobsWithLoot()) {
                const loot = this.collectLoot(mob);
                const entity = World.EntityCreate()
                    .SetComponent(new PendingLootComponent())
                    .Entity;
                const pending = World.GetComponent(entity, PendingLootComponent)!;
                pending.Items = loot;
                pending.DialogId = uuid();
                pending.AssignedTo = this.killerOf(mob);
                pending.ExpiresAt = now() + 60_000;
                pending.OriginPosition = this.positionOf(mob);
            }
        }
    }

Система не знает про сеть. Просто создала компонент.

### ECS-система: таймаут

    export class PendingLootExpirySystem implements System {
        public Update(dt: number): void {
            const t = now();
            for (const entity of World.EntityQuery(PendingLootComponent)) {
                const pending = World.GetComponent(entity, PendingLootComponent)!;
                if (t < pending.ExpiresAt) continue;
                if (pending.Claimed) continue;
                this.returnToGround(pending.Items, pending.OriginPosition);
                World.EntityRemove(entity);
            }
        }
    }

Таймаут — ECS-логика, не сетевая. Сеть просто перестаёт видеть
сущность в EntityQuery и перестаёт её ретраить.

### ECS-система: обработка команды клиента

    export class LootPickSystem implements System {
        constructor(bus: EventBus) {
            bus.On<{ player: EntityId; dialogId: string; itemId: string }>(
                "player.wants_pick_loot",
                (e) => this.handlePick(e),
            );
        }

        public Update(dt: number): void {}

        private handlePick(e: { player: EntityId; dialogId: string; itemId: string }): void {
            const pendingEntity = this.findPendingByDialog(e.player, e.dialogId);
            if (!pendingEntity) return;

            const pending = World.GetComponent(pendingEntity, PendingLootComponent)!;
            const item = pending.Items.find(i => i.Id === e.itemId);
            if (!item) return;

            const eq = World.GetComponent(e.player, EquipmentComponent)!;
            EquipmentService.Equip(eq.Equipment, item);

            pending.Claimed = true;
            pending.ExpiresAt = 0;
        }
    }

Сеть не касается EquipmentComponent. Она эмитит событие, ECS
валидирует и обрабатывает.

### Сервис: broadcast состояния

    export class PendingLootBroadcaster {
        private retryQueue = new Map<EntityId, RetryEntry>();
        private lastSentHash = new Map<EntityId, string>();

        constructor(
            private world: World,
            private transport: NetworkTransport,
            private interest: InterestService,
        ) {}

        public Tick(dt: number): void {
            const t = now();

            for (const entity of this.world.EntityQuery(PendingLootComponent)) {
                const pending = this.world.GetComponent(entity, PendingLootComponent)!;
                const hash = hashState(pending);

                if (this.lastSentHash.get(entity) !== hash) {
                    this.broadcast(entity, pending);
                    this.lastSentHash.set(entity, hash);
                    this.retryQueue.set(entity, { nextRetryAt: t + RETRY_MS });
                    continue;
                }

                const retry = this.retryQueue.get(entity);
                if (retry && t >= retry.nextRetryAt) {
                    this.broadcast(entity, pending);
                    retry.nextRetryAt = t + RETRY_MS;
                }
            }

            for (const [entity] of this.retryQueue) {
                if (!this.world.HasComponent(entity, PendingLootComponent)) {
                    this.retryQueue.delete(entity);
                    this.lastSentHash.delete(entity);
                }
            }
        }

        public OnAck(entity: EntityId): void {
            this.retryQueue.delete(entity);
        }

        private broadcast(entity: EntityId, pending: PendingLootComponent): void {
            const msg = LootMessageBuilder.Build(entity, pending);
            for (const client of this.interest.WhoSees(entity)) {
                this.transport.Send(client, msg);
            }
        }
    }

Сервис хранит свои структуры вне мира. ECS про них не знает.

### Сервис: приём команд

    export class ClientCommandRouter {
        constructor(
            private bus: EventBus,
            private transport: NetworkTransport,
            private clients: ClientRegistry,
        ) {
            transport.On("loot_pick", (clientId, { dialogId, itemId }) => {
                bus.Emit("player.wants_pick_loot", {
                    player: this.clients.PlayerFor(clientId),
                    dialogId,
                    itemId,
                });
            });

            transport.On("loot_dialog_ack", (clientId, { dialogId }) => {
                const entity = this.findByDialog(clientId, dialogId);
                if (entity) bus.Emit("network.loot_ack", { entity });
            });
        }
    }

Сервис не тикает. Работает по событиям транспорта.

### Подключение сервисов к ACK

    // Связка: сервис-роутер эмитит, broadcaster подписан
    bus.On<{ entity: EntityId }>("network.loot_ack", (e) => {
        broadcaster.OnAck(e.entity);
    });

## Надёжная доставка

### ACK

Клиент, получив `loot_dialog`, шлёт `loot_dialog_ack`.
Сервер помечает доставленным, но не удаляет. Ждёт выбора игрока.
Если ACK не пришёл за N секунд — ретрай.

### Идемпотентность

У каждого сообщения есть `dialogId`. Клиент хранит множество открытых
диалогов. Повторная доставка не открывает второй раз, только
подтверждает.

    export class LootClientService {
        private openDialogs = new Set<string>();

        constructor(private ui: UI, private net: NetworkClient) {
            net.On("loot_dialog", (msg) => this.onLoot(msg));
        }

        private onLoot(msg: LootDialogMessage): void {
            if (this.openDialogs.has(msg.dialogId)) {
                this.net.Send({ kind: "loot_dialog_ack", dialogId: msg.dialogId });
                return;
            }
            this.openDialogs.add(msg.dialogId);

            const state = buildLootDialogState(msg, (itemId) => {
                this.net.Send({ kind: "loot_pick", dialogId: msg.dialogId, itemId });
                this.openDialogs.delete(msg.dialogId);
                this.ui.Close("loot");
            });
            this.ui.Open("loot", state);

            this.net.Send({ kind: "loot_dialog_ack", dialogId: msg.dialogId });
        }
    }

### Реконнект

Клиент шлёт `client_ready` с последним известным `dialogId`.
Сервер сверяет с состоянием и, если есть незакрытый лут, шлёт заново.
Это state reconciliation, а не догон потерянных событий.

## Ритм работы

ECS тикает 60 Hz. Сеть — свой ритм (20 Hz или по событиям).
Они не синхронизированы.

    export class GameLoop {
        private systems: System[] = [];
        private services: TickedService[] = [];

        public RegisterSystem(s: System): void { this.systems.push(s); }
        public RegisterService(s: TickedService): void { this.services.push(s); }

        public Tick(dt: number): void {
            for (const sys of this.systems) sys.Update(dt);
            for (const srv of this.services) srv.Tick(dt);
        }
    }

Сервисы тикают после систем, чтобы видеть актуальное состояние.
Если тикать до — прочитают вчерашние данные.

## Что запрещено

- ECS-система импортирует `NetworkTransport` или любой сетевой тип.
- ECS-система вызывает `transport.Send(...)`.
- Сетевой сервис пишет в ECS-компоненты напрямую.
- Сетевой сервис вызывает `EquipmentService.Equip(...)` и подобное.
- Сетевой сервис читает `EquipmentComponent` и логику боя.
- DTO содержит презентационные поля (css-классы, локализованные строки).
- Таймауты реализованы в сетевом слое. Таймаут — это ECS-логика.

## Что разрешено

- ECS-система эмитит события в шину (`bus.Emit`).
- ECS-система создаёт/меняет компоненты с полями для сети
  (`dirty`, `ExpiresAt`, `Claimed`).
- Сетевой сервис читает любые компоненты (только чтение).
- Сетевой сервис хранит своё состояние в себе (retryQueue, ackTracker).
- Сетевой сервис эмитит события в шину.
- Сетевой сервис подписан на события шины.

## Проверка чистоты

Тест на развязанность:

1. Удалить все сетевые сервисы. ECS должна продолжать работать.
   Лут падает, таймауты срабатывают, игра идёт.
2. Удалить EventBus. Сеть должна перестать работать, ECS — нет.
   (EventBus — часть ECS-контура, но не сетевого.)
3. Запустить ECS в headless-режиме без DOM и без сети.
   Симуляция работает, лут создаётся и удаляется по таймауту.

Если хотя бы один тест падает — архитектура протекла.

## Итого

- ECS — симуляция. Работает в своём темпе, ничего не ждёт.
- Сеть — сервисы-наблюдатели. Читают компоненты, пишут в свои
  структуры, эмитят события.
- Мост — компоненты и EventBus. Больше ничего.
- Всё, что важно не потерять, — состояние, не событие.
- Таймауты, валидация, идемпотентность — на стороне ECS.
- Ретраи, ACK, reconciliation — на стороне сети.
- DTO формирует сетевой слой. ECS про DTO не знает.
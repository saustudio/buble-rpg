import { System, World, EntityId, Ticker } from "./core";
import { EAffixLocalType, EAffixType, Item, ItemResources } from "./items";
import { GameStateComponent, EGameState, GameStateService } from "./gamestate";
import { UserComponent } from "./user";
import { HealthComponent } from "./health";
import { EquipmentComponent, EquipmentService, Equipment } from "./equipment";
import { EntityStatsComponent, EntityStatsService, IEntityStats, RawStats, StatIcons } from "./stats";
import { BonusComponent } from "./bonuses";
import { AttackHitComponent } from "./attack"
import { UIDialog } from "./dialog";

//#region DOMAIN

//#endregion

//#region ECS

export class LootComponent { constructor(public ItemList: Map<EntityId, Item[]> = new Map()) { } }

export class LootSystem implements System
{
    public Update(deltaTime: number): void
    {
        const gameState = World.SingleComponent(GameStateComponent)!.GameState;
        if (gameState.State == EGameState.PAUSE || gameState.State == EGameState.OVER) return;

        const hitList = World.EntityQuery(AttackHitComponent);
        for (const hitEntity of hitList)
        {
            const hit = World.GetComponent(hitEntity, AttackHitComponent)!;
            const health = World.GetComponent(hit.Target, HealthComponent)!;
            if (health.LifeCurrent > 0) continue;

            const equipment = World.GetComponent(hit.Target, EquipmentComponent);
            if (!equipment) continue;

            const lootList = EquipmentService.All(equipment.Equipment);
            if (lootList.length == 0) continue;

            const loot = World.GetComponent(hit.Source, LootComponent);
            if (!loot) 
            {
                const map = new Map<EntityId, Item[]>();
                map.set(hit.Target, lootList);
                World.SetComponent(hit.Source, new LootComponent(map));
            }
            else loot.ItemList.set(hit.Target, lootList);
        }
    }
}

//#endregion

//#region UI

class UI
{
    private static readonly PAUSE_SOURCE = "dialog:loot";
    private wasOpen: boolean;

    constructor(
        private ticker: Ticker,
        private gameStateService: GameStateService = new GameStateService(),
        private dialog: UIDialog = new UIDialog("loot"))
    {
        ticker.OnTick((d) => this.Refresh());
    }

    public Refresh(): void
    {
        //isGameOver
        const gameState = World.SingleComponent(GameStateComponent)!.GameState;
        if (gameState.State == EGameState.OVER) return;

        //hasLoot
        const lootEntity = World.EntityFirst(UserComponent, LootComponent);
        if (!lootEntity) return;

        if (this.wasOpen && !this.dialog.Visibled)
        {
            this.wasOpen = false;
            this.gameStateService.Resume(gameState, UI.PAUSE_SOURCE);
            World.RemoveComponent(lootEntity, LootComponent);
            return;
        }

        const loot = World.GetComponent(lootEntity, LootComponent)!;
        if (loot.ItemList.size == 0)
        {
            this.dialog.Close();
            return;
        }

        if (this.dialog.Visibled) return;

        // открыть и отрисовать
        this.dialog.Open();
        this.wasOpen = true;
        this.gameStateService.Pause(gameState, UI.PAUSE_SOURCE);
        this.ShowLoot(lootEntity, loot);
    }

    private ShowLoot(lootEntity: EntityId, loot: LootComponent): void
    {
        this.dialog.Container.innerHTML = '';

        const userEquipment = World.GetComponent(lootEntity, EquipmentComponent)!.Equipment;
        const [key, itemList] = Array.from(loot.ItemList)[0];
        for (const lootItem of itemList)
        {
            const diffStats = this.StatsDiff(lootEntity, lootItem);
            const btn = this.BuildLootButton(lootItem, userEquipment, diffStats);
            btn.addEventListener('click', () =>
            {
                EquipmentService.Equip(userEquipment, lootItem);
                loot.ItemList.delete(key);
                this.ShowLoot(lootEntity, loot);
            });

            this.dialog.Container.appendChild(btn);
        }

    }

    private BuildLootButton(lootItem: Item, userEquipment: Equipment, diffStats: Map<string, number>): HTMLButtonElement
    {
        const btn = document.createElement('button');
        btn.className = 'loot-choice-btn';
        const equiped = EquipmentService.All(userEquipment);
        const currentItem = equiped.find(item => item.Tag === lootItem.Tag);
        btn.innerHTML = this.ShowItemStats(lootItem, currentItem, diffStats);
        return btn;
    }

    private StatsDiff(entity: EntityId, lootItem: Item): Map<string, number>
    {
        const userStats = World.GetComponent(entity, EntityStatsComponent)!;
        const userBonuses = World.GetComponent(entity, BonusComponent)!;
        const userEquipment = World.GetComponent(entity, EquipmentComponent)!;

        const hasItemWithTag = EquipmentService.All(userEquipment.Equipment).some(item => item.Tag === lootItem.Tag);
        const previewItems = hasItemWithTag ? EquipmentService.All(userEquipment.Equipment).map(item => item.Tag === lootItem.Tag ? lootItem : item) : [...EquipmentService.All(userEquipment.Equipment), lootItem];

        const rawStats = new RawStats();
        for (const b of userBonuses.List ?? []) rawStats.Add(EntityStatsService.BonusToRaw(b));
        for (const item of previewItems) for (const [type, value] of item.Final) rawStats.Add(EntityStatsService.AffixToRaw(type as EAffixType, value));

        const tempStats = EntityStatsService.Resolve(rawStats, userStats.Base);
        const diffMap = new Map<string, number>();

        (Object.keys(userStats.Final) as (keyof IEntityStats)[]).forEach(key =>
        {
            const current = userStats.Final[key];
            const preview = tempStats[key];
            const diff = preview - current;
            if (diff !== 0) diffMap.set(key, diff);
        });

        return diffMap;
    }

    private ShowItemStats(lootItem: Item, currentItem: Item | undefined, diffStats: Map<string, number>): string
    {
        const rarityClass = ItemResources.RarityClasses[lootItem.Rarity] || 'common';
        const rarityname = ItemResources.RarityNames[lootItem.Rarity];
        const stars = this.RarityStars(lootItem.Explicits.size);
        const name = lootItem.Name;

        let html = `
        <span class="loot-icon">
            <img src="https://web.poecdn.com/image/${lootItem.Icon}?scale=1" style="width:100%; height:100%; object-fit:contain; image-rendering:pixelated;">
        </span>
        <div class="loot-info">
            <div class="loot-name rarity-${rarityClass}">
                ${stars} ${name}
                <span class="loot-item-type">${lootItem.Class}</span>
            </div>
            
            <div class="loot-meta">
                <span class="rarity-tag-${rarityClass}">${rarityname}</span>
                <span class="loot-level">Уровень ${lootItem.Level}</span>
                <span class="loot-requirements">Требует ${lootItem.Str} Сила ${lootItem.Dex} Ловкость ${lootItem.Int} Интеллект</span>
            </div>
    `;

        // === БАЗОВЫЕ СТАТЫ ===
        const lootBaseStats = new Map([...lootItem.Final].filter(([key]) => lootItem.Base.has(key)));
        const equipBaseStats = currentItem ? new Map([...currentItem.Final].filter(([key]) => currentItem.Base.has(key))) : undefined;
        html += this.ShowStatsGroup(lootBaseStats, equipBaseStats);

        // === ПРОЧИЕ СТАТЫ ===
        const lootStats = new Map([...lootItem.Final].filter(([key]) => !lootItem.Base.has(key)));
        const equipStats = currentItem ? new Map([...currentItem.Final].filter(([key]) => !currentItem.Base.has(key))) : undefined;
        if (lootStats.size > 0)
        {
            html += `<div class="stats-divider"></div>`;
            html += this.ShowStatsGroup(lootStats, equipStats);
        }

        // // === ИМПЛИЦИТЫ ===
        // if (lootItem.Implicits.size > 0) 
        // {
        //     html += `<div class="stats-divider"></div>`;
        //     html += this.RenderStatsGroup(lootItem.Implicits, currentItem?.Implicits);
        // }

        // // === ЭКСПЛИЦИТЫ (аффиксы) ===
        // if (lootItem.Explicits.size > 0) 
        // {
        //     html += `<div class="stats-divider"></div>`;
        //     html += this.RenderStatsGroup(lootItem.Explicits, currentItem?.Explicits);
        // }


        // === Влияние на статы ===
        // if (diffStats.size > 0) 
        // {
        //     html += `<div class="stats-divider"></div>`;
        //     html += this.RenderStatsDiff(diffStats);
        // }


        return html;
    }

    private ShowStatsDiff(diffStats: Map<string, number>): string
    {
        let html = `<div class="loot-compare">`;

        const pairedStats: [string, string][] = [
            ["PhysicalDamageMin", "PhysicalDamageMax"],
            ["FireDamageMin", "FireDamageMax"],
            ["ColdDamageMin", "ColdDamageMax"],
            ["LightDamageMin", "LightDamageMax"]
        ];

        const processed = new Set<string>();

        for (const [minKey, maxKey] of pairedStats)
        {
            const minDiff = diffStats.get(minKey) ?? 0;
            const maxDiff = diffStats.get(maxKey) ?? 0;
            if (minDiff === 0 && maxDiff === 0) continue;

            processed.add(minKey);
            processed.add(maxKey);

            const style = minDiff < 0 || maxDiff < 0 ? "worse" : minDiff > 0 || maxDiff > 0 ? "better" : "equal";
            html += `<span title="${minKey}/${maxKey}" class="${style}">${StatIcons[minKey]} ${this.FormatDiffValue(minDiff)}/${this.FormatDiffValue(maxDiff)}</span>`;
        }

        for (const [key, diff] of diffStats)
        {
            if (processed.has(key)) continue;
            const style = diff < 0 ? "worse" : diff > 0 ? "better" : "equal";
            html += `<span title="${key}" class="${style}">${StatIcons[key]} ${this.FormatDiffValue(diff)}</span>`;
        }

        html += `</div>`;
        return html;
    }


    private ShowStatsGroup(affixes: Map<string, number>, currentAffixes: Map<string, number> = new Map()): string
    {
        if (affixes.size === 0 && currentAffixes.size === 0) return '';

        let html = `<div class="stats-group base-stats">`;

        const pairs = this.GetPairedStats();

        // pairMap: ключ -> { partner, isMin }
        // Ключи берём ровно те, что вернул GetPairedStats(), без нормализации.
        const pairMap = new Map<string, { partner: string; isMin: boolean }>();
        for (const [minKey, maxKey] of pairs)
        {
            pairMap.set(minKey, { partner: maxKey, isMin: true });
            pairMap.set(maxKey, { partner: minKey, isMin: false });
        }

        // Репрезентативное значение.
        // Одиночный -> value
        // Парный   -> (min + max) / 2
        // Работает и для min-, и для max-ключа: если ключ — часть пары,
        // берём его значение и значение партнёра из того же источника.
        const getRep = (source: Map<string, number>, key: string): number | undefined =>
        {
            const selfVal = source.get(key);
            if (selfVal === undefined) return undefined;

            const pair = pairMap.get(key);
            if (!pair) return selfVal;

            const partnerVal = source.get(pair.partner);
            if (partnerVal === undefined) return selfVal; // партнёра нет — сравниваем как одиночный

            return (selfVal + partnerVal) / 2;
        };

        const renderLine = (key: string, value: number, compareHtml: string, removed: boolean): string =>
        {
            const k = key as EAffixLocalType | EAffixType;
            const label = ItemResources.AffixLabels[k] || key;
            const icon = ItemResources.AffixIcons[k] || "";
            const inc = key.endsWith("_+%") ? "%" : "";
            const isLocal = Object.values(EAffixLocalType).includes(k as EAffixLocalType);
            const localClass = isLocal ? " affix" : "";
            const removedClass = removed ? " removed" : "";

            const pair = pairMap.get(key);
            if (pair && !pair.isMin) return '';

            const valueText = pair ? `${value}-${(removed ? currentAffixes : affixes).get(pair.partner) ?? 0}${inc}` : `${value}${inc}`;

            return `<div class="stat-line${localClass}${removedClass}">
                    <span class="stat-icon">${icon}</span>
                    <span class="stat-label">${label}</span>
                    <span class="stat-value">${valueText}</span>
                    ${compareHtml}
                </div>`;
        };

        const buildCompare = (newRep: number | undefined, oldRep: number | undefined): string =>
        {
            if (oldRep === undefined) return `<span class="stat-compare better">(+)</span>`;
            const diff = newRep! - oldRep;
            if (diff === 0) return `<span class="stat-compare equal">(=)</span>`;

            const style = diff < 0 ? "worse" : "better";
            return `<span class="stat-compare ${style}">(${this.FormatDiffValue(diff)})</span>`;
        };

        // 1. Активные аффиксы нового предмета
        for (const [key, value] of affixes)
        {
            if (value === 0) continue;

            const pair = pairMap.get(key);
            if (pair && !pair.isMin) continue; // max рисуется вместе с min

            const newRep = getRep(affixes, key);
            if (newRep === undefined) continue;

            const oldRep = getRep(currentAffixes, key);
            html += renderLine(key, value, buildCompare(newRep, oldRep), false);
        }

        // 2. Удалённые аффиксы (есть в старом, нет в новом)
        for (const [key, value] of currentAffixes)
        {
            if (value === 0) continue;
            if (affixes.has(key)) continue;

            const pair = pairMap.get(key);
            if (pair && !pair.isMin) continue; // max рисуется вместе с min

            html += renderLine(key, value, `<span class="stat-compare worse">(-)</span>`, true);
        }

        html += `</div>`;
        return html;
    }

    private FormatDiffValue(diff: number): string
    {
        const value = Number.isInteger(diff) ? diff.toString() : diff.toFixed(1);
        return diff > 0 ? `+${value}` : value;
    }

    private GetPairedStats(): [string, string][] 
    {
        return [
            [EAffixType.PHYS_DAMAGE_MIN, EAffixType.PHYS_DAMAGE_MAX],

            [EAffixType.ATTACK_PHYS_DAMAGE_MIN, EAffixType.ATTACK_PHYS_DAMAGE_MAX],
            [EAffixType.ATTACK_FIRE_DAMAGE_MIN, EAffixType.ATTACK_FIRE_DAMAGE_MAX],
            [EAffixType.ATTACK_COLD_DAMAGE_MIN, EAffixType.ATTACK_COLD_DAMAGE_MAX],
            [EAffixType.ATTACK_LIGHT_DAMAGE_MIN, EAffixType.ATTACK_LIGHT_DAMAGE_MAX],

            [EAffixLocalType.FIRE_DAMAGE_MIN, EAffixLocalType.FIRE_DAMAGE_MAX],
            [EAffixLocalType.COLD_DAMAGE_MIN, EAffixLocalType.COLD_DAMAGE_MAX],
            [EAffixLocalType.LIGHT_DAMAGE_MIN, EAffixLocalType.LIGHT_DAMAGE_MAX],

            [EAffixType.CAST_PHYS_MIN, EAffixType.CAST_PHYS_MAX],
            [EAffixType.CAST_FIRE_MIN, EAffixType.CAST_FIRE_MAX],
            [EAffixType.CAST_COLD_MIN, EAffixType.CAST_COLD_MAX],
            [EAffixType.CAST_LIGHT_MIN, EAffixType.CAST_LIGHT_MAX]
        ];
    }


    private RarityStars(modsCount: number): string
    {
        if (modsCount > 4) return '★★★';
        if (modsCount > 2) return '★★';
        if (modsCount > 0) return '★';
        return '';
    }
}

//#endregion

export function InitLootModule(ticker: Ticker): void
{
    World.SystemAdd(new LootSystem());
    new UI(ticker);
}


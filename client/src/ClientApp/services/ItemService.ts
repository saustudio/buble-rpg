import { Unit } from "../model/Unit";
import { LootItem, LootItemRequirements } from "../model/network/LootMessage";
import { ItemResources } from "../model/ItemResources";

/**
 * Презентация предмета добычи: требования, группировка статов и сравнение с надетым предметом.
 * Модель — только данные, поэтому все подписи, форматирование и разметка колонки сравнения
 * живут здесь. Имена редкости берутся из единого источника `ItemResources`.
 * <para/>
 * TODO: подписи неполные — неизвестный ключ показывается сырым. Расширять по мере появления
 * новых модов; в перспективе вынести в data-файл.
 */
export class ItemService
{
    public static Requirements(item: LootItem): LootItemRequirements
    {
        return item.Requirements;
    }

    /**
     * Та же формула, что на сервере: порог «ровно» проходит. Сервер остаётся источником истины —
     * здесь только блокируем заведомо отклоняемую карточку.
     */
    public static RequirementsMet(item: LootItem, hero: Unit | null): boolean
    {
        if (!hero) return false;

        const req = item.Requirements;
        return req.Str <= hero.Attributes.Str
            && req.Dex <= hero.Attributes.Dex
            && req.Int <= hero.Attributes.Int;
    }

    /** Статы `Final`, лежащие в `Base` (базовые характеристики предмета). */
    public static BaseStats(item: LootItem): [string, number][]
    {
        return Object.entries(item.Final).filter(([key]) => key in item.Base);
    }

    /** Статы `Final`, не лежащие в `Base` (аффиксы: имплиситы и эксплиситы). */
    public static OtherStats(item: LootItem): [string, number][]
    {
        return Object.entries(item.Final).filter(([key]) => !(key in item.Base));
    }

    /** Ключ-партнёр min/max-пары или null, если ключ в пары не входит. */
    public static PairKey(key: string): string | null
    {
        for (const [min, max] of ItemResources.PairedStats)
        {
            if (key === min) return max;
            if (key === max) return min;
        }

        return null;
    }

    /**
     * HTML-строка группы `.stats-group` со строками `.stat-line` и колонкой сравнения
     * `.stat-compare`. Порт старого `ShowStatsGroup`/`buildCompare`: для min/max-пары берётся
     * представительное значение (среднее), отсутствие надетого даёт `(+)`, а аффиксы, которые
     * есть в надетом, но пропали в новом, рисуются строкой `(-)` — для этого карты передаются
     * целиком, а не по одному ключу.
     * @param lootStats статы нового предмета (пары ключ-значение из `Final`).
     * @param equippedStats статы надетого предмета того же слота (может быть пусто).
     */
    public static Compare(lootStats: readonly [string, number][], equippedStats: readonly [string, number][]): string
    {
        if (lootStats.length === 0 && equippedStats.length === 0) return "";

        const loot = new Map<string, number>(lootStats);
        const equipped = new Map<string, number>(equippedStats);

        // pairMap: ключ -> { partner, isMin }. Ключи берём ровно те, что вернул `PairedStats`.
        const pairMap = new Map<string, { partner: string; isMin: boolean }>();
        for (const [min, max] of ItemResources.PairedStats)
        {
            pairMap.set(min, { partner: max, isMin: true });
            pairMap.set(max, { partner: min, isMin: false });
        }

        // Репрезентативное значение: одиночный -> value, парный -> среднее min и max.
        const getRep = (source: ReadonlyMap<string, number>, key: string): number | undefined =>
        {
            const self = source.get(key);
            if (self === undefined) return undefined;

            const pair = pairMap.get(key);
            if (!pair) return self;

            const partner = source.get(pair.partner);
            return partner === undefined ? self : (self + partner) / 2;
        };

        const buildCompare = (newRep: number | undefined, oldRep: number | undefined): string =>
        {
            if (oldRep === undefined) return `<span class="stat-compare better">(+)</span>`;

            const diff = newRep! - oldRep;
            if (diff === 0) return `<span class="stat-compare equal">(=)</span>`;

            const style = diff < 0 ? "worse" : "better";
            return `<span class="stat-compare ${style}">(${ItemService.FormatDiff(diff)})</span>`;
        };

        const renderLine = (key: string, value: number, partner: number | undefined, compare: string, removed: boolean): string =>
        {
            const label = ItemResources.AffixLabels[key] ?? key;
            const icon = ItemResources.AffixIcons[key] ?? "";
            const inc = key.endsWith("%") ? "%" : "";
            const removedClass = removed ? " removed" : "";

            const valueText = partner === undefined
                ? `${ItemService.FormatNumber(value)}${inc}`
                : `${ItemService.FormatNumber(value)}-${ItemService.FormatNumber(partner)}${inc}`;

            return `<div class="stat-line${removedClass}">
                    <span class="stat-icon">${icon}</span>
                    <span class="stat-label">${label}</span>
                    <span class="stat-value">${valueText}</span>
                    ${compare}
                </div>`;
        };

        let html = `<div class="stats-group">`;

        // 1. Статы нового предмета. У min/max-пары рисуется только min-ключ (вместе с max).
        for (const [key, value] of loot)
        {
            if (value === 0) continue;

            const pair = pairMap.get(key);
            if (pair && !pair.isMin) continue;

            const newRep = getRep(loot, key);
            if (newRep === undefined) continue;

            const oldRep = getRep(equipped, key);
            const partner = pair ? loot.get(pair.partner) : undefined;
            html += renderLine(key, value, partner, buildCompare(newRep, oldRep), false);
        }

        // 2. Удалённые статы: есть в надетом, нет в новом — считаются ухудшением.
        for (const [key, value] of equipped)
        {
            if (value === 0) continue;
            if (loot.has(key)) continue;

            const pair = pairMap.get(key);
            if (pair && !pair.isMin) continue;

            const partner = pair ? equipped.get(pair.partner) : undefined;
            html += renderLine(key, value, partner, `<span class="stat-compare worse">(-)</span>`, true);
        }

        html += `</div>`;
        return html;
    }

    /** Звёзды «качества» по числу эксплиситов. */
    public static RarityStars(explicitsCount: number): string
    {
        if (explicitsCount > 4) return "★★★";
        if (explicitsCount > 2) return "★★";
        if (explicitsCount > 0) return "★";
        return "";
    }

    /** Значение стата: целые без дробной части, иначе один знак; `%` по суффиксу ключа. */
    public static Format(key: string, value: number): string
    {
        const number = ItemService.FormatNumber(value);
        return key.endsWith("%") ? `${number}%` : number;
    }

    /** Разница значений со знаком `+` для положительных. */
    public static FormatDiff(value: number): string
    {
        const number = ItemService.FormatNumber(value);
        return value > 0 ? `+${number}` : number;
    }

    private static FormatNumber(value: number): string
    {
        return Number.isInteger(value) ? String(value) : value.toFixed(1);
    }
}

/**
 * Сетевое сообщение добычи — зеркало серверного `LootMessage`. Приходит отдельным событием
 * `"Loot"` только при изменении и полностью замещает клиентское состояние (см. `LootRepository`).
 * Мешок адресуется `BagId` — id сущности жертвы.
 */
export interface LootMessage
{
    Drops: LootDrop[];
}

/** Мешок с одного трупа: с него берётся ровно один предмет, остальные сгорают. */
export interface LootDrop
{
    BagId: number;
    Items: LootItem[];
}

/** Предмет добычи целиком: слот, требования, итоговые моды и ссылка на иконку. */
export interface LootItem
{
    Id: string;
    Slot: string;
    Name: string;
    Class: string;
    Rarity: string;
    Level: number;
    Requirements: LootItemRequirements;
    Implicits: Record<string, number>;
    Explicits: Record<string, number>;
    /** Базовые характеристики предмета (до аффиксов). */
    Base: Record<string, number>;
    Final: Record<string, number>;
    /** Ссылка на иконку предмета (CDN); пустая строка, если картинки нет. */
    ImageUrl: string;
    /** Слот-тег предмета, по нему ищется надетый аналог. */
    Tag: string;
}

/** Требования к ношению: минимумы характеристик, а не бонусы. */
export interface LootItemRequirements
{
    Str: number;
    Dex: number;
    Int: number;
}

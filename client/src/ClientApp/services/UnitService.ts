import { Unit, UnitItem } from "../model/Unit";

/**
 * Операции над юнитом, которые нужны нескольким местам клиента.
 * Живут здесь, а не рядом с моделью: модель — только данные.
 */
export class UnitService
{
    /** Редкости по возрастанию: клиент сам оценивает «крутизну» юнита по экипировке. */
    private static readonly RarityOrder = ["common", "magic", "rare"];

    /** Предмет в слоте ("weapon", "helm"...) или null, если слот пуст. */
    public static ItemInSlot(unit: Unit, slot: string): UnitItem | null
    {
        return unit.Equipment.Items.find(item => item.Slot === slot) ?? null;
    }

    /** Максимальная редкость надетого. Сервер редкость юнита не присылает. */
    public static MaxRarity(unit: Unit): string
    {
        return unit.Equipment.Items.reduce(
            (best, item) => UnitService.RarityRank(item.Rarity) > UnitService.RarityRank(best) ? item.Rarity : best,
            "common");
    }

    private static RarityRank(rarity: string): number
    {
        const rank = UnitService.RarityOrder.indexOf(rarity);
        return rank < 0 ? 0 : rank;
    }
}

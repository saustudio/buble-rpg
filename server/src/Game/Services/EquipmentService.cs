using BubleRpg.Server.Game.Model;
using BubleRpg.Server.Application.Services;

namespace BubleRpg.Server.Game.Services;

public sealed class EquipmentService(GameDbContext store)
{
    public Equipment Get(int id)
    {
        return store.EntityGet<Equipment>(id);
    }

    public static EEquipSlot ResolveSlot(Item item)
    {
        return item.Tag switch
        {
            ItemTag.WEAPON => EEquipSlot.WEAPON,
            ItemTag.BODY_ARMOUR => EEquipSlot.BODY,
            ItemTag.HELM => EEquipSlot.HELM,
            ItemTag.GLOVES => EEquipSlot.GLOVES,
            ItemTag.BOOTS => EEquipSlot.BOOTS,
            ItemTag.SHEILD => EEquipSlot.OFFHAND,
            ItemTag.QUIVER => EEquipSlot.OFFHAND,
            ItemTag.AMULET => EEquipSlot.AMULET,
            ItemTag.BELT => EEquipSlot.BELT,
            ItemTag.RING => EEquipSlot.RING,
            _ => throw new InvalidOperationException($"Нет слота для тега \"{item.Tag}\"")
        };
    }

    public static (EEquipSlot Slot, Item? Replaced) Equip(Equipment equipment, Item item)
    {
        var slot = ResolveSlot(item);
        equipment.Slots.TryGetValue(slot, out var replaced);
        equipment.Slots[slot] = item;
        return (slot, replaced);
    }

    /// <summary>Кладёт предмет в уже вычисленный слот; заменённый предмет молча теряется.</summary>
    public static void EquipAt(Equipment equipment, EEquipSlot slot, Item item) => equipment.Slots[slot] = item;

    /// <summary>Снимает все слоты и отдаёт те же инстансы предметов (лут переносится, а не копируется).</summary>
    public static List<Item> TakeAll(Equipment equipment)
    {
        var result = All(equipment);

        foreach (var slot in Enum.GetValues<EEquipSlot>())
            equipment.Slots[slot] = null;

        return result;
    }

    public static Item? Unequip(Equipment equipment, EEquipSlot slot)
    {
        equipment.Slots.TryGetValue(slot, out var removed);
        equipment.Slots[slot] = null;
        return removed;
    }

    public static List<Item> All(Equipment equipment)
    {
        var result = new List<Item>();

        foreach (var slot in Enum.GetValues<EEquipSlot>())
        {
            if (equipment.Slots.TryGetValue(slot, out var item) && item != null)
                result.Add(item);
        }

        return result;
    }
}

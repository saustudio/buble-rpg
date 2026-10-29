namespace BubleRpg.Server.Game.Model;

public enum EEquipSlot
{
    WEAPON,
    BODY,
    HELM,
    GLOVES,
    BOOTS,
    RING,
    AMULET,
    BELT,
    OFFHAND
}

public sealed class Equipment
{
    public Dictionary<EEquipSlot, Item?> Slots { get; } = new()
    {
        [EEquipSlot.WEAPON] = null,
        [EEquipSlot.BODY] = null,
        [EEquipSlot.HELM] = null,
        [EEquipSlot.GLOVES] = null,
        [EEquipSlot.BOOTS] = null,
        [EEquipSlot.RING] = null,
        [EEquipSlot.AMULET] = null,
        [EEquipSlot.BELT] = null,
        [EEquipSlot.OFFHAND] = null
    };
}

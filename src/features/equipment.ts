import { Graphics, IComponent, Logger, IRenderer, System, Ticker, World } from "./core";
import { GameStateComponent, EGameState } from "./gamestate";
import { EItemRarity, EItemTag, Item } from "./items";
import { UserComponent } from "./user";
import { Transform2DComponent } from "./movement";
import { RigidbodyComponent } from "./physics";

//#region ФИЧА: экипировка

export enum EEquipSlot
{
    WEAPON = "weapon",
    BODY = "body",
    HELM = "helm",
    GLOVES = "gloves",
    BOOTS = "boots",
    RING = "ring",
    AMULET = "amulet",
    BELT = "belt",
    OFFHAND = "offhand",
}

/**
 * Чистая модель экипировки. Только данные.
 * Никаких методов, никаких правил — только структура.
 */
export class Equipment
{
    public Slots: Record<EEquipSlot, Item | null> = {
        [EEquipSlot.WEAPON]: null,
        [EEquipSlot.BODY]: null,
        [EEquipSlot.HELM]: null,
        [EEquipSlot.GLOVES]: null,
        [EEquipSlot.BOOTS]: null,
        [EEquipSlot.RING]: null,
        //[EEquipSlot.RING_RIGHT]: null,
        [EEquipSlot.AMULET]: null,
        [EEquipSlot.BELT]: null,
        [EEquipSlot.OFFHAND]: null,
    };
}

/**
 * Чистый сервис экипировки. Работает только с Equipment.
 * Не знает про World, EntityId, компоненты.
 */
// equipment.service.ts
export class EquipmentService
{
    /**
     * Определяет, в какой слот положить предмет.
     * Для большинства предметов слот = тег.
     * Для кольца — свободный слот, иначе правое.
     */
    public static ResolveSlot(equipment: Equipment, item: Item): EEquipSlot
    {
        const map: Record<EItemTag, EEquipSlot | null> = {
            [EItemTag.WEAPON]: EEquipSlot.WEAPON,
            [EItemTag.BODY_ARMOUR]: EEquipSlot.BODY,
            [EItemTag.HELM]: EEquipSlot.HELM,
            [EItemTag.GLOVES]: EEquipSlot.GLOVES,
            [EItemTag.BOOTS]: EEquipSlot.BOOTS,
            [EItemTag.SHEILD]: EEquipSlot.OFFHAND,
            [EItemTag.QUIVER]: EEquipSlot.OFFHAND,
            [EItemTag.AMULET]: EEquipSlot.AMULET,
            [EItemTag.BELT]: EEquipSlot.BELT,
            [EItemTag.RING]: EEquipSlot.RING
        };


        const slot = map[item.Tag];
        if (!slot) throw new Error(`Нет слота для тега "${item.Tag}"`);
        return slot;
    }

    public static Equip(equipment: Equipment, item: Item): { slot: EEquipSlot; replaced: Item | null }
    {
        const slot = this.ResolveSlot(equipment, item);
        const replaced = equipment.Slots[slot];
        equipment.Slots[slot] = item;
        return { slot, replaced };
    }

    public static Unequip(equipment: Equipment, slot: EEquipSlot): Item | null
    {
        const removed = equipment.Slots[slot];
        equipment.Slots[slot] = null;
        return removed;
    }

    public static All(equipment: Equipment): Item[]
    {
        const result: Item[] = [];
        for (const slot of Object.values(EEquipSlot))
        {
            const item = equipment.Slots[slot];
            if (item) result.push(item);
        }
        return result;
    }
}

export class EquipmentComponent implements IComponent { constructor(public Equipment: Equipment) { } }

export class EquipmentSystem implements System
{
    Update(deltaTime: number): void
    {
        const gameState = World.SingleComponent(GameStateComponent)!.GameState;
        if (gameState.State == EGameState.PAUSE || gameState.State == EGameState.OVER) return;

        const entityList = World.EntityQuery(EquipmentComponent);
        for (const entity of entityList)
        {
            const equipment = World.GetComponent(entity, EquipmentComponent)!;

        }


    }
}

export class EquipmentRenderer implements IRenderer 
{
    Render(): void
    {

        const entityList = World.EntityQuery(RigidbodyComponent, Transform2DComponent, EquipmentComponent);
        for (const entity of entityList)
        {
            const pos = World.GetComponent(entity, Transform2DComponent)!;
            const body = World.GetComponent(entity, RigidbodyComponent)!;
            const equipment = World.GetComponent(entity, EquipmentComponent)!;

            // Позиция иконки - слева от персонажа
            let iconX = pos.X - body.Size - 15;
            let iconY = pos.Y - body.Size - 8;

            //TODO реализовать отрисовку иконок экипировка над сущностями
            // const style = new PIXI.TextStyle({
            //     fontSize: 12,
            //     fill: 0xffffff,
            //     align: 'center'
            // });

            //let icon = new PIXI.Text(`${ItemResources.ClassIcons[itemClass]}`, style);
            //icon.anchor.set(0.5, 0.5);
            //icon.position.set(iconX, iconY);
            //this.context.TextLayer.addChild(icon);
        }
    }

}


//#endregion



export function InitEquipmentModule(ticker: Ticker)
{
    World.SystemAdd(new EquipmentSystem());
    Graphics.RendererAdd(new EquipmentRenderer());
}

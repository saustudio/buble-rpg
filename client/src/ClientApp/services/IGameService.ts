export interface IGameService
{
    MoveTo(x: number, y: number): void | Promise<void>;
    ChooseLevelBonus(bonusId: string): void | Promise<void>;
    ChooseWaveBonus(bonusId: string): void | Promise<void>;
    PickLoot(bagId: number, itemId: string): void | Promise<void>;
    DiscardLoot(bagId: number): void | Promise<void>;
    Respawn(): void | Promise<void>;
}

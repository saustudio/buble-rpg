export interface IGameService
{
    MoveTo(x: number, y: number): void | Promise<void>;
    ChooseLevelBonus(bonusId: string): void | Promise<void>;
    ChooseWaveBonus(bonusId: string): void | Promise<void>;
    PickLoot(itemId: string): void | Promise<void>;
}

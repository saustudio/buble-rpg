import { GameState } from "../model/GameState";

export interface IRenderer
{
    Render(deltaTime: number): void;
}

export interface IGameStateView
{
    Refresh(state: GameState): void;
}

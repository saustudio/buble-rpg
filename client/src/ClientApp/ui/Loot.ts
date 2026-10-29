//#region UI

import { IGameStateView } from "../core/Core";
import { UIDialog } from "./Dialog";
import { GameState } from "../model/GameState";

export class LootUI implements IGameStateView
{
    constructor(private readonly dialog: UIDialog)
    {
    }

    public Refresh(_state: GameState): void
    {
        if (this.dialog.Visibled) this.dialog.Close();
    }
}

//#endregion

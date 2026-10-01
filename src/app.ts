import { Input, World, Graphics, Ticker } from "./features/core";
import { InitGameStateModule } from "./features/gamestate";
import { InitHealthModule } from "./features/health";
import { InitMovementModule } from "./features/movement";
import { InitPhysicsModule } from "./features/physics";
import { InitUserModule } from "./features/user";
import { InitLootModule } from "./features/loot";
import { InitTargetingModule } from "./features/targeting";
import { InitAttackModule } from "./features/attack";
import { InitExperienceModule } from "./features/experience";
import { InitBonusModule } from "./features/bonuses";
import { InitSpawnModule } from "./features/spawn";
import { InitEquipmentModule } from "./features/equipment";
import { InitStatsModule } from "./features/stats";

declare const PIXI: any;

//#region APP

class App
{
    private gameLoop = new Ticker();

    constructor()
    {
        this.Initialize();
    }

    public Initialize()
    {
        this.gameLoop.OnTick(delta => World.Update(delta));

        Input.Init();
        World.Clear();

        InitMovementModule();
        InitTargetingModule();
        InitPhysicsModule();
        InitSpawnModule(this.gameLoop);
        InitEquipmentModule(this.gameLoop);
        InitStatsModule(this.gameLoop);
        InitAttackModule();
        InitHealthModule();
        InitLootModule(this.gameLoop);
        InitExperienceModule(this.gameLoop);
        InitBonusModule(this.gameLoop);
        InitUserModule();
        InitGameStateModule(this.gameLoop);
    }

    public Run(): void
    {
        Graphics.Start();
        this.gameLoop.Start();
    }

}

const app = new App();
app.Run();

//#endregion

import { System, World, Logger, Ticker } from "./core";
import { UserComponent } from "./user";
import { HealthComponent } from "./health";
import { EntityStatsService, EntityStatsComponent } from "./stats";
import { TargetComponent, PreyComponent, FractionComponent } from "./targeting";
import { EquipmentComponent, Equipment, EquipmentService, EEquipSlot } from "./equipment";
import { ExpComponent } from "./experience";
import { SpawnComponent } from "./spawn";
import { RigidbodyComponent } from "./physics";
import { VelocityComponent, Transform2DComponent } from "./movement";
import { Graphics } from "./core";
import { ItemFactory, EItemTag, EAffixType } from "./items";
import { BonusComponent } from "./bonuses";
import { UIDialog } from "./dialog";

//#region DOMAIN

export enum EGameState { INIT, PLAY, OVER, PAUSE }

export class GameState
{
    public State: EGameState = EGameState.INIT;
    public PauseSources: Set<string> = new Set();
}

export class GameStateService
{
    public Pause(gs: GameState, source: string): void
    {
        gs.PauseSources.add(source);
        this.Recompute(gs);
    }

    public Resume(gs: GameState, source: string): void
    {
        gs.PauseSources.delete(source);
        this.Recompute(gs);
    }

    public Over(gs: GameState): void
    {
        gs.State = EGameState.OVER;
        gs.PauseSources.clear();
    }

    public Reset(gs: GameState): void
    {
        gs.State = EGameState.INIT;
        gs.PauseSources.clear();
    }

    public Play(gs: GameState): void
    {
        gs.State = EGameState.PLAY;
    }

    private Recompute(gs: GameState): void
    {
        if (gs.State === EGameState.OVER) return;
        if (gs.State === EGameState.INIT) return;
        gs.State = gs.PauseSources.size > 0 ? EGameState.PAUSE : EGameState.PLAY;
    }
}

//#endregion

//#region ECS
export class GameStateComponent
{
    constructor(public GameState: GameState) { }
}


export class GameStateSystem implements System
{
    constructor()
    {
        World.EntityCreate().SetComponent(new GameStateComponent(new GameState()));
        Logger.Info(GameStateSystem.name, '✅ система успешно инициализирована');
    }

    Update(deltaTime: number): void
    {
        const gameState = World.SingleComponent(GameStateComponent)!.GameState;
        if (gameState.State == EGameState.OVER) return;

        if (gameState.State == EGameState.PLAY)
        {

            let userEntity = World.EntityFirst(UserComponent, HealthComponent)!;
            const userHealth = World.GetComponent(userEntity, HealthComponent)!;
            if (userHealth.LifeCurrent <= 0) 
            {
                gameState.State = EGameState.OVER
                World.EntityRemove(userEntity);
            }
        }


        if (gameState.State == EGameState.INIT)
        {
            this.InitUser();
            gameState.State = EGameState.PLAY;
        }
    }

    private InitUser()
    {
        const baseStats = EntityStatsService.Default();
        baseStats.Str = baseStats.Dex = baseStats.Int = 15;
        baseStats.LifeMax = 38;
        baseStats.MovementSpeed = 50;

        //подбор подходящей экипировки
        const equipment = new Equipment();
        const weapon = ItemFactory.Random(1, EItemTag.WEAPON, baseStats.Str, baseStats.Dex, baseStats.Int);
        if (weapon) EquipmentService.Equip(equipment, weapon);
        const range = weapon?.Final.get(EAffixType.ATTACK_RANGE) ?? 0;
        if (range < 100)
        {
            const helm = ItemFactory.Random(1, EItemTag.HELM, baseStats.Str, baseStats.Dex, baseStats.Int);
            if (helm) EquipmentService.Equip(equipment, helm);
            const body = ItemFactory.Random(1, EItemTag.BODY_ARMOUR, baseStats.Str, baseStats.Dex, baseStats.Int);
            if (body) EquipmentService.Equip(equipment, body);
            const gloves = ItemFactory.Random(1, EItemTag.GLOVES, baseStats.Str, baseStats.Dex, baseStats.Int);
            if (gloves) EquipmentService.Equip(equipment, gloves);
            const amulet = ItemFactory.Random(1, EItemTag.AMULET, baseStats.Str, baseStats.Dex, baseStats.Int);
            if (amulet) EquipmentService.Equip(equipment, amulet);
            const ring = ItemFactory.Random(1, EItemTag.RING, baseStats.Str, baseStats.Dex, baseStats.Int);
            if (ring) EquipmentService.Equip(equipment, ring);
            const belt = ItemFactory.Random(1, EItemTag.BELT, baseStats.Str, baseStats.Dex, baseStats.Int);
            if (belt) EquipmentService.Equip(equipment, belt);
            const boots = ItemFactory.Random(1, EItemTag.BOOTS, baseStats.Str, baseStats.Dex, baseStats.Int);
            if (boots) EquipmentService.Equip(equipment, boots);
        }


        World.EntityCreate()
            .SetComponent(new EquipmentComponent(equipment))
            .SetComponent(new UserComponent())
            .SetComponent(new EntityStatsComponent(baseStats))
            .SetComponent(new TargetComponent())
            .SetComponent(new RigidbodyComponent(25, 50))
            .SetComponent(new VelocityComponent())
            .SetComponent(new Transform2DComponent(Graphics.Width / 2, Graphics.Height / 2))
            .SetComponent(new HealthComponent())
            .SetComponent(new PreyComponent())
            .SetComponent(new ExpComponent())
            .SetComponent(new BonusComponent())
            .SetComponent(new FractionComponent(0)).Entity;
    }
}

//#endregion

//#region IO

export class UI
{
    constructor(
        ticker: Ticker,
        private gameStateService: GameStateService = new GameStateService(),
        private dialog: UIDialog = new UIDialog("gameover"),
    )
    {
        ticker.OnTick(() => this.Refresh());
        const btnRestart = this.dialog.Container.querySelector<HTMLElement>(".btn-restart")!;
        btnRestart.addEventListener("click", () => this.OnRestart());
    }

    private Refresh(): void
    {
        const gameState = World.SingleComponent(GameStateComponent)!.GameState;
        if (gameState.State !== EGameState.OVER) return;
        if (this.dialog.Visibled) return;

        this.ShowStats();
        this.dialog.Open();
    }

    private ShowStats(): void
    {
        const waveEntity = World.EntityFirst(SpawnComponent);
        const wave = waveEntity ? World.GetComponent(waveEntity, SpawnComponent) : null;
        this.dialog.Container.querySelector("#gameOverWave")!.textContent = String(wave?.Lvl ?? 0);

        const playerEntity = World.EntityFirst(UserComponent);
        const exp = playerEntity ? World.GetComponent(playerEntity, ExpComponent) : null;
        this.dialog.Container.querySelector("#gameOverLevel")!.textContent = String(exp?.Lvl ?? 0);
    }

    private OnRestart(): void
    {
        const gameState = World.SingleComponent(GameStateComponent)!.GameState;
        this.gameStateService.Reset(gameState);
        this.dialog.Close();
    }
}


//#endregion

export function InitGameStateModule(ticker: Ticker)
{
    World.SystemAdd(new GameStateSystem());
    new UI(ticker);
}

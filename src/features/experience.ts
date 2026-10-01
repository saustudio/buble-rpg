import { System, Ticker, World } from "./core";
import { GameStateComponent, EGameState } from "./gamestate";
import { UserComponent } from "./user";
import { HealthComponent } from "./health";
import { AttackHitComponent } from "./attack";
import { EntityStatsComponent } from "./stats";
export class ExpComponent { constructor(public Value: number = 0, public Next: number = 100, public Lvl: number = 1) { } }

//#region ФИЧА: опыт

export class ExpSystem implements System
{
    public Update(deltaTime: number): void
    {
        const gameState = World.GetComponent(World.EntityFirst(GameStateComponent)!, GameStateComponent)!.GameState;
        if (gameState.State == EGameState.PAUSE || gameState.State == EGameState.OVER) return;

        for (const lvlEntity of World.EntityQuery(ExpComponent)) 
        {
            const exp = World.GetComponent(lvlEntity, ExpComponent)!
            if (exp.Value >= exp.Next) exp.Next = Math.floor(exp.Next * 2);
        }

        const hitList = World.EntityQuery(AttackHitComponent);
        for (const entity of hitList)
        {
            //повреждения
            const damage = World.GetComponent(entity, AttackHitComponent)!;
            const targetHealth = World.GetComponent(damage.Target, HealthComponent);
            const targetStats = World.GetComponent(damage.Target, EntityStatsComponent);
            if (!targetHealth || !targetStats) continue;
            if (targetHealth.LifeCurrent > 0) continue;

            const exp = World.GetComponent(damage.Source, ExpComponent);
            if (!exp) continue;

            exp.Value += Math.floor(targetStats.Final.LifeMax);
            if (exp.Value >= exp.Next) exp.Lvl++;

        }
    }
}

class UI
{
    private xpText: HTMLElement;
    private statLevel: HTMLElement;
    private xpBarFill: HTMLElement;

    constructor(private ticker: Ticker) 
    {
        ticker.OnTick((d) => this.Refresh());

        this.xpText = document.getElementById('xpText')!;
        this.statLevel = document.getElementById('statLevel')!;
        this.xpBarFill = document.getElementById('xpBarFill')!;

    }

    public Refresh(): void
    {
        {
            const user = World.EntityFirst(UserComponent, ExpComponent);
            if (!user) return;

            const exp = World.GetComponent(user, ExpComponent)!;
            this.xpText.textContent = `${Math.floor(exp.Value)}/${exp.Next}`;
            this.statLevel.textContent = String(exp.Lvl);
            this.xpBarFill.style.width = `${(exp.Value / exp.Next) * 100}%`;
        }

    }
}

export function InitExperienceModule(ticker: Ticker): void
{
    World.SystemAdd(new ExpSystem());
    new UI(ticker);
}
//#endregion

//#region UI

import { IGameStateView } from "../core/Core";
import { EGameState, GameState, Unit } from "../model/GameState";
import { UnitService } from "../services/UnitService";

/** Панель цели под атакой: и монстр, и чужой герой. */
export class EnemyHudUI implements IGameStateView
{
    private readonly panel: HTMLElement;
    private readonly hpFill: HTMLElement;
    private readonly esFill: HTMLElement;
    private readonly hpText: HTMLElement;
    private readonly rarity: HTMLElement;
    private readonly level: HTMLElement;

    constructor()
    {
        this.panel = document.getElementById("enemyInfo")!;
        this.hpFill = document.getElementById("enemyHpFill")!;
        this.esFill = document.getElementById("enemyEsFill")!;
        this.hpText = document.getElementById("enemyHpText")!;
        this.rarity = document.getElementById("enemyRarity")!;
        this.level = document.getElementById("enemyLevel")!;
    }

    public Refresh(state: GameState): void
    {
        const targetId = state.Phase === EGameState.PLAY ? state.EnemyTarget : null;

        if (targetId == null)
        {
            this.Hide();
            return;
        }

        // Роль цели задаёт список, в котором она пришла: сначала монстры, затем чужие герои.
        const monster = state.Monsters.find(monster => monster.Id === targetId);
        if (monster)
        {
            this.Show(monster, false);
            return;
        }

        const hero = state.EnemyHeroes.find(hero => hero.Id === targetId);
        if (hero)
        {
            this.Show(hero, true);
            return;
        }

        this.Hide();
    }

    /**
     * Подпись зависит от роли: у героя — оружие, у монстра — клиентская оценка
     * «крутизны» по экипировке. Сервер редкость монстра не присылает.
     */
    private Show(target: Unit, isHero: boolean): void
    {
        this.ShowBars(target.Vitals.LifeCurrent, target.Vitals.LifeMax, target.Vitals.EsCurrent, target.Vitals.EsMax);

        const weapon = isHero ? UnitService.ItemInSlot(target, "weapon") : null;

        if (weapon)
        {
            this.rarity.textContent = weapon.Name;
            this.rarity.className = `enemy-rarity ${EnemyHudUI.RarityClass(weapon.Rarity)}`;
        }
        else if (isHero)
        {
            this.rarity.textContent = "Герой";
            this.rarity.className = "enemy-rarity common";
        }
        else
        {
            const rarity = UnitService.MaxRarity(target);
            this.rarity.textContent = EnemyHudUI.RarityTitle(rarity);
            this.rarity.className = `enemy-rarity ${EnemyHudUI.RarityClass(rarity)}`;
        }

        this.level.textContent = `Ур. ${target.Progress.Level}`;
        this.panel.classList.add("show");
    }

    private ShowBars(life: number, lifeMax: number, es: number, esMax: number): void
    {
        this.hpFill.style.width = `${EnemyHudUI.Percent(life, lifeMax) * 100}%`;
        this.esFill.style.width = `${EnemyHudUI.Percent(es, esMax) * 100}%`;
        this.hpText.textContent = `${Math.max(0, life).toFixed()}/${lifeMax.toFixed()}`;
    }

    private Hide(): void
    {
        this.panel.classList.remove("show");
    }

    private static RarityTitle(rarity: string): string
    {
        if (rarity === "rare") return "Редкий";
        if (rarity === "magic") return "Необычный";
        return "Обычный";
    }

    private static RarityClass(rarity: string): string
    {
        if (rarity === "rare") return "elite";
        if (rarity === "magic") return "rare";
        return "common";
    }

    private static Percent(current: number, max: number): number
    {
        if (!(max > 0)) return 0;
        return Math.max(0, Math.min(1, current / max));
    }
}

//#endregion

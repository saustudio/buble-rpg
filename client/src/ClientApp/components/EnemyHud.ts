//#region UI

import { IGameStateView } from "../core/Core";
import { EGameState, EMonsterRarity, GameState, HeroState, MonsterState } from "../model/GameState";

const RarityTitle: Record<EMonsterRarity, string> =
{
    [EMonsterRarity.COMMON]: "Обычный",
    [EMonsterRarity.RARE]: "Редкий",
    [EMonsterRarity.ELITE]: "Элитный",
};

const RarityClass: Record<EMonsterRarity, string> =
{
    [EMonsterRarity.COMMON]: "common",
    [EMonsterRarity.RARE]: "rare",
    [EMonsterRarity.ELITE]: "elite",
};

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

        const monster = state.Monsters.find(monster => monster.Id === targetId);
        if (monster)
        {
            this.ShowMonster(monster);
            return;
        }

        const hero = state.EnemyHeroes.find(hero => hero.Id === targetId);
        if (hero)
        {
            this.ShowHero(hero);
            return;
        }

        this.Hide();
    }

    private ShowMonster(target: MonsterState): void
    {
        this.ShowBars(target.LifeCurrent, target.LifeMax, target.EsCurrent, target.EsMax);
        this.rarity.textContent = RarityTitle[target.Rarity];
        this.rarity.className = `enemy-rarity ${RarityClass[target.Rarity]}`;
        this.level.textContent = `Ур. ${target.Level}`;
        this.panel.classList.add("show");
    }

    private ShowHero(target: HeroState): void
    {
        this.ShowBars(target.LifeCurrent, target.LifeMax, target.EsCurrent, target.EsMax);
        this.rarity.textContent = target.WeaponName ?? "Герой";
        this.rarity.className = `enemy-rarity ${EnemyHudUI.HeroRarityClass(target.WeaponRarity)}`;
        this.level.textContent = `Ур. ${target.Level}`;
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

    private static HeroRarityClass(rarity: string | null): string
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

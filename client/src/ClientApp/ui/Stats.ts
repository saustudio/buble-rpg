//#region UI

import { IGameStateView } from "../core/Core";
import { UIDialog } from "./Dialog";
import { GameState } from "../model/GameState";

export class StatsUI implements IGameStateView
{
    private readonly weaponName: HTMLElement;
    private readonly physDmg: HTMLElement;
    private readonly fireDmg: HTMLElement;
    private readonly coldDmg: HTMLElement;
    private readonly lightDmg: HTMLElement;
    private readonly attackSpeed: HTMLElement;
    private readonly attackRange: HTMLElement;
    private readonly accuracy: HTMLElement;
    private readonly critChance: HTMLElement;
    private readonly critMult: HTMLElement;
    private readonly stunInc: HTMLElement;
    private readonly str: HTMLElement;
    private readonly dex: HTMLElement;
    private readonly int: HTMLElement;
    private readonly hp: HTMLElement;
    private readonly regen: HTMLElement;
    private readonly lifePerKill: HTMLElement;
    private readonly speed: HTMLElement;
    private readonly es: HTMLElement;
    private readonly armor: HTMLElement;
    private readonly physReduction: HTMLElement;
    private readonly evasion: HTMLElement;
    private readonly block: HTMLElement;
    private readonly reflect: HTMLElement;
    private readonly stunReduction: HTMLElement;
    private readonly fireRes: HTMLElement;
    private readonly coldRes: HTMLElement;
    private readonly lightRes: HTMLElement;

    private menuDialog: UIDialog | null = null;
    private wasOpen = false;

    constructor()
    {
        const menuPanel = document.querySelectorAll<HTMLElement>(".stat-nav-btn")!;
        for (const menuItem of menuPanel) menuItem.addEventListener("click", () =>
        {
            if (this.menuDialog)
            {
                if (this.menuDialog.Id == menuItem.dataset.dialog) return;
                this.menuDialog.Close();
            }

            this.wasOpen = false;
            this.menuDialog = new UIDialog(menuItem.dataset.dialog!);
        });

        const $ = (id: string): HTMLElement => document.getElementById(id)!;

        this.weaponName = $('weaponNameDisplay');
        this.physDmg = $('statPhysDmg');
        this.fireDmg = $('statFireDmg');
        this.coldDmg = $('statColdDmg');
        this.lightDmg = $('statLightDmg');
        this.attackSpeed = $('statAttackSpeed');
        this.attackRange = $('statAttackRange');
        this.accuracy = $('statAccuracy');
        this.critChance = $('statCritChance');
        this.critMult = $('statCritMult');
        this.stunInc = $('statStunInc');
        this.str = $('statStr');
        this.dex = $('statDex');
        this.int = $('statInt');
        this.hp = $('hpText');
        this.regen = $('statRegen');
        this.lifePerKill = $('statLifePerKill');
        this.speed = $('statSpeed');
        this.es = $('statES');
        this.armor = $('statArmor');
        this.physReduction = $('statPhysReduction');
        this.evasion = $('statEvasion');
        this.block = $('statBlock');
        this.reflect = $('statReflect');
        this.stunReduction = $('statStunReduction');
        this.fireRes = $('statFireRes');
        this.coldRes = $('statColdRes');
        this.lightRes = $('statLightRes');
    }

    public Refresh(state: GameState): void
    {
        if (!this.menuDialog)
        {
            this.wasOpen = false;
            return;
        }

        if (!this.menuDialog.Visibled && this.wasOpen)
        {
            this.menuDialog = null;
            return;
        }

        if (this.menuDialog.Visibled) return;

        const hero = state.Hero;
        if (!hero) return;

        const stats = hero.Stats;

        this.hp.textContent = `${hero.LifeCurrent.toFixed()}/${hero.LifeMax.toFixed()}`;
        this.es.textContent = `${hero.EsCurrent.toFixed()}/${hero.EsMax.toFixed()}`;

        this.regen.textContent = stats.LifePerSecond.toFixed(2);
        this.lifePerKill.textContent = stats.LifePerKill.toFixed();
        this.speed.textContent = stats.MovementSpeed.toFixed();

        this.str.textContent = hero.Str.toFixed();
        this.dex.textContent = hero.Dex.toFixed();
        this.int.textContent = hero.Int.toFixed();

        this.armor.textContent = stats.Armour.toFixed();
        this.physReduction.textContent = stats.PhysReduction.toFixed() + '%';
        this.evasion.textContent = stats.Evasion.toFixed();
        this.block.textContent = stats.Block.toFixed() + '%';
        this.reflect.textContent = stats.PhysReflect.toFixed();
        this.stunReduction.textContent = stats.StunReduction.toFixed() + '%';

        this.fireRes.textContent = stats.FireResist.toFixed() + '%';
        this.coldRes.textContent = stats.ColdResist.toFixed() + '%';
        this.lightRes.textContent = stats.LightResist.toFixed() + '%';

        this.physDmg.textContent = `${stats.PhysicalDamageMin.toFixed()}-${stats.PhysicalDamageMax.toFixed()}`;
        this.fireDmg.textContent = `${stats.FireDamageMin.toFixed()}-${stats.FireDamageMax.toFixed()}`;
        this.coldDmg.textContent = `${stats.ColdDamageMin.toFixed()}-${stats.ColdDamageMax.toFixed()}`;
        this.lightDmg.textContent = `${stats.LightDamageMin.toFixed()}-${stats.LightDamageMax.toFixed()}`;

        this.attackSpeed.textContent = stats.AttackSpeed.toFixed(2);
        this.attackRange.textContent = hero.AttackRange.toFixed();
        this.accuracy.textContent = stats.Accuracy.toFixed();
        this.critChance.textContent = stats.CriticalChance.toFixed() + '%';
        this.critMult.textContent = stats.CriticalMultiplier.toFixed(2) + 'x';
        this.stunInc.textContent = stats.Stun.toFixed() + '%';

        this.weaponName.textContent = hero.WeaponName ?? "Без оружия";
        this.weaponName.className = `stat-value rarity-${hero.WeaponRarity ?? "common"}`;

        this.menuDialog.Open();
        this.wasOpen = true;
    }
}

//#endregion

//#region UI

import { IGameStateView } from "../core/Core";
import { UIDialog } from "./Dialog";
import { GameState } from "../model/GameState";
import { UnitService } from "../services/UnitService";

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

        const hero = state.MyHero;
        if (!hero) return;

        const { Offence, Defence, Vitals, Attributes } = hero;

        this.hp.textContent = `${Vitals.LifeCurrent.toFixed()}/${Vitals.LifeMax.toFixed()}`;
        this.es.textContent = `${Vitals.EsCurrent.toFixed()}/${Vitals.EsMax.toFixed()}`;

        this.regen.textContent = Vitals.LifePerSecond.toFixed(2);
        this.lifePerKill.textContent = Vitals.LifePerKill.toFixed();
        this.speed.textContent = Attributes.MovementSpeed.toFixed();

        this.str.textContent = Attributes.Str.toFixed();
        this.dex.textContent = Attributes.Dex.toFixed();
        this.int.textContent = Attributes.Int.toFixed();

        this.armor.textContent = Defence.Armour.toFixed();
        this.physReduction.textContent = Defence.PhysReduction.toFixed() + '%';
        this.evasion.textContent = Defence.Evasion.toFixed();
        this.block.textContent = Defence.Block.toFixed() + '%';
        this.reflect.textContent = Defence.PhysReflect.toFixed();
        this.stunReduction.textContent = Defence.StunReduction.toFixed() + '%';

        this.fireRes.textContent = Defence.FireResist.toFixed() + '%';
        this.coldRes.textContent = Defence.ColdResist.toFixed() + '%';
        this.lightRes.textContent = Defence.LightResist.toFixed() + '%';

        this.physDmg.textContent = `${Offence.PhysicalDamageMin.toFixed()}-${Offence.PhysicalDamageMax.toFixed()}`;
        this.fireDmg.textContent = `${Offence.FireDamageMin.toFixed()}-${Offence.FireDamageMax.toFixed()}`;
        this.coldDmg.textContent = `${Offence.ColdDamageMin.toFixed()}-${Offence.ColdDamageMax.toFixed()}`;
        this.lightDmg.textContent = `${Offence.LightDamageMin.toFixed()}-${Offence.LightDamageMax.toFixed()}`;

        this.attackSpeed.textContent = Offence.AttackSpeed.toFixed(2);
        this.attackRange.textContent = hero.Attack.Range.toFixed();
        this.accuracy.textContent = Offence.Accuracy.toFixed();
        this.critChance.textContent = Offence.CriticalChance.toFixed() + '%';
        this.critMult.textContent = Offence.CriticalMultiplier.toFixed(2) + 'x';
        this.stunInc.textContent = Offence.Stun.toFixed() + '%';

        // Детальное оружие придёт отдельным осмотром; здесь — только имя и редкость.
        const weapon = UnitService.ItemInSlot(hero, "weapon");
        this.weaponName.textContent = weapon?.Name ?? "Без оружия";
        this.weaponName.className = `stat-value rarity-${weapon?.Rarity ?? "common"}`;

        this.menuDialog.Open();
        this.wasOpen = true;
    }
}

//#endregion

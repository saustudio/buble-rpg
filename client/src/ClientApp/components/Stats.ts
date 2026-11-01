//#region UI

import { EventBus, GameEvents } from "../core/Core";
import { UIDialog } from "./Dialog";
import { UnitService } from "../services/UnitService";
import { GameStateRepository } from "../store/GameStateRepository";

export class WeaponStatsUI extends UIDialog
{
    constructor(events: EventBus, private readonly repository: GameStateRepository)
    {
        super("weapon");
        events.Subscribe<unknown>(GameEvents.StateChanged, () => this.Refresh());
    }

    public Open(): void
    {
        super.Open();
        this.Refresh();
    }

    private Refresh(): void
    {
        const hero = this.repository.Last()?.MyHero;
        if (!hero) return;

        const { Offence } = hero;
        const weapon = UnitService.ItemInSlot(hero, "weapon");
        const weaponName = document.getElementById("weaponNameDisplay")!;
        weaponName.textContent = weapon?.Name ?? "Без оружия";
        weaponName.className = `stat-value rarity-${weapon?.Rarity ?? "common"}`;

        const setText = (id: string, value: string): void => { document.getElementById(id)!.textContent = value; }

        setText("statPhysDmg", `${Offence.PhysicalDamageMin.toFixed()}-${Offence.PhysicalDamageMax.toFixed()}`);
        setText("statFireDmg", `${Offence.FireDamageMin.toFixed()}-${Offence.FireDamageMax.toFixed()}`);
        setText("statColdDmg", `${Offence.ColdDamageMin.toFixed()}-${Offence.ColdDamageMax.toFixed()}`);
        setText("statLightDmg", `${Offence.LightDamageMin.toFixed()}-${Offence.LightDamageMax.toFixed()}`);
        setText("statAttackSpeed", Offence.AttackSpeed.toFixed(2));
        setText("statAttackRange", hero.Attack.Range.toFixed());
        setText("statAccuracy", Offence.Accuracy.toFixed());
        setText("statCritChance", `${Offence.CriticalChance.toFixed()}%`);
        setText("statCritMult", `${Offence.CriticalMultiplier.toFixed(2)}x`);
        setText("statStunInc", `${Offence.Stun.toFixed()}%`);
    }
}

export class CharacterStatsUI extends UIDialog
{
    constructor(events: EventBus, private readonly repository: GameStateRepository)
    {
        super("char");
        events.Subscribe<unknown>(GameEvents.StateChanged, () => this.Refresh());
    }

    public Open(): void
    {
        super.Open();
        this.Refresh();
    }

    private Refresh(): void
    {
        const hero = this.repository.Last()?.MyHero;
        if (!hero) return;

        const { Vitals, Attributes } = hero;
        const setText = (id: string, value: string): void => { document.getElementById(id)!.textContent = value; }

        setText("hpText", `${Vitals.LifeCurrent.toFixed()}/${Vitals.LifeMax.toFixed()}`);
        setText("statES", `${Vitals.EsCurrent.toFixed()}/${Vitals.EsMax.toFixed()}`);
        setText("statRegen", Vitals.LifePerSecond.toFixed(2));
        setText("statLifePerKill", Vitals.LifePerKill.toFixed());
        setText("statSpeed", Attributes.MovementSpeed.toFixed());
        setText("statStr", Attributes.Str.toFixed());
        setText("statDex", Attributes.Dex.toFixed());
        setText("statInt", Attributes.Int.toFixed());
    }
}

export class DefenceStatsUI extends UIDialog
{
    constructor(events: EventBus, private readonly repository: GameStateRepository)
    {
        super("def");
        events.Subscribe<unknown>(GameEvents.StateChanged, () => this.Refresh());
    }

    public Open(): void
    {
        super.Open();
        this.Refresh();
    }

    private Refresh(): void
    {
        const defence = this.repository.Last()?.MyHero?.Defence;
        if (!defence) return;

        const setText = (id: string, value: string): void => { document.getElementById(id)!.textContent = value; }
        setText("statArmor", defence.Armour.toFixed());
        setText("statPhysReduction", `${defence.PhysReduction.toFixed()}%`);
        setText("statEvasion", defence.Evasion.toFixed());
        setText("statBlock", `${defence.Block.toFixed()}%`);
        setText("statReflect", defence.PhysReflect.toFixed());
        setText("statStunReduction", `${defence.StunReduction.toFixed()}%`);
        setText("statFireRes", `${defence.FireResist.toFixed()}%`);
        setText("statColdRes", `${defence.ColdResist.toFixed()}%`);
        setText("statLightRes", `${defence.LightResist.toFixed()}%`);
    }
}

//#endregion

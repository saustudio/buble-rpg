import { BonusEffect, BonusOffer } from "../model/GameState";
import { EBonusEffectType, EBonusModifier } from "../model/Bonus";
import { BonusCardView, BonusUI } from "./BonusCore";
import { IGameService } from "../services/IGameService";
import { GameStateRepository } from "../store/GameStateRepository";
import { EventBus } from "../core/Core";
import { NavBarUI } from "./NavBar";

/** UI выбора бонуса волны. */
export class WaveBonusUI extends BonusUI
{
    private static readonly WaveEffectLabels: Partial<Record<EBonusEffectType, string>> = {
        [EBonusEffectType.MonsterCount]: "Кол-во врагов",
        [EBonusEffectType.MonsterLevel]: "Уровень монстров",
        [EBonusEffectType.MonsterHealth]: "Здоровье монстров",
        [EBonusEffectType.MonsterDamage]: "Урон монстров",
        [EBonusEffectType.MonsterSpeed]: "Скорость монстров",
        [EBonusEffectType.MonsterResist]: "Сопр. монстров",
        [EBonusEffectType.SpawnSpeed]: "Скорость спавна",
        [EBonusEffectType.EliteChance]: "Шанс элиты",
        [EBonusEffectType.ItemQuantity]: "Кол-во предметов",
        [EBonusEffectType.ItemRarity]: "Редкость предметов",
    };

    private static readonly WaveResources: Record<string, BonusCardView> = {
        horde: { Icon: "👥", Title: "Орда", Unit: "", Description: "В волне заметно больше врагов", CssClass: "dmg" },
        legion: { Icon: "👥", Title: "Легион", Unit: "", Description: "К волне добавляются новые враги", CssClass: "dmg" },
        veterans: { Icon: "⬆️", Title: "Ветераны", Unit: "", Description: "Монстры приходят более высокого уровня", CssClass: "crit" },
        toughened: { Icon: "🛡️", Title: "Закалённые", Unit: "", Description: "У монстров больше здоровья", CssClass: "def" },
        savage: { Icon: "⚔️", Title: "Свирепость", Unit: "", Description: "Монстры наносят больше урона", CssClass: "fire" },
        swift: { Icon: "💨", Title: "Стремительные", Unit: "", Description: "Монстры быстрее, а спавн чаще", CssClass: "spd" },
        surge: { Icon: "⚡", Title: "Прорыв", Unit: "", Description: "Враги появляются почти без паузы", CssClass: "spd" },
        warded: { Icon: "🔷", Title: "Защищённые", Unit: "", Description: "У монстров выше сопротивления", CssClass: "res" },
        greed: { Icon: "💰", Title: "Алчность", Unit: "", Description: "Больше врагов и больше добычи", CssClass: "light" },
        avidity: { Icon: "💎", Title: "Жадность", Unit: "", Description: "Больше и качественнее добыча", CssClass: "light" },
        elite: { Icon: "⭐", Title: "Элита", Unit: "", Description: "Выше шанс элитного монстра", CssClass: "crit" },
        cursed: { Icon: "☠️", Title: "Проклятые", Unit: "", Description: "Крепкие и стойкие монстры", CssClass: "res" },
        bloodlust: { Icon: "🩸", Title: "Кровавая жажда", Unit: "", Description: "Жестокие и частые враги", CssClass: "fire" },
    };

    constructor(
        events: EventBus,
        repository: GameStateRepository,
        gameService: IGameService,
        navBar: NavBarUI)
    {
        super("wave", events, repository, navBar, state => state.WaveBonusOffer, bonusId => gameService.ChooseWaveBonus(bonusId));
    }

    public Open(): void
    {
        this.OpenOffer();
    }

    protected GetView(bonus: BonusOffer): BonusCardView | undefined
    {
        return WaveBonusUI.WaveResources[bonus.Id] ?? {
            Icon: "❓",
            Title: bonus.Id,
            Unit: "",
            Description: "Модификатор волны",
            CssClass: "",
        };
    }

    protected RenderBody(bonus: BonusOffer): string
    {
        const effectLines = bonus.Effects.map((e) =>
        {
            const label = WaveBonusUI.WaveEffectLabels[e.Type] ?? e.Type;
            return `<div class="wave-effect"><span class="wave-effect-label">${label}</span><span class="wave-effect-value">${this.FormatEffect(e)}</span></div>`;
        }).join("");

        return `<div class="wave-effects">${effectLines}</div>`;
    }

    protected FormatEffect(e: BonusEffect): string
    {
        const sign = e.Value >= 0 ? "+" : "";
        if (e.Mod === EBonusModifier.PERCENT || e.Mod === EBonusModifier.PERCENT_POINT) return `${sign}${e.Value}%`;
        return `${sign}${e.Value}`;
    }
}


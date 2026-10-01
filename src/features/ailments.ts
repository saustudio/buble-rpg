declare const PIXI: any;
import { EntityId, Logger,  System, World } from "./core";
import { EGameState, GameStateComponent } from "./gamestate";
import { Transform2DComponent, VelocityComponent } from "./movement";
import { RigidbodyComponent } from "./physics";
import { AttackHitComponent, EAttackType } from "./attack";

//#region ФИЧА: недуги/дебафы

// export enum EAilmentType { BLOOD, BURN, FREEZE }

// export const AilmentTypeConfig = new Map<EAilmentType, any>([
//     [EAilmentType.BLOOD, { icon: "🩸", chance: 0.10, duration: 3, mult: 0.1, }],
//     [EAilmentType.BURN, { icon: "🔥", chance: 0.10, duration: 5 }],
//     [EAilmentType.FREEZE, { icon: "❄️", chance: 0.10, duration: 10, mult: 0.1 }]
// ]);


// export class BleedAilmentComponent { constructor(public Power: number, public Duration: number, public source: EntityId) { } }
// export class BleedAilmentSystem implements System
// {
//     constructor()
//     {
//         Logger.Info(BleedAilmentSystem.name, '✅ система успешно инициализирована');
//     }

//     public Update(deltaTime: number): void
//     {
//         // const gameState = World.SingleComponent(GameStateComponent)!;
//         // if (gameState.State == EGameState.PAUSE || gameState.State == EGameState.OVER) return;

//         // const config = AilmentTypeConfig.get(EAilmentType.BLOOD)!;

//         // //эффекты недуга
//         // const ailmentEntityList = World.EntityQuery(BleedAilmentComponent, VelocityComponent);
//         // for (const ailmentEntity of ailmentEntityList)
//         // {
//         //     const ailment = World.GetComponent(ailmentEntity, BleedAilmentComponent)!;
//         //     const velocity = World.GetComponent(ailmentEntity, VelocityComponent)!;
//         //     const speedMult = velocity.DirX == 0 && velocity.DirY == 0 ? 1 : 1 + velocity.Speed * 0.1; //чем выше скорость , тем выше кровотечение
//         //     const damageAmount = ailment.Power * deltaTime * speedMult;

//         //     let damage = World.GetComponent(ailmentEntity, DamageComponent);
//         //     if (!damage) { damage = new DamageComponent(); World.SetComponent(ailmentEntity, damage); }
//         //     damage.Add(ailment.source, EDamageType.BLEED, damageAmount);
//         //     ailment.Duration -= deltaTime;
//         //     if (ailment.Duration <= 0) World.RemoveComponent(ailmentEntity, BleedAilmentComponent);
//         // }

//         // //наложение недуга
//         // const entityList = World.EntityQuery(DamageComponent).filter(entity => !World.HasComponent(entity, BleedAilmentComponent));
//         // for (const entity of entityList)
//         // {
//         //     const damage = World.GetComponent(entity, DamageComponent)!;
//         //     const phys = damage.TotalBy(EDamageType.PHYSICAL);

//         //     if (phys.Total == 0) continue;
//         //     if (Math.random() >= config.chance) continue;

//         //     const power = phys.Total * config.mult;
//         //     World.SetComponent(entity, new BleedAilmentComponent(power, config.duration, phys.MaxSource));
//         // }
//     }
// }

// export class SpeedAilmentComponent { constructor(public Power: number, public Duration: number) { } }
// export class SpeedAilmentSystem implements System
// {
//     constructor()
//     {
//         Logger.Info(SpeedAilmentSystem.name, '✅ система успешно инициализирована');
//     }

//     public Update(deltaTime: number): void
//     {
//         const gameState = World.SingleComponent(GameStateComponent)!;
//         if (gameState.State == EGameState.PAUSE || gameState.State == EGameState.OVER) return;

//         const config = AilmentTypeConfig.get(EAilmentType.FREEZE)!;

//         //эффекты недуга
//         const ailmentEntityList = World.EntityQuery(SpeedAilmentComponent);
//         for (const ailmentEntity of ailmentEntityList)
//         {
//             const ailment = World.GetComponent(ailmentEntity, SpeedAilmentComponent)!;

//             const velocity = World.GetComponent(ailmentEntity, VelocityComponent)!;
//             //TODO влияние дебафа на скорость , продумать
//             //if (velocity) velocity.AddSpeedMod(config.mult * ailment.Power);

//             ailment.Duration -= deltaTime;
//             if (ailment.Duration <= 0) 
//             {
//                 ailment.Power--;
//                 ailment.Duration = config.duration;
//                 if (ailment.Power == 0) World.RemoveComponent(ailmentEntity, SpeedAilmentComponent);
//             }
//         }

//         //наложение недуга
//         const entityList = World.EntityQuery(AttackHitComponent, VelocityComponent);
//         for (const entity of entityList)
//         {
//             const damage = World.GetComponent(entity, AttackHitComponent)!;
//             const cold = damage.TotalBy(EAttackType.COLD);

//             if (cold.Total == 0) continue;
//             if (Math.random() >= config.chance) continue;


//             const power = cold.Total * config.mult;
//             let ailment = World.GetComponent(entity, SpeedAilmentComponent);
//             if (ailment == null)
//             {
//                 ailment = new SpeedAilmentComponent(power, config)
//                 World.SetComponent(entity, new SpeedAilmentComponent(power, config.duration));
//                 continue;
//             }

//             ailment.Power++;
//         }
//     }
// }

// class BurnAilmentComponent { constructor(public Power: number, public Duration: number) { } }

// class BurnAilmentSystem implements System
// {
//     constructor()
//     {
//         Logger.Info(BurnAilmentSystem.name, '✅ система успешно инициализирована');
//     }

//     public Update(deltaTime: number): void
//     {
//         const gameState = World.GetSingleComponent(GameStateComponent)!;
//         if (gameState.State == EGameState.PAUSE || gameState.State == EGameState.OVER) return;
//     }


//     // ============ РАСПРОСТРАНЕНИЕ ПОДЖОГА ============

//     private SpreadEffect(deltaTime: number): void
//     {
//         const config = DebuffTypeConfig.get(EDebuffType.BURN)!;

//         const allBurnEntities = World.EntityQuery(DebuffBurnComponent);
//         const allEntities = World.EntityQuery(Transform2DComponent, BodyComponent);


//         for (const sourceEntity of allBurnEntities)
//         {

//             const sourceBurn = World.GetComponent(sourceEntity, DebuffBurnComponent);
//             if (!sourceBurn) continue;

//             // Если счетчик распространений = 0 - не распространяем
//             if (sourceBurn.SpreadCount <= 0) continue;

//             const sourcePos = World.GetComponent(sourceEntity, Transform2DComponent);
//             const sourceBody = World.GetComponent(sourceEntity, BodyComponent);

//             if (!sourcePos || !sourceBody) continue;

//             const sourceHealth = World.GetComponent(sourceEntity, HealthComponent);
//             if (!sourceHealth || sourceHealth.Value <= 0) continue;

//             for (const targetEntity of allEntities)
//             {
//                 if (targetEntity === sourceEntity) continue;

//                 //распространение не срабатывает на игрока
//                 const isTargetUser = World.HasComponent(targetEntity, UserTag);
//                 if (isTargetUser) continue;

//                 const targetPos = World.GetComponent(targetEntity, Transform2DComponent);
//                 const targetBody = World.GetComponent(targetEntity, BodyComponent);

//                 if (!targetPos || !targetBody) continue;

//                 const dx = targetPos.X - sourcePos.X;
//                 const dy = targetPos.Y - sourcePos.Y;
//                 const dist = Math.hypot(dx, dy);
//                 const maxDist = config.radius + sourceBody.Size + targetBody.Size;

//                 if (dist > maxDist) continue;

//                 // Проверяем, горит ли цель
//                 const targetBurn = World.GetComponent(targetEntity, DebuffBurnComponent);
//                 if (targetBurn) continue;

//                 if (Math.random() >= config.chance) continue;

//                 // Новый поджог получает счетчик на 1 меньше
//                 World.ComponentCreate(targetEntity, new DebuffBurnComponent(sourceBurn.Value, config.duration, sourceBurn.SpreadCount - 1));
//                 // Уменьшаем счетчик у источника
//                 sourceBurn.SpreadCount--;
//                 // Если источник больше не может распространять - выходим из цикла
//                 if (sourceBurn.SpreadCount <= 0) break;
//             }
//         }
//     }

// }

// export class AilmentRenderer extends Renderer
// {
//     constructor()
//     {
//         super();
//         Logger.Info(AilmentRenderer.name, '✅ рендер успешно инициализирован');
//     }

//     public Render(deltaTime: number): void
//     {
//         // Получаем все сущности с компонентами позиции и тела
//         const entities = World.EntityQuery(Transform2DComponent, RigidbodyComponent);

//         for (const entity of entities)
//         {
//             const pos = World.GetComponent(entity, Transform2DComponent)!;
//             const body = World.GetComponent(entity, RigidbodyComponent)!;

//             // Формируем строку из иконок дебафов
//             let debuffText = "";

//             // Кровотечение
//             const blood = World.GetComponent(entity, BleedAilmentComponent);
//             if (blood) debuffText += AilmentTypeConfig.get(EAilmentType.BLOOD)!.icon;

//             // Поджог
//             //const burn = World.GetComponent(entity, BurnAilmentComponent);
//             //if (burn) debuffText += AilmentTypeConfig.get(EAilmentType.BURN)!.icon;

//             // Охлаждение
//             const freeze = World.GetComponent(entity, SpeedAilmentComponent);
//             if (freeze) debuffText += AilmentTypeConfig.get(EAilmentType.FREEZE)!.icon;

//             // Рендерим эффекты (свечение, капли и т.д.)
//             //if (blood) this.RenderBloodEffect(pos.X, pos.Y, body.Size, blood);
//             //if (burn) this.RenderBurnEffect(pos.X, pos.Y, body.Size, burn);
//             //if (freeze) this.RenderFreezeEffect(pos.X, pos.Y, body.Size);

//             // Рендерим текст с иконками (как в HealthRenderer)
//             if (debuffText.length > 0)
//             {
//                 const style = new PIXI.TextStyle({
//                     fontFamily: 'Segoe UI, sans-serif',
//                     fontSize: 12,
//                     fill: 0xffffff,
//                     stroke: '#000000',
//                     strokeThickness: 3,
//                     align: 'center'
//                 });

//                 const debuffLabel = new PIXI.Text(debuffText, style);
//                 debuffLabel.anchor.set(0.5, 0.5);
//                 debuffLabel.position.set(pos.X, pos.Y - body.Size - 30);
//                 this.context.TextLayer.addChild(debuffLabel);
//             }
//         }
//     }

//     private RenderBloodEffect(x: number, y: number, radius: number, debuff: BleedAilmentComponent): void
//     {
//         const intensity = Math.min(1, 1 / 3);

//         this.context.GraphicsLayer.beginFill(0xcc2233, 0.08 * intensity);
//         this.context.GraphicsLayer.drawCircle(x, y, radius * (1.2 + 0.1 * Math.sin(Date.now() / 500)));
//         this.context.GraphicsLayer.endFill();

//         const numDrops = 5;
//         for (let i = 0; i < numDrops; i++)
//         {
//             const angle = Date.now() / (600 + i * 100) + i * Math.PI * 2 / numDrops;
//             const dist = radius * (0.8 + 0.4 * Math.sin(Date.now() / 500 + i * 0.5) + 0.2 * intensity);
//             const dx = Math.cos(angle) * dist;
//             const dy = Math.sin(angle) * dist;

//             const dropSize = 1.5 + Math.sin(Date.now() / 300 + i * 1.2) * 0.8;
//             const alpha = 0.2 + Math.sin(Date.now() / 400 + i) * 0.15;

//             this.context.GraphicsLayer.beginFill(0xcc2233, alpha * intensity);
//             this.context.GraphicsLayer.drawCircle(x + dx, y + dy, dropSize);
//             this.context.GraphicsLayer.endFill();
//         }
//     }

//     // private RenderBurnEffect(x: number, y: number, radius: number, debuff: DebuffBurnComponent): void
//     // {
//     //     const intensity = Math.min(1, 1 / 3);

//     //     this.context.GraphicsLayer.beginFill(0xff4400, 0.1 * intensity);
//     //     this.context.GraphicsLayer.drawCircle(x, y, radius * (1.3 + 0.15 * Math.sin(Date.now() / 400)));
//     //     this.context.GraphicsLayer.endFill();

//     //     this.context.GraphicsLayer.beginFill(0xff8800, 0.06 * intensity);
//     //     this.context.GraphicsLayer.drawCircle(x, y, radius * (1.5 + 0.2 * Math.sin(Date.now() / 350)));
//     //     this.context.GraphicsLayer.endFill();

//     //     const numSparks = 7;
//     //     for (let i = 0; i < numSparks; i++)
//     //     {
//     //         const angle = Date.now() / (300 + i * 80) + i * Math.PI * 2 / numSparks;
//     //         const dist = radius * (0.7 + 0.5 * Math.sin(Date.now() / 250 + i * 0.7) + 0.2 * intensity);
//     //         const dx = Math.cos(angle) * dist;
//     //         const dy = Math.sin(angle) * dist;

//     //         const sparkSize = 1 + Math.sin(Date.now() / 200 + i * 1.5) * 0.5;
//     //         const alpha = 0.3 + Math.sin(Date.now() / 300 + i * 1.2) * 0.2;

//     //         const colors = [0xff4400, 0xff8800, 0xffcc00];
//     //         const color = colors[i % colors.length];

//     //         this.context.GraphicsLayer.beginFill(color, alpha * intensity);
//     //         this.context.GraphicsLayer.drawCircle(x + dx, y + dy, sparkSize);
//     //         this.context.GraphicsLayer.endFill();
//     //     }
//     // }

//     private RenderFreezeEffect(x: number, y: number, radius: number): void
//     {
//         const time = Date.now() / 1000;
//         const intensity = 1;
//         const graphics = this.context.GraphicsLayer;


//         // Сосульки - вращаются и пульсируют
//         const numIcicles = 12 + Math.floor(radius / 1);
//         const rotationOffset = time * 0.3;

//         for (let i = 0; i < numIcicles; i++)
//         {
//             const baseAngle = (i / numIcicles) * Math.PI * 2;
//             const angle = baseAngle + rotationOffset + Math.sin(time * 0.5 + i * 0.7) * 0.1;

//             const lengthVariation = 0.6 + 0.4 * Math.sin(time * 1.2 + i * 1.1);
//             const length = radius / 2 * (0.8 + 0.7 * lengthVariation);

//             const baseWidth = radius * (0.08 + 0.04 * Math.sin(time * 1.5 + i * 0.9));

//             const startX = x + Math.cos(angle) * radius * 0.7;
//             const startY = y + Math.sin(angle) * radius * 0.7;
//             const endX = startX + Math.cos(angle) * length;
//             const endY = startY + Math.sin(angle) * length;

//             const perpAngle = angle + Math.PI / 2;

//             const bx1 = startX + Math.cos(perpAngle) * baseWidth;
//             const by1 = startY + Math.sin(perpAngle) * baseWidth;
//             const bx2 = startX - Math.cos(perpAngle) * baseWidth;
//             const by2 = startY - Math.sin(perpAngle) * baseWidth;
//             const tx = endX + Math.cos(angle) * 2;
//             const ty = endY + Math.sin(angle) * 2;

//             graphics.beginFill(0x88ddff, 0.7);
//             graphics.moveTo(bx1, by1);
//             graphics.lineTo(tx, ty);
//             graphics.lineTo(bx2, by2);
//             graphics.closePath();
//             graphics.endFill();

//             // Блик
//             const highlightOffset = baseWidth * 0.3;
//             const hx1 = startX + Math.cos(perpAngle) * highlightOffset;
//             const hy1 = startY + Math.sin(perpAngle) * highlightOffset;
//             const hx2 = startX + Math.cos(perpAngle) * (highlightOffset + baseWidth * 0.2);
//             const hy2 = startY + Math.sin(perpAngle) * (highlightOffset + baseWidth * 0.2);
//             const hMidX = (hx1 + hx2) / 2 + Math.cos(angle) * length * 0.5;
//             const hMidY = (hy1 + hy2) / 2 + Math.sin(angle) * length * 0.5;

//             graphics.lineStyle(2, 0xccf0ff, 0.4);
//             graphics.moveTo(hx1, hy1);
//             graphics.lineTo(hMidX, hMidY);
//             graphics.lineTo(hx2, hy2);

//             graphics.lineStyle(1.5, 0x66ccff, 0.3);
//             graphics.moveTo(bx1, by1);
//             graphics.lineTo(tx, ty);
//             graphics.lineTo(bx2, by2);
//             graphics.closePath();

//             // Капелька
//             if (i % 3 === 0)
//             {
//                 const dropSize = 2 + Math.sin(time * 2 + i * 0.5) * 0.5;
//                 const dropAlpha = 0.3 + Math.sin(time * 1.5 + i) * 0.2;
//                 graphics.beginFill(0xccf0ff, dropAlpha);
//                 graphics.drawCircle(tx + Math.cos(angle) * 3, ty + Math.sin(angle) * 3, dropSize);
//                 graphics.endFill();
//             }
//         }

//         // // Мелкие сосульки
//         // const numSmallIcicles = 8;
//         // for (let i = 0; i < numSmallIcicles; i++)
//         // {
//         //     const angle = (i / numSmallIcicles) * Math.PI * 2 + time * 0.4 + 0.3;
//         //     const length = radius * (0.3 + 0.2 * Math.sin(time * 1.8 + i * 0.6));
//         //     const startX = x + Math.cos(angle) * radius * 0.5;
//         //     const startY = y + Math.sin(angle) * radius * 0.5;
//         //     const endX = startX + Math.cos(angle) * length;
//         //     const endY = startY + Math.sin(angle) * length;

//         //     graphics.lineStyle(2, 0x88ddff, 0.3);
//         //     graphics.moveTo(startX, startY);
//         //     graphics.lineTo(endX, endY);

//         //     const perpAngle = angle + Math.PI / 2;
//         //     const tipSize = 2;
//         //     graphics.moveTo(endX, endY);
//         //     graphics.lineTo(endX + Math.cos(perpAngle) * tipSize, endY + Math.sin(perpAngle) * tipSize);
//         //     graphics.moveTo(endX, endY);
//         //     graphics.lineTo(endX - Math.cos(perpAngle) * tipSize, endY - Math.sin(perpAngle) * tipSize);
//         // }
//     }

// }
//#endregion

export function RegisterAilmentModule(): void
{
    // World.SystemCreate(new BleedAilmentSystem());
    // World.SystemCreate(new SpeedAilmentSystem());
    // new AilmentRenderer();
}

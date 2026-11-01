import { LootDrop, LootMessage } from "../model/network/LootMessage";

/**
 * Клиентское зеркало серверной добычи. Сервер — единственный источник истины, поэтому каждое
 * сообщение перезаписывает состояние целиком; оптимистичных правок и `pending` здесь нет.
 * `Version` растёт на каждую замену, чтобы UI отличал «данные новые» от «те же».
 */
export class LootRepository
{
    private message: LootMessage = { Drops: [] };
    private version = 0;

    public get Version(): number
    {
        return this.version;
    }

    public get Drops(): readonly LootDrop[]
    {
        return this.message.Drops;
    }

    /** Полная перезапись по очередному сообщению сервера. */
    public Replace(message: LootMessage): void
    {
        this.message = message;
        this.version++;
    }

    /** Сброс при потере героя: лут теряется со смертью или респавном. */
    public Clear(): void
    {
        this.message = { Drops: [] };
        this.version++;
    }
}

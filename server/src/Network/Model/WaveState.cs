namespace BubleRpg.Network.Model;

public sealed record WaveState(
    int Lvl,
    double SpawnMax,
    double Spawned,
    double PrepareTimer);

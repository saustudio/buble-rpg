using BubleRpg.Server.Application.Extensions;
using BubleRpg.Server.Network.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins", policy =>
        policy.AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services.AddGameServer();

var app = builder.Build();

app.UseCors("AllowAllOrigins");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => "BubleRpg server");
app.MapGameNetwork();

app.Run();

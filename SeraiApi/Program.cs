using OpenAI.Chat;
using SeraiApi;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Rate limiter: 10 requests per minute per IP address
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("ChatLimit", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));
    options.RejectionStatusCode = 429;
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReactApp");
app.UseRateLimiter();

app.MapPost("/chat", async (ChatRequest request) =>
{
    try
    {
        var apiKey = builder.Configuration["OpenAI:ApiKey"]!;
        var client = new ChatClient("gpt-4o-mini", apiKey);

        var messages = new List<ChatMessage>
        {
            new SystemChatMessage(SeraiSystemPrompt.Prompt)
        };

        foreach (var msg in request.Messages)
        {
            if (msg.Role == "user")
                messages.Add(new UserChatMessage(msg.Content));
            else if (msg.Role == "assistant")
                messages.Add(new AssistantChatMessage(msg.Content));
        }

        var completion = await client.CompleteChatAsync(messages);
        var reply = completion.Value.Content[0].Text;
        return Results.Ok(new { reply });
    }
    catch (Exception)
    {
        return Results.Json(
            new { error = "Unable to process your request. Please try again." },
            statusCode: 500);
    }
})
.RequireRateLimiting("ChatLimit")
.WithName("Chat")
.WithOpenApi();

app.Run();

record ChatRequest(List<Message> Messages);
record Message(string Role, string Content);
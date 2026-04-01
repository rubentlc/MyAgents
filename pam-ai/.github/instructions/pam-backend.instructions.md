---
applyTo: "**/*"
description: "Use when implementing, debugging, or analysing code in pam-backend (.NET 10 microservices, HotChocolate GraphQL, gRPC, Dynamics 365)."
---

# PAM Backend Execution Rules

## Architecture at a Glance
- **Runtime**: .NET 10 / ASP.NET
- **API layer**: HotChocolate 12 GraphQL on each service; PAM.Gateway stitches all schemas
- **Internal comms**: gRPC (HTTP/2) — all API services → PAM.API.Integration.Shared
- **Async events**: Apache Kafka → PAM.Notification (email worker)
- **Cache / SignalR backplane**: Redis (StackExchange.Redis)
- **Persistence**: Dynamics 365 CRM (OData v9.2) as primary store; MongoDB for comments/reports; no relational DB
- **Auth**: Kerberos/Negotiate at Gateway only; downstream services trust forwarded headers; Dynamics uses OAuth2 client credentials

## Services Quick Reference

| Service | Port responsibility | Key tech |
|---|---|---|
| `PAM.Gateway` | Public GraphQL + SignalR | HotChocolate.Stitching, Negotiate auth, Redis |
| `PAM.API.Project` | Projects, activities, team, financials, events | HotChocolate, MediatR, gRPC client |
| `PAM.API.Program` | Programs, delegations, outcomes | HotChocolate, MediatR, gRPC client |
| `PAM.API.Community` | Communities, admin levels, places | HotChocolate, MediatR, gRPC client |
| `PAM.API.Comment` | Comments, communications | HotChocolate, MediatR, MongoDB |
| `PAM.API.Indicator` | Ad-hoc & standard indicators | HotChocolate, MediatR, gRPC client |
| `PAM.API.Reporting` | QSR reports, Word/PDF export | HotChocolate, MediatR, GemBox.Document |
| `PAM.API.Project-IO` | Inputs, outputs, supply requests, payments | HotChocolate, MediatR, gRPC client |
| `PAM.API.Integration.Shared` | gRPC server — Dynamics, JDE, RADAR, PMT | Grpc.AspNetCore, OData, AutoMapper |
| `PAM.Notification` | Kafka consumer → email | Worker service, SMTP, circuit breaker |

## Coding Patterns

### CQRS / MediatR
Every GraphQL resolver delegates to a MediatR `ISender`. Keep resolvers thin:
```csharp
[ExtendObjectType("Query")]
public class ProjectQueryController
{
    public async Task<PaginatedCollection<ProjectDto>> GetProjects(
        GetProjectsInput input, [Service] ISender sender, CancellationToken ct)
        => await sender.Send(new GetProjectsQuery(input), ct);
}
```

### GraphQL Schema Extension
Use `[ExtendObjectType("Query")]` / `[ExtendObjectType("Mutation")]` — never create standalone `QueryType` / `MutationType` classes.

### gRPC — Proto-first
- All `.proto` files live in `src/Protos/`
- `GRPC.Shared` generates stubs (client + server)
- Do **not** hand-edit generated files — modify the `.proto` and regenerate
- `ConditionalFilter.proto` and `PaginatedCollection.proto` are data-only (`option GrpcServices = "None"`)

### Integration with External Systems
- All calls to Dynamics 365, JDE, RADAR, PMT, MDM, IRIS, Univer go through `PAM.API.Integration.Shared` via gRPC
- Never call external systems directly from an API service
- `PAM.Services.Shared` contains all partial-class Dynamics client implementations (split by domain)

### Domain Models
- `PAM.Domain` — pure model library, no DI, no persistence
- Always prefer `PAM.Domain` types for cross-service contracts
- Use `PaginatedCollection<T>` for all paginated responses

## Change Strategy
- **Minimal surface area**: touch only the files needed for the change
- **Proto changes**: update `.proto` → rebuild `GRPC.Shared` → update both server (Integration.Shared) and all client call-sites
- **Gateway stitching**: after adding a resolver in a downstream service, update `PAM.Gateway/Stitching.graphql` if cross-service delegation is needed
- **appsettings secrets**: leave blank in `appsettings.json`; secrets are injected at runtime — never commit real values

## Validation
After changes, run:
```bash
dotnet build
dotnet test
```
If skipping tests, state why explicitly.

## Security Rules
- Never log secrets, tokens, or PII
- Dynamics credentials (ClientId/ClientSecret) only in environment/secrets — never in source
- Auth decisions live in `PAM.Gateway` — do not re-implement auth in downstream services
- Validate all external inputs at the Gateway boundary; downstream services may trust them

## Repository Separation
- Keep Copilot/MCP assets in `pam-ai`
- `pam-backend` remains focused on application code only

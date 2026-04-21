# Go Architectural Patterns

Guías para el desarrollo robusto en Go.

## 1. Clean Architecture (Estructura Sugerida)
```text
internal/
  domain/         # Entidades puras e interfaces de repositorio
    user.go       # type User struct { ... }
    user_repo.go  # type UserRepository interface { ... }
  usecase/        # Casos de uso (Lógica de negocio)
    user_service.go # Implementa la lógica usando las interfaces
  infra/          # Detalles de implementación
    repository/   # Implementación SQL/Mongo/etc.
    handler/      # HTTP/gRPC handlers
```

## 2. Table-Driven Tests (Testing)
Usa este patrón para asegurar cobertura exhaustiva.
```go
func TestSum(t *testing.T) {
    tests := []struct {
        name string
        a, b int
        want int
    }{
        {"positive", 1, 2, 3},
        {"negative", -1, -1, -2},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            if got := Sum(tt.a, tt.b); got != tt.want {
                t.Errorf("Sum() = %v, want %v", got, tt.want)
            }
        })
    }
}
```

## 3. Manejo de Errores con Contexto
```go
if err != nil {
    return fmt.Errorf("failed to process order %s: %w", orderID, err)
}
```

## 4. Inyección de Dependencias
```go
type Service struct {
    repo Repository
}

func NewService(r Repository) *Service {
    return &Service{repo: r}
}
```

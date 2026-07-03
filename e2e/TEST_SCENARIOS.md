# Escenarios de Prueba E2E - ReservaloYa

Este documento detalla los casos de prueba implementados para la plataforma ReservaloYa, enfocándose en los flujos de cliente y administrador.

## 1. Flujo de Cliente

### 1.1 Búsqueda y Filtros
- **CP-001: Filtrar por Ciudad**
    - **Entrada:** Seleccionar una ciudad en el filtro.
    - **Esperado:** La lista de centros deportivos se actualiza mostrando solo los de esa ciudad.
- **CP-002: Búsqueda por Nombre**
    - **Entrada:** Escribir "Union" en el buscador.
    - **Esperado:** Aparece al menos el centro "Union" en los resultados.

### 1.2 Modalidades de Pago (Reserva)
- **CP-003: Pago Total (100%)**
    - **Entrada:** Seleccionar bloque -> "Reservar" -> Método: MercadoPago -> Confirmar.
    - **Esperado:** Redirección a pasarela de pago / Página de éxito con estado "Pagado".
- **CP-004: Pago Parcial (Abono)**
    - **Entrada:** Activar toggle "Pagar solo el abono" -> MercadoPago -> Confirmar.
    - **Esperado:** Pago del porcentaje configurado -> Página de éxito con estado "Parcial".
- **CP-005: Pago Opcional (Confirmar sin pagar)**
    - **Entrada:** Seleccionar bloque con pago opcional -> Botón "Confirmar sin pagar".
    - **Esperado:** Reserva confirmada -> Estado "Pendiente" (Pagar en local).

## 2. Panel de Administrador

### 2.1 Configuración de Pagos
- **CP-006: Habilitar Pago Parcial Global**
    - **Entrada:** Admin Settings -> Toggle "Pago Parcial" -> Definir 25% -> Guardar.
    - **Esperado:** El modal de reserva del cliente ahora muestra la opción de abono del 25%.
- **CP-007: Reglas de Bloque Específico**
    - **Entrada:** Calendario Admin -> Seleccionar bloque -> Configurar como "Pago Obligatorio".
    - **Esperado:** El cliente no puede reservar ese bloque sin realizar un pago online.

### 2.2 Gestión de Reservas
- **CP-008: Reserva Interna**
    - **Entrada:** Calendario Admin -> Clic en bloque vacío -> Crear reserva manual.
    - **Esperado:** El bloque aparece como ocupado en la vista pública.

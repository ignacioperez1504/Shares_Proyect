# Shares_Proyect

## Descripción del proyecto

`Shares_Proyect` es una aplicación web de simulación de portafolio de inversión, enfocada en renta variable y renta fija. La interfaz presenta un dashboard interactivo con gráficos, tablas de activos, órdenes y datos de mercado reales usando `yfinance`.

## Características principales

- Panel principal con resumen de capital y rentabilidad.
- Tabla de activos del portafolio y distribución por tipo.
- Gráfico interactivo en la sección de Renta Variable con:
  - selector dinámico de ticker
  - filtros por rango temporal (`Último mes`, `Último año`)
  - tooltip con fecha y precio al pasar el cursor
- Actualización de precios reales desde `yfinance`.
- Simulación de compra/venta de activos con cálculo de capital y transacciones.
- Diseño visual estilo broker / TradingView con tema oscuro y controles modernos.

## Estructura del proyecto

- `main.py` - servidor Flask y endpoints API.
- `templates/index.html` - plantilla HTML de la interfaz.
- `static/script.js` - lógica de UI, gráficos y llamadas al backend.
- `static/styles.css` - temas y estilos visuales.
- `models/` - modelos del dominio financiero (`accion.py`, `activo.py`, `bono_cdt.py`, `broker.py`, `historial.py`, `portafolio.py`, `transaccion.py`).

## Requisitos

- Python 3.10+.
- Flask.
- yfinance.
- Chart.js (cargado desde CDN en `index.html`).

## Instalación y ejecución

1. Crear un entorno virtual:

```bash
python -m venv venv
```

2. Activar el entorno:

```powershell
venv\Scripts\Activate.ps1
```

3. Instalar dependencias:

```bash
pip install flask yfinance
```

4. Ejecutar la aplicación:

```bash
python main.py
```

5. Abrir el navegador en:

```text
http://127.0.0.1:5000
```

## Cómo usar

- Navega a la sección `Renta Variable` en la barra lateral.
- Selecciona un ticker en el menú desplegable.
- Usa los botones de periodo para ver `Último mes` o `Último año`.
- El gráfico se actualiza automáticamente con datos reales.
- El tooltip muestra fecha y precio del cierre al pasar el cursor.

## Notas adicionales

- El eje Y del gráfico de renta variable ahora es estático para mantener una escala fija.
- La sección de precios `Renta Variable` conserva el selector de acciones y los filtros de rango temporal.
- Siempre se recomienda usar una conexión activa para que `yfinance` entregue los datos más recientes.

## Mejoras futuras

- Añadir entrada para tickers personalizados.
- Soporte para rangos adicionales como `3M`, `6M` y `2A`.
- Más indicadores técnicos, como medias móviles y volumen.
- Mejorar la gestión de errores de la API para tickers inválidos.

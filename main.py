from flask import Flask, jsonify, render_template, request
import yfinance as yf
from datetime import datetime, timedelta
from models.portafolio import Portafolio
from models.accion import Accion
from models.broker import Broker

app = Flask(__name__)

broker = Broker(comision=0.003)
portafolio = Portafolio(capital=100000, broker=broker)

ACCIONES_DISPONIBLES = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "JPM", "ECO.CL", "PFBCOL.CL"]

# No precargar acciones, solo disponibles para comprar
# portafolio.activos.extend([accion1, accion2])

capital_inicial = 100000


@app.route("/")
def home():
    return render_template("index.html")    


@app.route("/resumen")
def resumen():
    return jsonify(portafolio.resumen(capital_inicial))


@app.route("/activos")
def activos():
    activos = []
    for a in portafolio.activos:
        activos.append({
            "ticker": a.ticker,
            "name": a.ticker,
            "type": "variable",
            "price": a.valor_actual,
            "qty": a.cantidad,
            "costBase": a.precio_compra,
            "currency": "USD",
            "fecha_compra": getattr(a, 'fecha_compra', None)  # 👈 AGREGAR ESTO
        })
    return jsonify(activos)


@app.route("/comprar", methods=["POST"])
def comprar():
    data = request.json
    ticker = data["ticker"]
    cantidad = int(data["cantidad"])
    fecha_compra = data.get("fecha_compra", None)
    
    if fecha_compra:
        hist = yf.Ticker(ticker).history(start=fecha_compra, period="5d")
        if hist.empty:
            return jsonify({"success": False, "message": "Sin datos para esa fecha"}), 400
        precio = round(float(hist['Close'].iloc[0]), 2)
    else:
        precio = float(data["precio"])
    
    accion = Accion(
        ticker=ticker,
        cantidad=0,
        precio_compra=precio,
        valor_actual=precio
    )
    accion.fecha_compra = fecha_compra or datetime.today().strftime("%Y-%m-%d")
    
    exito = portafolio.comprar_activo(accion, cantidad)
    
    if exito:
        return jsonify({"success": True, "message": f"Compra realizada a ${precio}", "precio": precio})
    else:
        return jsonify({"success": False, "message": "Capital insuficiente"}), 400


@app.route("/vender", methods=["POST"])
def vender():
    data = request.get_json()

    ticker = data["ticker"]
    cantidad = int(data["cantidad"])
    precio = float(data["precio"])

    print("Ticker recibido:", ticker)
    print("Cantidad:", cantidad)

    activo = next((a for a in portafolio.activos if a.ticker == ticker), None)

    if activo:
        activo.valor_actual = precio
        exito = portafolio.vender_activo(activo, cantidad)

        if exito:
            return jsonify({
                "success": True,
                "message": f"Venta ejecutada: {cantidad} de {ticker}"
            })

    return jsonify({
        "success": False,
        "message": "No fue posible vender el activo"
    })

@app.route("/historial")
def historial():
    return jsonify([
        {
            "date": t.fecha.strftime("%Y-%m-%d %H:%M:%S"),
            "asset": t.activo,
            "op": t.tipo,
            "qty": t.cantidad,
            "price": t.precio,
            "commission": t.comision
        }
        for t in portafolio.transacciones
    ])

@app.route("/precios")
def precios():
    resultado = {}
    for activo in portafolio.activos:
        try:
            data = yf.Ticker(activo.ticker)
            hist = data.history(period="1d")
            if not hist.empty:
                precio = round(float(hist['Close'].iloc[-1]), 2)
                resultado[activo.ticker] = precio
                activo.valor_actual = precio
        except:
            resultado[activo.ticker] = activo.valor_actual
    return jsonify(resultado)

@app.route("/historico")
def historico():
    ticker = request.args.get("ticker")
    fecha = request.args.get("fecha")  # formato YYYY-MM-DD
    
    if not ticker or not fecha:
        return jsonify({"error": "Falta ticker o fecha"}), 400
    
    try:
        fecha_inicio = datetime.strptime(fecha, "%Y-%m-%d")
        hoy = datetime.today()
        
        # Si la fecha es futura, ajustamos a ayer
        ayer = hoy - timedelta(days=1)
        if fecha_inicio > ayer:
            fecha_inicio = ayer
        
        data = yf.Ticker(ticker)
        # Obtener datos EXACTAMENTE desde la fecha de compra hasta ayer
        hist = data.history(
            start=fecha_inicio.strftime("%Y-%m-%d"),
            end=ayer.strftime("%Y-%m-%d")
        )
        
        if hist.empty:
            return jsonify({"error": f"Sin datos para {ticker} desde {fecha}"}), 404
        
        precio_compra = round(float(hist['Close'].iloc[0]), 2)
        
        trayectoria = [
            {
                "fecha": str(idx.date()),
                "precio": round(float(row['Close']), 2),
                "pct": round(((float(row['Close']) - precio_compra) / precio_compra) * 100, 2)
            }
            for idx, row in hist.iterrows()
        ]
        
        return jsonify({
            "ticker": ticker,
            "precio_compra": precio_compra,
            "precio_actual": trayectoria[-1]["precio"],
            "pct_total": trayectoria[-1]["pct"],
            "trayectoria": trayectoria
        })
    
    except Exception as e:
        print(f"Error en /historico: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/trayectoria-portafolio")
def trayectoria_portafolio():
    if not portafolio.activos:
        return jsonify([])
    
    fechas_compra = [
        getattr(a, 'fecha_compra', datetime.today().strftime("%Y-%m-%d"))
        for a in portafolio.activos
    ]
    fecha_inicio = min(fechas_compra)
    hoy = datetime.today().strftime("%Y-%m-%d")
    
    historicos = {}
    for activo in portafolio.activos:
        hist = yf.Ticker(activo.ticker).history(start=fecha_inicio, end=hoy)
        historicos[activo.ticker] = {
            str(idx.date()): round(float(row['Close']), 2)
            for idx, row in hist.iterrows()
        }
    
    all_dates = sorted(set(
        fecha for ticker_hist in historicos.values()
        for fecha in ticker_hist.keys()
    ))
    
    resultado = []
    for fecha in all_dates:
        valor_total = portafolio.capital
        for activo in portafolio.activos:
            precio_dia = historicos.get(activo.ticker, {}).get(fecha, activo.valor_actual)
            valor_total += precio_dia * activo.cantidad
        resultado.append({"fecha": fecha, "valor": round(valor_total, 2)})
    
    return jsonify(resultado)

if __name__ == "__main__":
    app.run(debug=True)
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

@app.route("/equity-data")
def equity_data():
    ticker = request.args.get("ticker", "AAPL").upper()
    range_key = request.args.get("range", "1M")
    if range_key == "1A":
        period = "1y"
        interval = "1mo"
    else:
        period = "1mo"
        interval = "1d"

    try:
        data = yf.Ticker(ticker).history(period=period, interval=interval, auto_adjust=True)
        if data.empty:
            return jsonify({"error": "No se encontró información para el ticker especificado."}), 400

        labels = [index.strftime("%d %b %Y") for index in data.index]
        values = [round(float(value), 2) for value in data["Close"]]

        return jsonify({
            "ticker": ticker,
            "range": range_key,
            "labels": labels,
            "values": values,
        })
    except Exception as error:
        return jsonify({"error": str(error)}), 400

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

@app.route("/rentabilidad")
def rentabilidad():
    ticker = request.args.get("ticker", "portfolio")
    periodo = request.args.get("periodo", "meses")
    
    hoy = datetime.today()
    
    if periodo == "dias":
        fecha_inicio = (hoy - timedelta(days=30)).strftime("%Y-%m-%d")
    elif periodo == "anios":
        fecha_inicio = (hoy - timedelta(days=365*3)).strftime("%Y-%m-%d")
    else:
        fecha_inicio = (hoy - timedelta(days=365)).strftime("%Y-%m-%d")
    
    fecha_fin = hoy.strftime("%Y-%m-%d")
    
    try:
        resultado = []

        if ticker == "portfolio":
            if not portafolio.activos:
                return jsonify({"labels": [], "values": [], "ticker": "Portfolio"})

            ref = yf.Ticker(portafolio.activos[0].ticker)
            hist_ref = ref.history(start=fecha_inicio, end=fecha_fin)

            if hist_ref.empty:
                return jsonify({"labels": [], "values": [], "ticker": "Portfolio"})

            if periodo == "dias":
                for idx, _ in hist_ref.iterrows():
                    fecha = str(idx.date())
                    valor_total = 0
                    for activo in portafolio.activos:
                        hist_a = yf.Ticker(activo.ticker).history(start=fecha, period="1d")
                        if not hist_a.empty:
                            precio = float(hist_a['Close'].iloc[0])
                        else:
                            precio = activo.valor_actual
                        valor_total += precio * activo.cantidad
                    costo_total = sum(a.precio_compra * a.cantidad for a in portafolio.activos)
                    pct = round(((valor_total - costo_total) / costo_total) * 100, 2) if costo_total > 0 else 0
                    resultado.append({"label": fecha, "value": pct})

            elif periodo == "meses":
                import pandas as pd
                tickers_data = {}
                for activo in portafolio.activos:
                    h = yf.Ticker(activo.ticker).history(start=fecha_inicio, end=fecha_fin)
                    if not h.empty:
                        tickers_data[activo.ticker] = h['Close'].resample('ME').last()

                if tickers_data:
                    fechas = list(list(tickers_data.values())[0].index)
                    for fecha in fechas:
                        valor_total = 0
                        costo_total = 0
                        for activo in portafolio.activos:
                            if activo.ticker in tickers_data:
                                serie = tickers_data[activo.ticker]
                                if fecha in serie.index:
                                    precio = float(serie[fecha])
                                    valor_total += precio * activo.cantidad
                                    costo_total += activo.precio_compra * activo.cantidad
                        pct = round(((valor_total - costo_total) / costo_total) * 100, 2) if costo_total > 0 else 0
                        resultado.append({"label": fecha.strftime("%b %Y"), "value": pct})

            elif periodo == "anios":
                import pandas as pd
                tickers_data = {}
                for activo in portafolio.activos:
                    h = yf.Ticker(activo.ticker).history(start=fecha_inicio, end=fecha_fin)
                    if not h.empty:
                        tickers_data[activo.ticker] = h['Close'].resample('YE').last()

                if tickers_data:
                    fechas = list(list(tickers_data.values())[0].index)
                    for fecha in fechas:
                        valor_total = 0
                        costo_total = 0
                        for activo in portafolio.activos:
                            if activo.ticker in tickers_data:
                                serie = tickers_data[activo.ticker]
                                if fecha in serie.index:
                                    precio = float(serie[fecha])
                                    valor_total += precio * activo.cantidad
                                    costo_total += activo.precio_compra * activo.cantidad
                        pct = round(((valor_total - costo_total) / costo_total) * 100, 2) if costo_total > 0 else 0
                        resultado.append({"label": str(fecha.year), "value": pct})
        else:
            data = yf.Ticker(ticker)
            hist = data.history(start=fecha_inicio, end=fecha_fin)
            
            if hist.empty:
                return jsonify({"labels": [], "values": [], "ticker": ticker})
            
            precio_base = float(hist['Close'].iloc[0])
            
            if periodo == "dias":
                for idx, row in hist.iterrows():
                    pct = round(((float(row['Close']) - precio_base) / precio_base) * 100, 2)
                    resultado.append({"label": str(idx.date()), "value": pct})
            
            elif periodo == "meses":
                import pandas as pd
                hist_m = hist['Close'].resample('ME').last()
                for fecha, precio in hist_m.items():
                    pct = round(((float(precio) - precio_base) / precio_base) * 100, 2)
                    resultado.append({"label": fecha.strftime("%b %Y"), "value": pct})
            
            elif periodo == "anios":
                import pandas as pd
                hist_y = hist['Close'].resample('YE').last()
                for fecha, precio in hist_y.items():
                    pct = round(((float(precio) - precio_base) / precio_base) * 100, 2)
                    resultado.append({"label": str(fecha.year), "value": pct})

        labels = [r["label"] for r in resultado]
        values = [r["value"] for r in resultado]
        
        return jsonify({
            "labels": labels,
            "values": values,
            "ticker": ticker
        })
    except Exception as e:
        return jsonify({"error": str(e), "labels": [], "values": []}), 500

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

@app.route("/distribucion")
def distribucion():
    if not portafolio.activos:
        return jsonify({
            "labels": ["Liquidez"],
            "values": [100],
            "detalle": [{"categoria": "Liquidez", "valor": portafolio.capital, "pct": 100}]
        })
    
    categorias = {
        "Acciones USA": 0,
        "Acciones CO": 0,
        "Liquidez": portafolio.capital
    }
    
    tickers_usa = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "JPM"]
    tickers_co  = ["EC", "CIB"]
    
    for activo in portafolio.activos:
        valor = activo.valor_actual * activo.cantidad
        if activo.ticker in tickers_usa:
            categorias["Acciones USA"] += valor
        elif activo.ticker in tickers_co:
            categorias["Acciones CO"] += valor
        else:
            categorias["Liquidez"] += valor
    
    total = sum(categorias.values())
    
    detalle = [
        {
            "categoria": cat,
            "valor": round(valor, 2),
            "pct": round((valor / total) * 100, 1) if total > 0 else 0
        }
        for cat, valor in categorias.items()
        if valor > 0
    ]
    
    return jsonify({
        "labels": [d["categoria"] for d in detalle],
        "values": [d["pct"] for d in detalle],
        "detalle": detalle
    })

if __name__ == "__main__":
    app.run(debug=True)
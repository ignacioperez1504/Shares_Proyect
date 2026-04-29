from flask import Flask, jsonify, render_template, request
import yfinance as yf
from models.portafolio import Portafolio
from models.accion import Accion
from models.broker import Broker

app = Flask(__name__)

broker = Broker(comision=0.003)
portafolio = Portafolio(capital=100000, broker=broker)

accion1 = Accion("AAPL", cantidad=10, precio_compra=180, valor_actual=190)
accion2 = Accion("MSFT", cantidad=5, precio_compra=400, valor_actual=420)

portafolio.activos.extend([accion1, accion2])

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
            "currency": "USD"
        })
    return jsonify(activos)


@app.route("/comprar", methods=["POST"])
def comprar():
    data = request.json

    ticker = data["ticker"]
    cantidad = int(data["cantidad"])
    precio = float(data["precio"])

    accion = Accion(
        ticker=ticker,
        cantidad=0,
        precio_compra=precio,
        valor_actual=precio
    )

    exito = portafolio.comprar_activo(accion, cantidad)

    if exito:
        return jsonify({"success": True, "message": "Compra realizada"})
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

if __name__ == "__main__":
    app.run(debug=True)
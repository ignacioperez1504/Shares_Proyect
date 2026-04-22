# main.py
from flask import Flask, jsonify, render_template
from models.portafolio import Portafolio
from models.accion import Accion
from models.broker import Broker

app = Flask(__name__)

broker = Broker(comision=0.003)
portafolio = Portafolio(capital=10000000, broker=broker)

accion1 = Accion("AAPL", cantidad=10, precio_compra=180, valor_actual=190)
accion2 = Accion("MSFT", cantidad=5, precio_compra=400, valor_actual=420)

portafolio.activos.extend([accion1, accion2])

capital_inicial = 10000000

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/resumen")
def resumen():
    return jsonify(portafolio.resumen(capital_inicial))

if __name__ == "__main__":
    app.run(debug=True)
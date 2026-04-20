from flask import Flask, jsonify, render_template
from portafolio import Portafolio

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/resumen")
def resumen():
    datos = {
        "capitalDisponible": 10000000,
        "valorPortafolio": 25000000,
        "rentabilidadNeta": 12.5
    }
    return jsonify(datos)

if __name__ == "__main__":
    app.run(debug=True)
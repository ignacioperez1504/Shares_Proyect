# models/historial.py
from datetime import datetime

class Historial:
    def __init__(self):
        self.registros = []

    def registrar(self, valor_portafolio):
        self.registros.append({
            "fecha": datetime.now().strftime("%Y-%m-%d"),
            "valor_portafolio": valor_portafolio
        })
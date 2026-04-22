# models/accion.py
from models.activo import Activo

class Accion(Activo):
    def __init__(self, ticker, cantidad, precio_compra, valor_actual, dividendos=0):
        super().__init__(ticker, valor_actual)
        self.ticker = ticker
        self.cantidad = cantidad
        self.precio_compra = precio_compra
        self.dividendos = dividendos

    def calcular_valor(self):
        return self.cantidad * self.valor_actual

    def aplicar_dividendos(self, valor):
        self.dividendos += valor
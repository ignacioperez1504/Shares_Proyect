# models/accion.py
from models.activo import Activo
import yfinance as yf

class Accion(Activo):
    def __init__(self, ticker, cantidad, precio_compra, valor_actual=None):
        super().__init__(ticker)
        self.ticker = ticker
        self.cantidad = cantidad
        self.precio_compra = precio_compra
        self.valor_actual = valor_actual if valor_actual else precio_compra
        self.dividendos = 0

    def actualizar_valor(self):
        data = yf.Ticker(self.ticker)
        hist = data.history(period="1d")
        if not hist.empty:
            self.valor_actual = hist['Close'].iloc[-1]

    def calcular_valor(self):
        return self.cantidad * self.valor_actual

    def aplicar_dividendos(self, valor):
        if valor > 0:
            self.dividendos += valor

    def calcular_ganancia(self):
        return (self.valor_actual - self.precio_compra) * self.cantidad
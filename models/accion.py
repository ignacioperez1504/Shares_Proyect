# models/accion.py
from models.activo import Activo
import yfinance as yf

class Accion(Activo):
    def __init__(self, ticker, cantidad, precio_compra)
        super().__init__(ticker)
        if cantidad <= 0;
            raise ValueError("La cantidad debe ser mayor a 0")
        self.ticker = ticker
        self.cantidad = cantidad
        self.precio_compra = precio_compra
        self.dividendos = 0
    def actualizar_valor(self):
        data + yf.Ticker(self.ticker)
        hist = data.history(period="1d")
        if not hist.empty:
            self.valor_actual = hist['Close'].iloc[-1]

    def calcular_valor(self):
        return self.cantidad * self.valor_actual

    def aplicar_dividendos(self, valor):
        if valor > 0:
            self._dividendos += valor

    def calcular_ganancia(self):
        return (self._valor_actual - self._precio_compra) * self._cantidad

    def get_ticker(self):
        return self._ticker

    def get_cantidad(self):
        return self._cantidad

    def get_dividendos(self):
        return self._dividendos

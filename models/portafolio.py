# models/portafolio.py
from models.historial import Historial
from models.transaccion import Transaccion

class Portafolio:
    def __init__(self, capital, broker):
        self.capital = capital
        self.activos = []
        self.historial = Historial()
        self.broker = broker
        self.transacciones = []

    def comprar_activo(self, activo, cantidad):
        monto = activo.valor_actual * cantidad
        comision = self.broker.calcular_comision(monto)
        total = monto + comision

        if self.capital >= total:
            self.capital -= total
            activo.cantidad += cantidad
            self.activos.append(activo)

            transaccion = Transaccion("compra", activo.nombre, cantidad, activo.valor_actual, comision)
            self.transacciones.append(transaccion)
            return True
        return False

    def calcular_valor_total(self):
        total_activos = sum(a.calcular_valor() for a in self.activos)
        return self.capital + total_activos

    def calcular_rentabilidad(self, capital_inicial):
        return ((self.calcular_valor_total() - capital_inicial) / capital_inicial) * 100

    def resumen(self, capital_inicial):
        return {
            "capitalDisponible": self.capital,
            "valorPortafolio": self.calcular_valor_total(),
            "rentabilidadNeta": self.calcular_rentabilidad(capital_inicial)
        }
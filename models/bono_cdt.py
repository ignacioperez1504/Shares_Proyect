# models/bono_cdt.py
from models.activo import Activo

class BonoCDT(Activo):
    def __init__(self, nombre, capital_invertido, tasa_interes, dias):
        super().__init__(nombre, capital_invertido)
        self.capital_invertido = capital_invertido
        self.tasa_interes = tasa_interes
        self.dias = dias

    def calcular_interes_diario(self):
        return (self.capital_invertido * self.tasa_interes / 100) / 365

    def actualizar_valor(self):
        self.valor_actual += self.calcular_interes_diario()
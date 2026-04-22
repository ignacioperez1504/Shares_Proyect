# models/transaccion.py
from datetime import datetime

class Transaccion:
    def __init__(self, tipo, activo, cantidad, precio, comision):
        self.tipo = tipo
        self.activo = activo
        self.cantidad = cantidad
        self.precio = precio
        self.fecha = datetime.now()
        self.comision = comision

    def calcular_total(self):
        return self.cantidad * self.precio + self.comision
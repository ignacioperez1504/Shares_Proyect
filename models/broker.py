# models/broker.py
class Broker:
    def __init__(self, comision=0.003):
        self.comision = comision

    def calcular_comision(self, monto):
        return monto * self.comision
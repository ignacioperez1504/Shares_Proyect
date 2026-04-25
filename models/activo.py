# models/activo.py
class Activo:
    def _int_(self, nombre, valor_actual):
        self.nombre = nombre
        self.valor_actual = valor_actual
    def actualizar_valor(self, nuevo_valor):
        self.valor_actual = nuevo_valor

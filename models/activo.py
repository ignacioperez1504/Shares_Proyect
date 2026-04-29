class Activo:
    def __init__(self, nombre):
        self.nombre = nombre
        self.valor_actual = 0

    def actualizar_valor(self, nuevo_valor):
        self.valor_actual = nuevo_valor
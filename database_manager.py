import pickle
import os

class Database:
    def __init__(self, filename="data.pkl"):
        self.filename = filename
        self.data = self._load_data()

    def _load_data(self):
        if os.path.exists(self.filename):
            try:
                with open(self.filename, 'rb') as f:
                    return pickle.load(f)
            except (IOError, pickle.UnpicklingError):
                print("Error al cargar el archivo de datos. Creando uno nuevo.")
                return self._default_data()
        else:
            return self._default_data()

    def _default_data(self):
        return {
            "vendedores": [
                {"id": "V001", "nombre": "Daniel Moreno Rodriguez", "correo": "rookiemaker3d@gmail.com", "telefono": "479-100-09-52", "banco": "BBVA BANCOMER", "cuenta": "1575249892"},
                {"id": "V002", "nombre": "Emanuel Fidel Ramirez Alamillo", "correo": "rookiemakersd@gmail.com", "telefono": "477-595-85-27", "banco": "Nu", "cuenta": "638180000157451360"},
                {"id": "V003", "nombre": "Norberto Charbel Moreno Rodriguez", "correo": "norbertomoro4@gmail.com", "telefono": "472-148-89-13", "banco": "Mercado Pago", "cuenta": "W722969010092073360"}
            ],
            "clientes": [],
            "productos": [],
            "servicios": [
                {"id": 1, "nombre": "Mantenimiento e Implementación", "tarifa_fija": 250, "tarifa_por_hora": 50},
                {"id": 2, "nombre": "Desarrollo de proyectos", "tarifa_fija": 250, "tarifa_por_hora": 50}
            ],
            "cotizaciones_servicios": [],
            "cotizaciones_en_espera": [],
            "recibos_venta": []
        }

    def _save_data(self):
        with open(self.filename, 'wb') as f:
            pickle.dump(self.data, f)

    def get_vendedores(self):
        return self.data["vendedores"]

    def get_servicios(self):
        return self.data["servicios"]

    def add_cliente(self, cliente):
        cliente["id"] = len(self.data["clientes"]) + 1
        self.data["clientes"].append(cliente)
        self._save_data()

    def get_clientes(self):
        return self.data["clientes"]
        
    def add_vendedor(self, vendedor):
        vendedor["id"] = len(self.data["vendedores"]) + 1
        self.data["vendedores"].append(vendedor)
        self._save_data()

    def add_producto(self, producto):
        producto["id"] = len(self.data["productos"]) + 1
        self.data["productos"].append(producto)
        self._save_data()

    def get_productos(self):
        return self.data["productos"]

    def add_cotizacion_servicio(self, cotizacion):
        cotizacion["id"] = len(self.data["cotizaciones_servicios"]) + 1
        self.data["cotizaciones_servicios"].append(cotizacion)
        self._save_data()

    def add_cotizacion_en_espera(self, cotizacion):
        cotizacion["id"] = len(self.data["cotizaciones_en_espera"]) + 1
        self.data["cotizaciones_en_espera"].append(cotizacion)
        self._save_data()

    def get_cotizaciones_en_espera(self):
        return self.data["cotizaciones_en_espera"]

    def delete_producto(self, producto_id):
        self.data["productos"] = [p for p in self.data["productos"] if p["id"] != producto_id]
        self._save_data()

    def add_recibo_venta(self, recibo):
        recibo["id"] = len(self.data["recibos_venta"]) + 1
        self.data["recibos_venta"].append(recibo)
        self._save_data()

    def get_recibos_venta(self):
        return self.data["recibos_venta"]
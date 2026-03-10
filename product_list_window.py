import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from PIL import Image, ImageDraw, ImageFont
import os
import json
import datetime

class ProductListWindow(tk.Toplevel):
    def __init__(self, parent, db):
        super().__init__(parent)
        self.title("Listado de Productos Autorizados")
        self.db = db
        self.parent = parent
        self.image_path_config = self.load_image_path_config()
        
        # Corregido: Inicializar el objeto de estilo aquí
        self.style = ttk.Style(self)
        self.style.configure('TButton', font=('Helvetica', 12, 'bold'), padding=10)
        self.style.configure('TLabel', font=('Helvetica', 10), foreground='#333333')
        self.style.configure('TEntry', font=('Helvetica', 10))
        
        # Corregido: Inicializar las variables de totales en el constructor
        self.total_costo = tk.StringVar(value="Total Costo: $0.00")
        self.total_venta = tk.StringVar(value="Total Venta: $0.00")
        self.total_ganancia = tk.StringVar(value="Ganancia Neta: $0.00")
        
        self.create_widgets()
        
    def load_image_path_config(self):
        if os.path.exists("config.json"):
            with open("config.json", "r") as f:
                return json.load(f)
        return {}

    def create_widgets(self):
        main_frame = ttk.Frame(self, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)

        ttk.Label(main_frame, text="Productos Autorizados", font=("Helvetica", 16, "bold")).pack(pady=10)

        tree = ttk.Treeview(main_frame, columns=("ID", "Descripción", "Costo Producción", "Costo Final", "Ganancia"), show="headings")
        tree.heading("ID", text="ID")
        tree.heading("Descripción", text="Descripción")
        tree.heading("Costo Producción", text="Costo Producción")
        tree.heading("Costo Final", text="Costo Final")
        tree.heading("Ganancia", text="Ganancia")
        
        tree.column("ID", width=50, stretch=tk.NO)
        tree.column("Costo Producción", width=120, stretch=tk.NO)
        tree.column("Costo Final", width=100, stretch=tk.NO)
        tree.column("Ganancia", width=100, stretch=tk.NO)
        
        tree.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        self.tree = tree

        total_frame = ttk.Frame(main_frame)
        total_frame.pack(fill=tk.X, pady=10)
        
        ttk.Label(total_frame, textvariable=self.total_costo, font=('Helvetica', 12, 'bold')).pack(side=tk.LEFT, padx=10)
        ttk.Label(total_frame, textvariable=self.total_venta, font=('Helvetica', 12, 'bold')).pack(side=tk.LEFT, padx=10)
        self.ganancia_label = ttk.Label(total_frame, textvariable=self.total_ganancia, font=('Helvetica', 12, 'bold'))
        self.ganancia_label.pack(side=tk.LEFT, padx=10)
        
        self.populate_tree()

        button_frame = ttk.Frame(main_frame)
        button_frame.pack(pady=10)

        ttk.Button(button_frame, text="Eliminar", command=self.delete_product, style='Red.TButton').pack(side=tk.LEFT, padx=10)
        ttk.Button(button_frame, text="Importar Venta", command=self.import_sale, style='Blue.TButton').pack(side=tk.LEFT, padx=10)

    def populate_tree(self):
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        products = self.db.get_productos()
        total_costo = 0
        total_venta = 0
        total_ganancia = 0

        for p in products:
            costo_produccion = p.get('costo_base', 0)
            costo_envio = p.get('detalles', {}).get('costo_envio', 0)
            
            ganancia = p.get('costo_final', 0) - (costo_produccion + costo_envio)
            
            self.tree.insert("", "end", values=(p.get("id"), p.get("descripcion", "N/A"), f"${costo_produccion:.2f}", f"${p.get('costo_final', 0):.2f}", f"${ganancia:.2f}"))
            
            total_costo += costo_produccion
            total_venta += p.get('costo_final', 0)
            total_ganancia += ganancia

        self.total_costo.set(f"Total Costo: ${total_costo:.2f}")
        self.total_venta.set(f"Total Venta: ${total_venta:.2f}")
        self.total_ganancia.set(f"Ganancia Neta: ${total_ganancia:.2f}")

        if total_ganancia >= 0:
            self.ganancia_label.config(foreground='green')
        else:
            self.ganancia_label.config(foreground='red')


    def delete_product(self):
        selected_item = self.tree.selection()
        if not selected_item:
            messagebox.showerror("Error", "Debes seleccionar un producto para eliminar.")
            return

        confirm = messagebox.askyesno("Confirmar", "¿Estás seguro de que quieres eliminar este producto?")
        if confirm:
            product_id = int(self.tree.item(selected_item, "values")[0])
            self.db.delete_producto(product_id)
            messagebox.showinfo("Éxito", "Producto eliminado correctamente.")
            self.populate_tree()

    def import_sale(self):
        self.import_window = tk.Toplevel(self)
        self.import_window.title("Importar Venta")
        self.import_window.geometry("400x300")
        
        ttk.Label(self.import_window, text="Descripción:").pack(pady=5)
        self.desc_entry = ttk.Entry(self.import_window)
        self.desc_entry.pack(pady=5)

        ttk.Label(self.import_window, text="Costo de Producción:").pack(pady=5)
        self.costo_prod_entry = ttk.Entry(self.import_window)
        self.costo_prod_entry.pack(pady=5)

        ttk.Label(self.import_window, text="Costo Final de Venta:").pack(pady=5)
        self.costo_final_entry = ttk.Entry(self.import_window)
        self.costo_final_entry.pack(pady=5)

        ttk.Button(self.import_window, text="Guardar Venta", command=self.save_imported_sale, style='Green.TButton').pack(pady=20)

    def save_imported_sale(self):
        try:
            descripcion = self.desc_entry.get()
            costo_produccion = float(self.costo_prod_entry.get())
            costo_final = float(self.costo_final_entry.get())

            if not descripcion:
                messagebox.showerror("Error", "La descripción es obligatoria.")
                return

            imported_product = {
                "descripcion": descripcion,
                "costo_base": costo_produccion,
                "costo_final": costo_final,
                "cantidad": 1,
                "vendedor": "Importado",
                "detalles": {} # Cambiado a diccionario vacío para evitar el error
            }
            
            self.db.add_producto(imported_product)
            messagebox.showinfo("Éxito", "Venta importada correctamente.")
            self.import_window.destroy()
            self.populate_tree()

        except ValueError:
            messagebox.showerror("Error", "Por favor, ingresa valores numéricos válidos en los costos.")
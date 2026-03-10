import tkinter as tk
from tkinter import ttk, messagebox
import datetime
from PIL import Image, ImageDraw, ImageFont
import os
import json

class ServiceQuoteWindow(tk.Toplevel):
    def __init__(self, parent, db, vendedor_nombre):
        super().__init__(parent)
        self.title("Cotización de Servicio")
        self.geometry("800x600")
        self.db = db
        self.parent = parent
        self.vendedor_nombre = vendedor_nombre
        self.vendedor_data = next((v for v in self.db.get_vendedores() if v['nombre'] == self.vendedor_nombre), None)
        
        if not self.vendedor_data:
            messagebox.showerror("Error", "No se pudo encontrar la información del vendedor seleccionado.")
            self.destroy()
            return
            
        self.servicios = self.db.get_servicios()
        self.cotizaciones_agregadas = []
        self.image_path_config = self.load_image_path_config()
        
        style = ttk.Style(self)
        style.configure('TButton', font=('Helvetica', 12, 'bold'), padding=10)
        style.configure('TLabel', font=('Helvetica', 10), foreground='#333333')
        style.configure('TEntry', font=('Helvetica', 10))

        self.create_widgets()

    def load_image_path_config(self):
        if os.path.exists("config.json"):
            with open("config.json", "r") as f:
                return json.load(f)
        return {}
    
    def create_widgets(self):
        main_frame = ttk.Frame(self, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)

        ttk.Label(main_frame, text="Cotización de Servicio", font=("Helvetica", 18, "bold")).pack(pady=10)

        select_frame = ttk.Frame(main_frame, padding="10")
        select_frame.pack(fill=tk.X)
        
        ttk.Label(select_frame, text="Servicio:").pack(side=tk.LEFT, padx=5)
        self.servicio_combo = ttk.Combobox(select_frame, values=[s["nombre"] for s in self.servicios], state="readonly")
        self.servicio_combo.pack(side=tk.LEFT, padx=5)
        self.servicio_combo.bind("<<ComboboxSelected>>", self.calculate_total)

        self.horas_var = tk.DoubleVar(value=0)
        ttk.Label(select_frame, text="Horas:").pack(side=tk.LEFT, padx=(20, 5))
        ttk.Entry(select_frame, textvariable=self.horas_var, width=5).pack(side=tk.LEFT)
        self.horas_var.trace("w", lambda *args: self.calculate_total())
        
        self.cantidad_var = tk.DoubleVar(value=1)
        ttk.Label(select_frame, text="Cantidad:").pack(side=tk.LEFT, padx=(20, 5))
        ttk.Entry(select_frame, textvariable=self.cantidad_var, width=5).pack(side=tk.LEFT)
        self.cantidad_var.trace("w", lambda *args: self.calculate_total())

        self.costo_final_var = tk.StringVar(value="$0.00")
        ttk.Label(select_frame, textvariable=self.costo_final_var, font=("Helvetica", 12, "bold")).pack(side=tk.RIGHT)
        ttk.Label(select_frame, text="Costo Final:").pack(side=tk.RIGHT)

        ttk.Button(select_frame, text="Añadir a Cotización", command=self.add_to_quote, style='Blue.TButton').pack(side=tk.LEFT, padx=10)

        self.tree = ttk.Treeview(main_frame, columns=("Descripción", "Cantidad", "Horas", "Costo Final"), show="headings")
        self.tree.heading("Descripción", text="Descripción")
        self.tree.heading("Cantidad", text="Cantidad")
        self.tree.heading("Horas", text="Horas")
        self.tree.heading("Costo Final", text="Costo Final")
        self.tree.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        button_frame = ttk.Frame(main_frame)
        button_frame.pack(pady=10)

        ttk.Button(button_frame, text="Generar Cotización", command=self.generate_service_quote, style='Green.TButton').pack(side=tk.LEFT, padx=10)
        ttk.Button(button_frame, text="Limpiar", command=self.clear_fields, style='Red.TButton').pack(side=tk.LEFT, padx=10)


    def calculate_total(self, event=None):
        try:
            servicio_nombre = self.servicio_combo.get()
            servicio = next((s for s in self.servicios if s["nombre"] == servicio_nombre), None)
            
            if servicio:
                horas = self.horas_var.get()
                cantidad = self.cantidad_var.get()
                costo = (servicio["tarifa_fija"] + (servicio["tarifa_por_hora"] * horas)) * cantidad
                self.costo_final_var.set(f"${costo:.2f}")
            else:
                self.costo_final_var.set("$0.00")
        except (ValueError, tk.TclError):
            self.costo_final_var.set("$0.00")
    
    def clear_fields(self):
        self.servicio_combo.set('')
        self.horas_var.set(0)
        self.cantidad_var.set(1)
        for item in self.tree.get_children():
            self.tree.delete(item)
        self.cotizaciones_agregadas.clear()

    def add_to_quote(self):
        servicio_nombre = self.servicio_combo.get()
        horas = self.horas_var.get()
        cantidad = self.cantidad_var.get()
        costo_final_str = self.costo_final_var.get().replace('$', '')
        
        if not servicio_nombre or not costo_final_str:
            messagebox.showerror("Error", "Debes seleccionar un servicio y calcular el costo.")
            return

        costo_final = float(costo_final_str)
        
        cotizacion_data = {
            "vendedor": self.vendedor_nombre,
            "descripcion": servicio_nombre,
            "cantidad": cantidad,
            "horas": horas,
            "costo_final": costo_final,
            "fecha": datetime.date.today().isoformat()
        }
        
        self.cotizaciones_agregadas.append(cotizacion_data)
        self.tree.insert("", "end", values=(servicio_nombre, cantidad, horas, f"${costo_final:.2f}"))
        messagebox.showinfo("Servicio Agregado", "El servicio ha sido añadido a la cotización.")
        
    def generate_service_quote(self):
        if not self.cotizaciones_agregadas:
            messagebox.showerror("Error", "No hay servicios en la lista para cotizar.")
            return

        self.db.add_cotizacion_servicio({"items": self.cotizaciones_agregadas})
        messagebox.showinfo("Éxito", "Cotización de servicio guardada.")
        self.generate_image_quote()
        self.destroy()

    def generate_image_quote(self):
        if 'image_path' not in self.parent.image_path_config or 'logo_path' not in self.parent.image_path_config:
            self.parent.setup_image_paths()
            if 'image_path' not in self.parent.image_path_config or 'logo_path' not in self.parent.image_path_config:
                return

        output_dir = self.parent.image_path_config['image_path']
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        img_width, img_height = 800, 1100
        img = Image.new('RGB', (img_width, img_height), color='white')
        draw = ImageDraw.Draw(img)

        try:
            logo_img = Image.open(self.parent.image_path_config['logo_path'])
            logo_img.thumbnail((200, 150), Image.LANCZOS)
            img.paste(logo_img, (50, 50))
        except FileNotFoundError:
            return

        try:
            font_title = ImageFont.truetype("arial.ttf", 30)
            font_header = ImageFont.truetype("arial.ttf", 20)
            font_body = ImageFont.truetype("arial.ttf", 16)
            font_bold = ImageFont.truetype("arialbd.ttf", 16)
        except IOError:
            font_title = ImageFont.load_default()
            font_header = ImageFont.load_default()
            font_body = ImageFont.load_default()
            font_bold = ImageFont.load_default()
        
        draw.text((250, 100), "QUIMICOS 3D", font=font_title, fill='black')
        
        y_pos = 220
        draw.text((50, y_pos), "COTIZACIÓN DE SERVICIO", font=font_title, fill='black')
        y_pos += 50
        draw.text((50, y_pos), f"Fecha: {datetime.date.today()}", font=font_body, fill='black')
        draw.text((450, y_pos), f"Vendedor: {self.vendedor_nombre}", font=font_body, fill='black')
        y_pos += 40
        draw.line([(50, y_pos), (750, y_pos)], fill='gray', width=2)
        y_pos += 20
        
        draw.text((50, y_pos), "Descripción", font=font_bold, fill='black')
        draw.text((250, y_pos), "Cantidad", font=font_bold, fill='black')
        draw.text((450, y_pos), "Horas", font=font_bold, fill='black')
        draw.text((650, y_pos), "Costo Final", font=font_bold, fill='black')
        y_pos += 20
        draw.line([(50, y_pos), (750, y_pos)], fill='gray', width=1)
        y_pos += 10

        total_cost = 0
        for item in self.cotizaciones_agregadas:
            draw.text((50, y_pos), item['descripcion'], font=font_body, fill='black')
            draw.text((250, y_pos), str(int(item['cantidad'])), font=font_body, fill='black')
            draw.text((450, y_pos), f"{item['horas']:.2f}", font=font_body, fill='black')
            draw.text((650, y_pos), f"${item['costo_final']:.2f}", font=font_body, fill='black')
            total_cost += item['costo_final']
            y_pos += 30
        
        draw.line([(50, y_pos), (750, y_pos)], fill='gray', width=2)
        y_pos += 20
        draw.text((550, y_pos), "Total:", font=font_bold, fill='black')
        draw.text((650, y_pos), f"${total_cost:.2f}", font=font_bold, fill='black')
        
        y_pos += 40
        draw.text((50, y_pos), "Términos Generales", font=font_header, fill='black')
        y_pos += 30
        terminos = "Esta cotización tiene una validez de 3 días hábiles.\nSe requiere un anticipo del 50% para comenzar el proyecto."
        draw.multiline_text((50, y_pos), terminos, font=font_body, fill='black')
        
        y_pos += 80
        vendedor = next(v for v in self.db.get_vendedores() if v['nombre'] == self.vendedor_nombre)
        draw.text((50, y_pos), "Cuenta para Depósito:", font=font_bold, fill='black')
        draw.text((50, y_pos + 30), f"Banco: {vendedor['banco']} - Cuenta: {vendedor['cuenta']}", font=font_body, fill='black')

        filename = f"cotizacion_servicio_{datetime.date.today().strftime('%Y%m%d')}.png"
        full_path = os.path.join(output_dir, filename)
        img.save(full_path)
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from PIL import Image, ImageDraw, ImageFont, ImageTk
import os
import json
import datetime

class CalculatorWindow(tk.Toplevel):
    def __init__(self, parent, db, vendedor_nombre):
        super().__init__(parent)
        self.title("Calculadora de Impresión 3D y Cotización")
        self.geometry("1000x800")
        self.db = db
        self.vendedor_nombre = vendedor_nombre
        self.cotizaciones_agregadas = []
        self.image_path_config = self.load_image_path_config()
        self.parent = parent
        
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
        self.MARGEN_GANANCIA = 0.50
        self.COSTO_FILAMENTO_BASE = 500
        self.COSTO_ENERGIA_BASE = 4.50
        self.COSTO_LIMPIEZA_BASE = 25
        self.COSTO_DISENO_BASE = 50
        self.IVA = 0.16

        main_frame = ttk.Frame(self, padding="20", style='TFrame')
        main_frame.pack(fill=tk.BOTH, expand=True)
        main_frame['relief'] = 'flat'

        input_frame = ttk.LabelFrame(main_frame, text="Datos de Impresión", padding="15")
        input_frame.pack(fill=tk.X, pady=10)

        self.vars = {
            "descripcion": tk.StringVar(), "horas": tk.DoubleVar(value=0), "minutos": tk.DoubleVar(value=0),
            "gramos": tk.DoubleVar(value=0), "limpieza": tk.DoubleVar(value=0), "diseno": tk.DoubleVar(value=0),
            "cantidad": tk.DoubleVar(value=1), "envio": tk.DoubleVar(value=0)
        }

        labels_and_vars = [
            ("Descripción:", "descripcion"), ("Horas de Impresión:", "horas"), 
            ("Minutos de Impresión:", "minutos"), ("Gramos de Filamento:", "gramos"), 
            ("Tiempo de Limpieza (min):", "limpieza"), ("Tiempo de Diseño (min):", "diseno"), 
            ("Cantidad de Piezas:", "cantidad"), ("Costo de Envío:", "envio")
        ]

        for i, (label_text, var_name) in enumerate(labels_and_vars):
            ttk.Label(input_frame, text=label_text).grid(row=i, column=0, sticky=tk.W, pady=5)
            if var_name == "descripcion":
                entry = ttk.Entry(input_frame, textvariable=self.vars[var_name], width=50)
            else:
                entry = ttk.Entry(input_frame, textvariable=self.vars[var_name], width=20)
                self.vars[var_name].trace("w", lambda *args: self.calculate_cost())
            entry.grid(row=i, column=1, sticky=tk.E, pady=5)
        
        output_frame = ttk.LabelFrame(main_frame, text="Resumen de Costos", padding="15")
        output_frame.pack(fill=tk.X, pady=10)

        self.output_vars = {
            "costo_final_total": tk.StringVar(value="$0.00")
        }

        ttk.Label(output_frame, text="Costo Final Total:", font=('Helvetica', 12, 'bold')).grid(row=0, column=0, sticky=tk.W, pady=2)
        ttk.Label(output_frame, textvariable=self.output_vars["costo_final_total"], font=("Helvetica", 16, "bold"), foreground='#0066cc').grid(row=0, column=1, sticky=tk.E, padx=10)

        button_frame = ttk.Frame(main_frame)
        button_frame.pack(pady=10)
        
        ttk.Button(button_frame, text="Agregar a la Lista", command=self.add_to_list, style='Blue.TButton').pack(side=tk.LEFT, padx=10)
        ttk.Button(button_frame, text="Cotizar", command=self.generate_quotes, style='Green.TButton').pack(side=tk.LEFT, padx=10)
        ttk.Button(button_frame, text="Limpiar", command=self.clear_fields, style='Red.TButton').pack(side=tk.LEFT, padx=10)

        table_frame = ttk.LabelFrame(main_frame, text="Piezas a Cotizar", padding="15")
        table_frame.pack(fill=tk.BOTH, expand=True, pady=10)

        self.tree = ttk.Treeview(table_frame, columns=("Descripción", "Cantidad", "Tiempo (min)", "Costo Final"), show="headings")
        self.tree.heading("Descripción", text="Descripción")
        self.tree.heading("Cantidad", text="Cantidad")
        self.tree.heading("Tiempo (min)", text="Tiempo (min)")
        self.tree.heading("Costo Final", text="Costo Final")
        self.tree.pack(fill=tk.BOTH, expand=True)

    def load_quote_for_editing(self, cotizacion_data):
        self.vars["descripcion"].set(cotizacion_data["descripcion"])
        self.vars["horas"].set(cotizacion_data["detalles"]["tiempo_total"] // 60)
        self.vars["minutos"].set(cotizacion_data["detalles"]["tiempo_total"] % 60)
        self.vars["gramos"].set(cotizacion_data["detalles"]["costo_filamento"] * 1000 / self.COSTO_FILAMENTO_BASE)
        self.vars["limpieza"].set(cotizacion_data["detalles"]["costo_limpieza"] * 60 / self.COSTO_LIMPIEZA_BASE)
        self.vars["diseno"].set(cotizacion_data["detalles"]["costo_diseno"] * 60 / self.COSTO_DISENO_BASE)
        self.vars["cantidad"].set(cotizacion_data["cantidad"])
        self.vars["envio"].set(cotizacion_data["detalles"]["costo_envio"])
        self.calculate_cost()

    def clear_fields(self):
        for var in self.vars.values():
            if isinstance(var, tk.StringVar):
                var.set("")
            else:
                var.set(0)
        self.vars["cantidad"].set(1)
        self.output_vars["costo_final_total"].set("$0.00")
        
        for item in self.tree.get_children():
            self.tree.delete(item)
        self.cotizaciones_agregadas.clear()

    def add_to_list(self):
        try:
            descripcion = self.vars["descripcion"].get()
            if not descripcion:
                messagebox.showerror("Error", "La descripción de la pieza es obligatoria.")
                return

            tiempo_total_min = (self.vars["horas"].get() * 60) + self.vars["minutos"].get()
            
            # --- CORRECCIÓN AQUÍ: Dividir por 1000 para pasar de gramos a kilogramos ---
            costo_filamento = (self.vars["gramos"].get() / 1000) * self.COSTO_FILAMENTO_BASE
            
            costo_energia = (self.COSTO_ENERGIA_BASE * tiempo_total_min) / 60
            costo_limpieza = (self.COSTO_LIMPIEZA_BASE * self.vars["limpieza"].get()) / 60
            costo_diseno = (self.COSTO_DISENO_BASE * self.vars["diseno"].get()) / 60
            costo_base_pieza = costo_filamento + costo_energia + costo_limpieza + costo_diseno
            
            costo_final_total = (costo_base_pieza + (costo_base_pieza * self.MARGEN_GANANCIA)) * self.vars["cantidad"].get() + self.vars["envio"].get()
            
            cotizacion_data = {
                "vendedor": self.vendedor_nombre,
                "descripcion": descripcion,
                "cantidad": self.vars["cantidad"].get(),
                "costo_base": costo_base_pieza,
                "costo_final": costo_final_total,
                "fecha": datetime.date.today().isoformat(),
                "detalles": {
                    "tiempo_total": tiempo_total_min,
                    "costo_filamento": costo_filamento,
                    "costo_energia": costo_energia,
                    "costo_limpieza": costo_limpieza,
                    "costo_diseno": costo_diseno,
                    "costo_envio": self.vars['envio'].get()
                }
            }
            
            self.cotizaciones_agregadas.append(cotizacion_data)
            self.tree.insert("", "end", values=(descripcion, cotizacion_data['cantidad'], f"{cotizacion_data['detalles']['tiempo_total']:.0f} min", f"${cotizacion_data['costo_final']:.2f}"))
            messagebox.showinfo("Pieza Agregada", "La pieza ha sido añadida a la lista para cotizar.")
            self.vars["descripcion"].set("")
        
        except (tk.TclError, ValueError):
            messagebox.showerror("Error de entrada", "Asegúrate de que todos los campos numéricos contengan números válidos.")

    def calculate_cost(self):
        try:
            tiempo_total_min = (self.vars["horas"].get() * 60) + self.vars["minutos"].get()
            
            # --- CORRECCIÓN AQUÍ: Dividir por 1000 para pasar de gramos a kilogramos ---
            costo_filamento = (self.vars["gramos"].get() / 1000) * self.COSTO_FILAMENTO_BASE
            
            costo_energia = (self.COSTO_ENERGIA_BASE * tiempo_total_min) / 60
            costo_limpieza = (self.COSTO_LIMPIEZA_BASE * self.vars["limpieza"].get()) / 60
            costo_diseno = (self.COSTO_DISENO_BASE * self.vars["diseno"].get()) / 60
            costo_base_pieza = costo_filamento + costo_energia + costo_limpieza + costo_diseno
            costo_final_total = (costo_base_pieza + (costo_base_pieza * self.MARGEN_GANANCIA)) * self.vars["cantidad"].get() + self.vars["envio"].get()
            self.output_vars["costo_final_total"].set(f"${costo_final_total:.2f}")
        except (tk.TclError, ValueError):
            self.output_vars["costo_final_total"].set("$0.00")

    def generate_quotes(self):
        if not self.cotizaciones_agregadas:
            messagebox.showerror("Error", "No hay piezas en la lista para cotizar.")
            return

        for cotizacion_data in self.cotizaciones_agregadas:
            self.db.add_cotizacion_en_espera(cotizacion_data)
            self.generate_image_quote(cotizacion_data)

        messagebox.showinfo("Cotizaciones Generadas", f"Se han generado {len(self.cotizaciones_agregadas)} cotizaciones y guardado en la lista de 'En Espera'.")
        self.destroy()

    def generate_image_quote(self, data):
        if 'image_path' not in self.image_path_config or 'logo_path' not in self.image_path_config:
            self.parent.setup_image_paths()
            self.image_path_config = self.load_image_path_config()
            if 'image_path' not in self.image_path_config or 'logo_path' not in self.image_path_config:
                return

        output_dir = self.image_path_config['image_path']
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        img_width, img_height = 800, 1100
        img = Image.new('RGB', (img_width, img_height), color='white')
        draw = ImageDraw.Draw(img)

        try:
            logo_img = Image.open(self.image_path_config['logo_path'])
            logo_img.thumbnail((200, 150), Image.LANCZOS)
            img.paste(logo_img, (50, 50))
        except FileNotFoundError:
            messagebox.showerror("Error de Logo", "No se encontró el archivo del logo. Por favor, reinicia la aplicación y selecciónalo.")
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
        
        draw.text((250, 100), "Rookie Makers 3D", font=font_title, fill='black')
        
        y_pos = 220
        draw.text((50, y_pos), "COTIZACIÓN DE IMPRESIÓN 3D", font=font_title, fill='black')
        y_pos += 50
        draw.text((50, y_pos), f"Fecha: {data['fecha']}", font=font_body, fill='black')
        draw.text((450, y_pos), f"Vendedor: {data['vendedor']}", font=font_body, fill='black')
        y_pos += 40
        draw.line([(50, y_pos), (750, y_pos)], fill='gray', width=2)
        y_pos += 20
        
        draw.text((50, y_pos), "Descripción", font=font_bold, fill='black')
        draw.text((250, y_pos), "Cantidad", font=font_bold, fill='black')
        draw.text((450, y_pos), "Tiempo (min)", font=font_bold, fill='black')
        draw.text((650, y_pos), "Costo Final", font=font_bold, fill='black')
        y_pos += 20
        draw.line([(50, y_pos), (750, y_pos)], fill='gray', width=1)
        y_pos += 10

        draw.text((50, y_pos), data['descripcion'], font=font_body, fill='black')
        draw.text((250, y_pos), str(int(data['cantidad'])), font=font_body, fill='black')
        
        draw.text((450, y_pos), f"{data['detalles']['tiempo_total']:.0f}", font=font_body, fill='black')
        draw.text((650, y_pos), f"${data['costo_final']:.2f}", font=font_body, fill='black')
        y_pos += 40
        draw.line([(50, y_pos), (750, y_pos)], fill='gray', width=2)
        
        y_pos += 40
        draw.text((50, y_pos), "Términos Generales", font=font_header, fill='black')
        y_pos += 30
        terminos = "Esta cotización tiene una validez de 3 días hábiles.\n\nEl tiempo de entrega es de 3 días hábiles a partir de la confirmación del pedido."
        draw.multiline_text((50, y_pos), terminos, font=font_body, fill='black')
        
        y_pos += 80
        vendedor = next(v for v in self.db.get_vendedores() if v['nombre'] == self.vendedor_nombre)
        draw.text((50, y_pos), "Cuenta para Depósito:", font=font_bold, fill='black')
        draw.text((50, y_pos + 30), f"Banco: {vendedor['banco']} - Cuenta: {vendedor['cuenta']}", font=font_body, fill='black')
        
        filename = f"cotizacion_{data['descripcion'].replace(' ', '_')}.png"
        full_path = os.path.join(output_dir, filename)
        img.save(full_path)
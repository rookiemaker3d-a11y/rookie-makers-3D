import tkinter as tk
from tkinter import ttk, messagebox
from PIL import Image, ImageDraw, ImageFont
import os
import datetime
import json
from calculator_window import CalculatorWindow

class PendingQuotesWindow(tk.Toplevel):
    def __init__(self, parent, db):
        super().__init__(parent)
        self.title("Cotizaciones en Espera")
        self.db = db
        self.parent = parent
        self.cotizaciones = self.db.get_cotizaciones_en_espera()
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
        main_frame = ttk.Frame(self, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)

        ttk.Label(main_frame, text="Cotizaciones en Espera", font=("Helvetica", 16, "bold"), foreground='#0066cc').pack(pady=10)

        tree = ttk.Treeview(main_frame, columns=("ID", "Descripción", "Cantidad", "Costo Base", "Costo Final", "Vendedor", "Fecha"), show="headings")
        tree.heading("ID", text="ID")
        tree.heading("Descripción", text="Descripción")
        tree.heading("Cantidad", text="Cantidad")
        tree.heading("Costo Base", text="Costo Base")
        tree.heading("Costo Final", text="Costo Final")
        tree.heading("Vendedor", text="Vendedor")
        tree.heading("Fecha", text="Fecha")

        tree.column("ID", width=50, stretch=tk.NO)
        tree.column("Cantidad", width=70, stretch=tk.NO)
        tree.column("Costo Base", width=100, stretch=tk.NO)
        tree.column("Costo Final", width=100, stretch=tk.NO)
        
        tree.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        self.tree = tree
        self.populate_tree()
        
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(pady=10)
        
        ttk.Button(button_frame, text="Autorizar Venta", command=self.authorize_sale, style='Green.TButton').pack(side=tk.LEFT, padx=10)
        ttk.Button(button_frame, text="Generar Recibo", command=self.generate_receipt, style='Green.TButton').pack(side=tk.LEFT, padx=10)
        ttk.Button(button_frame, text="Generar Cotización Múltiple", command=self.generate_multiple_quote, style='Blue.TButton').pack(side=tk.LEFT, padx=10)
        ttk.Button(button_frame, text="Editar", command=self.edit_quote, style='Blue.TButton').pack(side=tk.LEFT, padx=10)
        ttk.Button(button_frame, text="Eliminar", command=self.delete_quote, style='Red.TButton').pack(side=tk.LEFT, padx=10)

    def populate_tree(self):
        for item in self.tree.get_children():
            self.tree.delete(item)
        for c in self.cotizaciones:
            self.tree.insert("", "end", values=(c["id"], c["descripcion"], c["cantidad"], f"${c['costo_base']:.2f}", f"${c['costo_final']:.2f}", c["vendedor"], c["fecha"]))

    def get_selected_cotizaciones(self):
        selected_items = self.tree.selection()
        if not selected_items:
            messagebox.showerror("Error", "Debes seleccionar al menos una cotización.")
            return None
        
        selected_cotizaciones = []
        for item in selected_items:
            cotizacion_id = int(self.tree.item(item, "values")[0])
            cotizacion_data = next((c for c in self.cotizaciones if c["id"] == cotizacion_id), None)
            if cotizacion_data:
                selected_cotizaciones.append(cotizacion_data)
        
        return selected_cotizaciones

    def authorize_sale(self):
        cotizacion_data_list = self.get_selected_cotizaciones()
        if not cotizacion_data_list:
            return

        for cotizacion_data in cotizacion_data_list:
            self.db.add_producto(cotizacion_data)
            self.cotizaciones.remove(cotizacion_data)

        self.db._save_data()
        messagebox.showinfo("Éxito", f"Se autorizaron y guardaron {len(cotizacion_data_list)} productos.")
        self.populate_tree()
        self.destroy()
        
    def generate_receipt(self):
        cotizacion_data_list = self.get_selected_cotizaciones()
        if not cotizacion_data_list:
            return
        
        self.generate_multiple_sale_image(cotizacion_data_list)
    
    def generate_multiple_quote(self):
        cotizacion_data_list = self.get_selected_cotizaciones()
        if not cotizacion_data_list:
            return
        
        self.generate_combined_quote_image(cotizacion_data_list)

    def edit_quote(self):
        selected_items = self.tree.selection()
        if len(selected_items) != 1:
            messagebox.showerror("Error", "Debes seleccionar una sola cotización para editar.")
            return

        cotizacion_data = self.get_selected_cotizaciones()[0]
        self.destroy()
        from calculator_window import CalculatorWindow
        calc_window = CalculatorWindow(self.parent, self.db, self.parent.vendedor_activo.get())
        calc_window.load_quote_for_editing(cotizacion_data)

    def delete_quote(self):
        selected_items = self.tree.selection()
        if not selected_items:
            messagebox.showerror("Error", "Debes seleccionar al menos una cotización para eliminar.")
            return

        confirm = messagebox.askyesno("Confirmar", f"¿Estás seguro de que quieres eliminar {len(selected_items)} cotización(es)?")
        if confirm:
            for item in selected_items:
                cotizacion_id = int(self.tree.item(item, "values")[0])
                cotizacion_data = next((c for c in self.cotizaciones if c["id"] == cotizacion_id), None)
                if cotizacion_data:
                    self.cotizaciones.remove(cotizacion_data)
                    self.tree.delete(item)
            self.db._save_data()
            messagebox.showinfo("Éxito", "Cotización(es) eliminada(s).")

    def generate_multiple_sale_image(self, data_list):
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
        
        draw.text((250, 100), "RookieMakers 3D", font=font_title, fill='black')
        
        y_pos = 220
        draw.text((50, y_pos), "RECIBO DE VENTA", font=font_title, fill='black')
        y_pos += 50
        draw.text((50, y_pos), f"Fecha: {datetime.date.today()}", font=font_body, fill='black')
        draw.text((450, y_pos), f"Vendedor: {data_list[0]['vendedor']}", font=font_body, fill='black')
        y_pos += 40
        draw.line([(50, y_pos), (750, y_pos)], fill='gray', width=2)
        y_pos += 20
        
        draw.text((50, y_pos), "Descripción", font=font_bold, fill='black')
        draw.text((250, y_pos), "Cantidad", font=font_bold, fill='black')
        draw.text((450, y_pos), "Tiempo (hrs)", font=font_bold, fill='black')
        draw.text((650, y_pos), "Costo Final", font=font_bold, fill='black')
        y_pos += 20
        draw.line([(50, y_pos), (750, y_pos)], fill='gray', width=1)
        y_pos += 10
        
        total_final = 0
        for item in data_list:
            draw.text((50, y_pos), item['descripcion'], font=font_body, fill='black')
            draw.text((250, y_pos), str(int(item['cantidad'])), font=font_body, fill='black')
            tiempo_horas = item['detalles']['tiempo_total'] / 60
            draw.text((450, y_pos), f"{tiempo_horas:.2f}", font=font_body, fill='black')
            draw.text((650, y_pos), f"${item['costo_final']:.2f}", font=font_body, fill='black')
            total_final += item['costo_final']
            y_pos += 30
        
        draw.line([(50, y_pos), (750, y_pos)], fill='gray', width=2)
        y_pos += 20
        
        draw.text((500, y_pos), "Total de Venta:", font=font_bold, fill='black')
        draw.text((650, y_pos), f"${total_final:.2f}", font=font_bold, fill='black')
        
        y_pos += 40
        draw.text((50, y_pos), "Términos de Garantía", font=font_header, fill='black')
        y_pos += 30
        terminos_venta = "Solo nos hacemos responsables durante 24 horas después de la entrega.\nDespués de este periodo, no se emitirán reembolsos ni se aceptarán devoluciones."
        draw.multiline_text((50, y_pos), terminos_venta, font=font_body, fill='black')
        
        y_pos += 80
        vendedor = next(v for v in self.db.get_vendedores() if v['nombre'] == data_list[0]['vendedor'])
        draw.text((50, y_pos), "Cuenta para Depósito:", font=font_bold, fill='black')
        draw.text((50, y_pos + 30), f"Banco: {vendedor['banco']} - Cuenta: {vendedor['cuenta']}", font=font_body, fill='black')

        filename = f"recibo_venta_{datetime.date.today().strftime('%Y%m%d')}.png"
        full_path = os.path.join(output_dir, filename)
        img.save(full_path)
        messagebox.showinfo("Recibo de Venta", f"Se ha generado el recibo de venta como imagen en:\n{full_path}")
        
    def generate_combined_quote_image(self, data_list):
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
        draw.text((50, y_pos), "COTIZACIÓN DE IMPRESIÓN 3D", font=font_title, fill='black')
        y_pos += 50
        draw.text((50, y_pos), f"Fecha: {datetime.date.today()}", font=font_body, fill='black')
        draw.text((450, y_pos), f"Vendedor: {data_list[0]['vendedor']}", font=font_body, fill='black')
        y_pos += 40
        draw.line([(50, y_pos), (750, y_pos)], fill='gray', width=2)
        y_pos += 20
        
        draw.text((50, y_pos), "Descripción", font=font_bold, fill='black')
        draw.text((250, y_pos), "Cantidad", font=font_bold, fill='black')
        draw.text((450, y_pos), "Tiempo (hrs)", font=font_bold, fill='black')
        draw.text((650, y_pos), "Costo Final", font=font_bold, fill='black')
        y_pos += 20
        draw.line([(50, y_pos), (750, y_pos)], fill='gray', width=1)
        y_pos += 10
        
        total_final = 0
        for item in data_list:
            draw.text((50, y_pos), item['descripcion'], font=font_body, fill='black')
            draw.text((250, y_pos), str(int(item['cantidad'])), font=font_body, fill='black')
            tiempo_horas = item['detalles']['tiempo_total'] / 60
            draw.text((450, y_pos), f"{tiempo_horas:.2f}", font=font_body, fill='black')
            draw.text((650, y_pos), f"${item['costo_final']:.2f}", font=font_body, fill='black')
            total_final += item['costo_final']
            y_pos += 30
        
        draw.line([(50, y_pos), (750, y_pos)], fill='gray', width=2)
        y_pos += 20
        
        draw.text((500, y_pos), "Total de Cotización:", font=font_bold, fill='black')
        draw.text((650, y_pos), f"${total_final:.2f}", font=font_bold, fill='black')
        
        y_pos += 40
        draw.text((50, y_pos), "Términos Generales", font=font_header, fill='black')
        y_pos += 30
        terminos = "Esta cotización tiene una validez de 3 días hábiles.\n\nEl tiempo de entrega es de 3 días hábiles a partir de la confirmación del pedido."
        draw.multiline_text((50, y_pos), terminos, font=font_body, fill='black')
        
        y_pos += 80
        vendedor = next(v for v in self.db.get_vendedores() if v['nombre'] == data_list[0]['vendedor'])
        draw.text((50, y_pos), "Cuenta para Depósito:", font=font_bold, fill='black')
        draw.text((50, y_pos + 30), f"Banco: {vendedor['banco']} - Cuenta: {vendedor['cuenta']}", font=font_body, fill='black')
        
        filename = f"cotizacion_multiple_{datetime.date.today().strftime('%Y%m%d')}.png"
        full_path = os.path.join(output_dir, filename)
        img.save(full_path)
        messagebox.showinfo("Cotización Múltiple", f"Se ha generado la cotización como imagen en:\n{full_path}")
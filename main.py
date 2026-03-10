import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from PIL import Image, ImageTk
import os
import json

# Importaciones de ventanas
from database_manager import Database
from calculator_window import CalculatorWindow
from service_quote_window import ServiceQuoteWindow
from client_form_window import ClientFormWindow 
from vendor_management_window import VendorManagementWindow
from product_list_window import ProductListWindow
from pending_quotes_window import PendingQuotesWindow

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Sistema de Gestión de Cotizaciones y Productos")
        self.geometry("800x600")
        
        # Estilos para el tema de color
        self.style = ttk.Style(self)
        self.style.theme_use('clam')
        self.style.configure('TButton', font=('Helvetica', 12, 'bold'), padding=10, background='#4a90e2', foreground='white')
        self.style.map('TButton', background=[('active', '#357bd9')])
        self.style.configure('TLabel', font=('Helvetica', 12))
        self.style.configure('TFrame', background='#f0f0f0')
        self.style.configure('TLabelframe', background='#f0f0f0')
        
        self.db = Database()
        self.vendedores = self.db.get_vendedores()
        self.vendedor_activo = tk.StringVar(self)
        
        self.setup_image_paths()
        self.create_main_menu()

    def setup_image_paths(self):
        if os.path.exists("config.json"):
            with open("config.json", "r") as f:
                config = json.load(f)
                self.logo_path = config.get('logo_path')
                self.image_path = config.get('image_path')
        else:
            self.logo_path = None
            self.image_path = None

        if not self.logo_path or not os.path.exists(self.logo_path):
            messagebox.showinfo("Configuración", "Por favor, selecciona el archivo de tu logo (formato .jpg o .png).")
            self.logo_path = filedialog.askopenfilename(filetypes=[("Image files", "*.jpg *.png")])
            if not self.logo_path:
                messagebox.showerror("Error", "Debes seleccionar un logo para continuar.")
                self.destroy()
                return

        if not self.image_path or not os.path.exists(self.image_path):
            messagebox.showinfo("Configuración", "Por favor, selecciona la carpeta donde se guardarán las cotizaciones y ventas.")
            self.image_path = filedialog.askdirectory()
            if not self.image_path:
                messagebox.showerror("Error", "Debes seleccionar una carpeta para continuar.")
                self.destroy()
                return

        config = {"logo_path": self.logo_path, "image_path": self.image_path}
        with open("config.json", "w") as f:
            json.dump(config, f)

        try:
            logo_img = Image.open(self.logo_path)
            logo_img = logo_img.resize((150, 150), Image.LANCZOS)
            self.logo_tk = ImageTk.PhotoImage(logo_img)
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo cargar el logo: {e}")
            self.logo_tk = None

    def create_main_menu(self):
        main_frame = ttk.Frame(self, padding="20", style='TFrame')
        main_frame.pack(fill=tk.BOTH, expand=True)

        logo_label = ttk.Label(main_frame, image=self.logo_tk)
        logo_label.pack(pady=10)

        title_label = ttk.Label(main_frame, text="Menú Principal", font=("Helvetica", 24, "bold"), foreground='#003366', style='TLabel')
        title_label.pack(pady=10)

        vendor_frame = ttk.Frame(main_frame)
        vendor_frame.pack(pady=10)
        ttk.Label(vendor_frame, text="Vendedor Activo:").pack(side=tk.LEFT, padx=5)
        vendedor_options = [v['nombre'] for v in self.vendedores]
        self.vendedor_activo.set(vendedor_options[0])
        vendedor_menu = ttk.Combobox(vendor_frame, textvariable=self.vendedor_activo, values=vendedor_options, state="readonly")
        vendedor_menu.pack(side=tk.LEFT)
        vendedor_menu.set(self.vendedor_activo.get())
        
        buttons_frame = ttk.Frame(main_frame)
        buttons_frame.pack(pady=20)
        
        ttk.Button(buttons_frame, text="Calcular Impresión y Cotizar", command=self.open_calculator).pack(pady=10, ipadx=20)
        ttk.Button(buttons_frame, text="Cotización de Servicio", command=self.open_service_quote).pack(pady=10, ipadx=20)
        ttk.Button(buttons_frame, text="Ver Cotizaciones en Espera", command=self.open_pending_quotes).pack(pady=10, ipadx=20)
        ttk.Button(buttons_frame, text="Ver Productos Autorizados", command=self.open_product_list).pack(pady=10, ipadx=20)
        
        # Nuevo botón "Crear" con submenú
        self.create_button_menu = ttk.Menubutton(buttons_frame, text="Crear", style='TButton')
        self.create_button_menu.pack(pady=10, ipadx=20)
        
        self.create_menu = tk.Menu(self.create_button_menu, tearoff=0)
        self.create_button_menu["menu"] = self.create_menu
        
        self.create_menu.add_command(label="Perfil de Cliente", command=self.open_client_form)
        self.create_menu.add_command(label="Perfil de Vendedor", command=self.open_vendor_management)


    def open_calculator(self):
        vendedor = self.vendedor_activo.get()
        if not vendedor:
            messagebox.showerror("Error", "Por favor, selecciona un vendedor primero.")
            return
        CalculatorWindow(self, self.db, vendedor)
        
    def open_service_quote(self):
        vendedor = self.vendedor_activo.get()
        if not vendedor:
            messagebox.showerror("Error", "Por favor, selecciona un vendedor primero.")
            return
        ServiceQuoteWindow(self, self.db, vendedor)

    def open_client_form(self):
        ClientFormWindow(self, self.db)

    def open_vendor_management(self):
        VendorManagementWindow(self, self.db)
    
    def open_product_list(self):
        ProductListWindow(self, self.db)

    def open_pending_quotes(self):
        PendingQuotesWindow(self, self.db)

if __name__ == "__main__":
    app = App()
    app.mainloop()
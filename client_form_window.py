import tkinter as tk
from tkinter import ttk, messagebox
import json
import os

class ClientFormWindow(tk.Toplevel):
    def __init__(self, parent, db):
        super().__init__(parent)
        self.title("Crear Perfil de Cliente")
        self.geometry("600x400")
        self.db = db
        self.parent = parent
        self.create_widgets()
        
    def create_widgets(self):
        main_frame = ttk.Frame(self, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)

        ttk.Label(main_frame, text="Formulario de Cliente", font=("Helvetica", 16, "bold")).pack(pady=10)

        self.vars = {
            "nombre": tk.StringVar(), 
            "correo": tk.StringVar(), 
            "telefono": tk.StringVar(), 
            "direccion": tk.StringVar()
        }

        labels_and_vars = [
            ("Nombre:", "nombre"), 
            ("Correo:", "correo"), 
            ("Teléfono:", "telefono"), 
            ("Dirección:", "direccion")
        ]

        for i, (label_text, var_name) in enumerate(labels_and_vars):
            ttk.Label(main_frame, text=label_text).pack(pady=(5,0))
            ttk.Entry(main_frame, textvariable=self.vars[var_name], width=50).pack()

        ttk.Button(main_frame, text="Guardar Cliente", command=self.save_client, style='Green.TButton').pack(pady=20)

    def save_client(self):
        cliente_data = {var_name: self.vars[var_name].get() for var_name in self.vars}
        
        if not cliente_data["nombre"] or not cliente_data["correo"]:
            messagebox.showerror("Error", "El nombre y correo del cliente son obligatorios.")
            return

        self.db.add_cliente(cliente_data)
        messagebox.showinfo("Éxito", "Cliente guardado correctamente.")
        self.destroy()
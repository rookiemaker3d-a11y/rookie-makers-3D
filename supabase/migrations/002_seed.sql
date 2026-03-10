-- Seed: vendedores and servicios
-- Create admin user manually in Supabase Auth, then run the INSERT for users_roles (replace USER_UUID with the auth.users id).

insert into public.vendedores (nombre, correo, telefono, banco, cuenta) values
  ('Daniel Moreno Rodriguez', 'rookiemaker3d@gmail.com', '479-100-09-52', 'BBVA BANCOMER', '1575249892'),
  ('Emanuel Fidel Ramirez Alamillo', 'rookiemakersd@gmail.com', '477-595-85-27', 'Nu', '638180000157451360'),
  ('Norberto Charbel Moreno Rodriguez', 'norbertomoro4@gmail.com', '472-148-89-13', 'Mercado Pago', 'W722969010092073360')
on conflict (correo) do nothing;

insert into public.servicios (nombre, tarifa_fija, tarifa_por_hora) values
  ('Mantenimiento e Implementación', 250, 50),
  ('Desarrollo de proyectos', 250, 50);

-- After creating the first admin user in Supabase Auth (Authentication -> Users -> Add user),
-- run this with the real user id (replace YOUR_ADMIN_USER_UUID):
-- insert into public.users_roles (user_id, role) values ('YOUR_ADMIN_USER_UUID', 'administrador');

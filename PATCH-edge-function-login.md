# Parche Edge Function: distrito-api/login

## Problema
Cuando un usuario es bloqueado desde el panel admin, el endpoint `/login` devuelve
el mismo error genérico "Correo o contrasena incorrectos" que cuando la contraseña 
es incorrecta. El frontend no puede distinguir entre ambos casos.

## Solución
Agregar una verificación del campo `status` en la tabla `profiles` DESPUÉS de que
Supabase Auth autentique exitosamente. Si el status es "Bloqueado" o "Inactivo",
devolver un error específico con el campo `blocked: true`.

## Código a agregar en el handler de `/login` (después de la autenticación exitosa)

Busca la parte donde el Edge Function devuelve el token y el usuario después del 
login exitoso, y agrega esta verificación ANTES de devolver la respuesta:

```typescript
// === AGREGAR DESPUÉS de la autenticación exitosa ===
// Después de obtener el user de Supabase Auth, verificar status en profiles:

const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('status')
  .eq('id', user.id)
  .single();

if (profile && (profile.status === 'Bloqueado' || profile.status === 'Inactivo')) {
  return new Response(
    JSON.stringify({ 
      error: 'Tu cuenta ha sido bloqueada por un administrador.',
      blocked: true,
      status: profile.status 
    }),
    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

## También agregar una ruta nueva para verificación de estado (opcional pero recomendado)

Agregar esta ruta en el handler del Edge Function para que el frontend pueda 
verificar el estado del usuario SIN necesitar autenticación:

```typescript
// === NUEVA RUTA: /check-user-status ===
if (path === '/check-user-status' && method === 'POST') {
  const { email } = await req.json();
  
  // Buscar el usuario por email en profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('status, email')
    .eq('email', email)
    .single();
  
  if (!profile) {
    return new Response(
      JSON.stringify({ exists: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  return new Response(
    JSON.stringify({ 
      exists: true, 
      blocked: profile.status === 'Bloqueado' || profile.status === 'Inactivo',
      status: profile.status 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

## Después de deployar el parche del Edge Function

El frontend ya tiene la lógica para detectar:
- `status === "Bloqueado"` o `status === "Inactivo"` en la respuesta del API
- Palabras clave "bloqueado", "blocked", "inactivo", "inactive" en mensajes de error
- El campo `blocked: true` en la respuesta (nuevo)

Una vez que el Edge Function esté actualizado, el login de usuarios bloqueados 
mostrará automáticamente el modal de "CUENTA BLOQUEADA" en lugar del toast genérico.

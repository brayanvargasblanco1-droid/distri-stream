# Supabase - Distrito Streaming

Este directorio versiona la configuracion, las migraciones y las edge functions
de Supabase del proyecto Distrito Streaming.

## Contenido

| Ruta | Descripcion |
|---|---|
| `config.toml` | Configuracion del proyecto para el CLI de Supabase |
| `migrations/20260901000000_initial_schema.sql` | Esquema inicial: profiles, products, inventory, orders, reports, topups, ads, settings |
| `functions/distrito-api/index.ts` | Edge function principal (esqueleto generico; la API completa vive en el dashboard |
| `setup-secrets.sh` | Script que configura los 3 secretos de Supabase desde variables de entorno |

## Secretos necesarios

El CLI de Supabase exige un access token para cualquier operacion:
`Access token not provided. Supply an access token by running supabase login o setting the SUPABASE_ACCESS_TOKEN environment variable.`

Configura estos 3 secretos como variables de entorno ( nunca los pegues en el chat ni en el repo):

| Variable | De donde se obtiene | Formato |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | Supabase Dashboard > Account Settings > Access Tokens | `sbp_...` |
| `SUPABASE_DB_PASSWORD` | Supabase Dashboard > Project Settings > Database (password del rol `postgres` | texto |
| `SUPABASE_PROJECT_ID` | La URL del API del proyecto: `https://tavfcrekyxnwrohsmncx.supabase.co` | `tavfcrekyxnwrohsmncx` |

### Uso del script

```bash
export SUPABASE_ACCESS_TOKEN=sbp_tu_token
export SUPABASE_DB_PASSWORD=tu_password
export SUPABASE_PROJECT_ID=tavfcrekyxnwrohsmncx
./supabase/setup-secrets.sh
```

El script valida el formato, vincula el proyecto (link),, aplica las
migraciones ( `db push`) y setea los secretos de la edge function. Si algo
falla, muestra un error claro sin imprimir valores secretos.**

> El token de Supabase se genera solour una vez y empieza por `sbp_`.
> Si no lo tienes a mano, crea uno nuevo en
> **Dashboard de Supabase > Account Settings > Access Tokens > Generate new token**.

## Stack

- **Frontend:** SPA vanilla JS (index.html) desplegada en Vercel
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions)
- **Deploy:** GitHub -> Vercel (main -> produccion)
- **Produccion:** https://distrito-streaming-vercel-ashen.vercel.app

## Como aplicar las migraciones

Requisitos: [Supabase CLI](https://supabase.com/docs/guides/cli) instalado.

```bash
# 1) Vincular el proyecto remoto (project ref: tavfcrekyxnwrohsmncx)
supabase link --project-ref tavfcrekyxnwrohsmncx

# 2) Aplicar las migraciones pendientes al remoto
supabase db push

# 3) (Opcional) Levantar el stack localmente
supabase start
```

> Advertencia: las migraciones crean las tablas con `if not exists` y son
> idempotentes. Antes de aplicarlas a un proyecto con datos existentes,
> haz un backup o revisa los nombres de tabla ya creados en el dashboard.

## Como deployar la edge function

```bash
supabase functions deploy distrito-api --project-ref tavfcrekyxnwrohsmncx
supabase secrets set SUPABASE_URL=https://tavfcrekyxnwrohsmncx.supabase.co --project-ref tavfcrekyxnwrohsmncx
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key --project-ref tavfcrekyxnwrohsmncx
```

La edge function versionada aqui es un **esqueleto generico** que lista tablas
(products, inventory, orders, reports, topups, ads, settings, profiles)
con autenticacion por token y CORS. La API real del negocio (register, login,
bootstrap, buy, check-user-status y CRUD completo) vive actualmente en el
dashboard de Supabase; para versionarla, pega su contenido en
`functions/distrito-api/index.ts` y subelo con el CLI..

## Endpoints que consume el frontend

Fuente: `index.html` (buscar `api("...")`).

| Ruta | Metodos |
|---|---|
| `register` | POST |
| `login` | POST |
| `check-user-status` | POST |
| `bootstrap` | POST, GET |
| `buy` | POST |
| `products` | GET, POST, PATCH, DELETE |
| `inventory` | GET, POST, PATCH, DELETE |
| `inventory/:id` | PATCH, DELETE |
| `users` | GET, POST, PATCH, DELETE |
| `users/:id` | PATCH, DELETE |
| `reports` | GET, POST, PATCH, DELETE |
| `topups` | GET, POST, PATCH, DELETE |
| `ads` | GET, POST, PATCH, DELETE |
| `settings` | GET, PUT, PATCH |

## Notas

- El proyecto remoto usa Auth de Supabase (tabla `auth.users`; el perfil se
  guarda en `public.profiles` ligado por `id`..
- El frontend envia el token en la cabecera `x-distrito-session`..
- Las politicas RLS son basicas; la gestion real la hace el edge function
  con `service_role` (excluido de RLS por defecto)..
- La URL del API en `index.html`:
  `https://tavfcrekyxnwrohsmncx.supabase.co/functions/v1/distrito-api`
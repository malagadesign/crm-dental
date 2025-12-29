# Convertir .env de Laravel a Next.js/Prisma

## 🔄 Conversión

### Formato Laravel (lo que tienes):
```env
DB_HOST=127.0.0.1
DB_PORT=8889
DB_DATABASE=crm_dental
DB_USERNAME=root
DB_PASSWORD=root
```

### Formato Prisma/Next.js (lo que necesitas):
```env
DATABASE_URL="mysql://root:root@127.0.0.1:8889/crm_dental"
```

## 📝 Fórmula

```
DATABASE_URL="mysql://[USERNAME]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]"
```

Con tus valores:
```
DATABASE_URL="mysql://root:root@127.0.0.1:8889/crm_dental"
```

## ✅ Tu archivo .env completo debería ser:

```env
# Database (convertido de Laravel)
DATABASE_URL="mysql://root:root@127.0.0.1:8889/crm_dental"

# NextAuth
NEXTAUTH_SECRET="genera-con-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

## 🔧 Generar NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Copia el resultado y pégalo como `NEXTAUTH_SECRET`.

## 📋 Checklist

- [ ] Crear `.env` en `nextjs-crm/`
- [ ] Agregar `DATABASE_URL` con tus datos de Laravel
- [ ] Generar y agregar `NEXTAUTH_SECRET`
- [ ] Agregar `NEXTAUTH_URL`

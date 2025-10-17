# 🔐 Configuración de Seguridad - LucidSpeak

## ✅ Mejoras de Seguridad Implementadas

### 1. **Rate Limiting** ✅ COMPLETADO
- **Login**: Máximo 10 intentos por minuto por IP
- **Registro**: Máximo 5 registros por minuto por IP
- **Uploads de audio**: Máximo 30 por minuto por IP
- **Tecnología**: slowapi (ya incluida en requirements.txt)

### 2. **Validación de Archivos de Audio** ✅ COMPLETADO
- Tipos MIME permitidos: webm, wav, mp3, ogg, m4a
- Tamaño máximo: 50 MB
- Duración máxima: 10 minutos
- Protección contra path traversal
- Nombres de archivo sanitizados automáticamente

### 3. **Sanitización de Inputs** ✅ COMPLETADO
- Emails validados con regex
- HTML escapado para prevenir XSS
- Caracteres de control eliminados
- Límites de longitud aplicados

### 4. **JWT Mejorado** ✅ COMPLETADO
- Expiración reducida de 30 días a 7 días
- Mejor balance entre seguridad y UX

---

## ⚠️ PENDIENTES - Requieren Acción del Usuario

### 5. **Google reCAPTCHA v3** 🔴 PENDIENTE

**¿Por qué?** Prevenir bots automáticos en registro/login

**Pasos:**

1. **Ir a**: https://www.google.com/recaptcha/admin/create

2. **Configurar**:
   - **Label**: LucidSpeak
   - **reCAPTCHA type**: Marcar "reCAPTCHA v3"
   - **Domains**: Agregar:
     - `lucid-speak-ai.vercel.app`
     - `localhost` (para desarrollo)

3. **Copiar las keys**:
   - **Site Key** (pública)
   - **Secret Key** (privada)

4. **Agregar variables de entorno**:

   **En Vercel (Frontend)**:
   ```
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=tu_site_key_aqui
   ```

   **En Render (Backend)**:
   ```
   RECAPTCHA_SECRET_KEY=tu_secret_key_aqui
   ```

5. **Avisar al desarrollador** cuando tengas las keys para implementar la integración

---

### 6. **Verificación de Email** 🟡 OPCIONAL (Muy recomendado)

**¿Por qué?** Prevenir cuentas falsas y spam

**Opción A: Resend (Recomendado)**

1. **Crear cuenta**: https://resend.com/signup
2. **Verificar dominio** (opcional - puede usar `onboarding@resend.dev` para testing)
3. **Obtener API Key**: Dashboard → API Keys → Create
4. **Agregar a Render**:
   ```
   RESEND_API_KEY=re_tu_api_key_aqui
   ```
5. **Límite gratis**: 3,000 emails/mes (suficiente para empezar)

**Opción B: SendGrid**
- Similar a Resend
- 100 emails/día gratis
- https://sendgrid.com

**Opción C: Usar Supabase Auth**
- Supabase tiene verificación de email integrada
- Requiere migrar sistema de auth actual
- Más trabajo pero más robusto

---

### 7. **Keep-Alive 24/7** 🟡 OPCIONAL

**¿Por qué?** El backend en Render se duerme después de 15 minutos de inactividad (tier gratis)

**Opción A: UptimeRobot (Más fácil - Recomendado)**

1. **Crear cuenta**: https://uptimerobot.com
2. **Add New Monitor**:
   - Monitor Type: HTTP(s)
   - URL: `https://lucidspeakai-backend.onrender.com/health`
   - Monitoring Interval: 5 minutes
   - Friendly Name: LucidSpeak Backend
3. **Crear monitor** - ¡Listo!

**Opción B: Cron-job.org**

1. **Crear cuenta**: https://cron-job.org
2. **Create cronjob**:
   - URL: `https://lucidspeakai-backend.onrender.com/health`
   - Interval: Every 10 minutes
   - Title: LucidSpeak Keep-Alive

**Opción C: Upgrade a Render Paid ($7/mes)**
- No se duerme nunca
- Más recursos
- Mejor rendimiento

---

## 📊 Nivel de Seguridad Actual

### Protegido Contra:
- ✅ **SQL Injection** (Supabase con queries parametrizadas)
- ✅ **XSS** (Input sanitization implementada)
- ✅ **Brute Force** (Rate limiting en login/register)
- ✅ **File Upload Attacks** (Validación estricta)
- ✅ **Path Traversal** (Nombres de archivo sanitizados)
- ✅ **Session Hijacking** (JWT con expiración corta)

### Aún Vulnerable (Hasta que implementes):
- ⚠️ **Bots** (Sin CAPTCHA)
- ⚠️ **Cuentas Falsas** (Sin verificación de email)
- ⚠️ **CSRF** (Podría mejorarse con tokens CSRF)

---

## 🎯 Prioridad de Implementación

### Crítico (Hacer YA):
1. ✅ Rate limiting
2. ✅ Validación de archivos
3. ✅ Sanitización de inputs

### Importante (Esta semana):
4. 🔴 **Google reCAPTCHA** ← EMPIEZA POR AQUÍ
5. 🟡 **UptimeRobot** (5 minutos de setup)

### Nice to Have (Próximo mes):
6. 🟡 Verificación de email
7. ⚪ 2FA (Two-Factor Authentication)
8. ⚪ Logging de eventos de seguridad

---

## 💰 Costos

| Servicio | Gratis | Límite |
|----------|--------|--------|
| slowapi (Rate Limiting) | ✅ Sí | Ilimitado |
| Validación de archivos | ✅ Sí | Ilimitado |
| Google reCAPTCHA v3 | ✅ Sí | 1M requests/mes |
| UptimeRobot | ✅ Sí | 50 monitors |
| Resend | ✅ Sí | 3,000 emails/mes |

**Total: $0/mes** 🎉

---

## 📝 Checklist de Seguridad

- [x] Rate limiting implementado
- [x] Validación de archivos implementada
- [x] Inputs sanitizados
- [x] JWT con expiración corta
- [ ] reCAPTCHA configurado
- [ ] Keep-alive configurado (UptimeRobot)
- [ ] Verificación de email (opcional)
- [ ] Logs de seguridad (futuro)
- [ ] 2FA (futuro)

---

## 🆘 Ayuda

Si tienes dudas sobre alguna configuración, pregúntame y te guío paso a paso.

**Siguiente paso**: Configurar reCAPTCHA (5 minutos) → https://www.google.com/recaptcha/admin/create

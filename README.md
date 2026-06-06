# KoaStore | Plataforma de Distribución Digital SEO-Optimized 🎮

## Descripción del Proyecto

KoaStore es una aplicación Full-Stack desarrollada para unificar la catalogación y venta de paquetes de juegos digitales multiplataforma (PlayStation 4, PlayStation 5, Nintendo Switch). La plataforma resuelve la fragmentación del inventario mediante una interfaz centralizada, diseñada para captar tráfico orgánico (SEO) y redirigir eficientemente a los clientes hacia un embudo de conversión estructurado.

---

## 🛠️ Stack Tecnológico

* **Frontend & Core:** Next.js (App Router), React, Tailwind CSS.
* **Backend (Serverless):** Node.js, Next.js API Routes.
* **Base de Datos & Auth:** Firebase.
* **Seguridad & Administración:** Firebase Admin SDK.

---

## 🚀 Desafíos Técnicos y Arquitectura (Engineering Insights)

### 1. Enrutamiento Dinámico y SSR para SEO
El proyecto aprovecha al máximo el paradigma de Server-Side Rendering (SSR) de Next.js para asegurar que los motores de búsqueda puedan indexar el catálogo de juegos. Se implementaron rutas dinámicas para segmentar el inventario de manera escalable (juegos individuales, paquetes y experiencias).

### 2. Panel Administrativo Securizado
Se desarrolló un panel de administración restringido (`/admin`) utilizando **Firebase Admin SDK**. Esto permite la gestión centralizada del catálogo y el inventario, validando las credenciales a nivel de servidor (backend) y garantizando que solo el personal autorizado pueda modificar los productos.

### 3. API REST Interna
El sistema no solo consume datos, sino que expone su propia API (`/api/games/[id]`) manejando de forma eficiente la recuperación de datos específicos de cada título sin sobrecargar el cliente, mejorando los tiempos de carga y la experiencia de usuario.

---

## 🏗️ Estructura del Proyecto

```bash
/app                  # Enrutamiento principal (Next.js App Router)
  /admin              # Panel administrativo protegido (Firebase Admin)
  /api/games/[id]     # Endpoints de la API REST interna
  /contacto           # Interfaz de atención al cliente
  /experiencias       # Catálogo por tipo de experiencia
  /individuales       # Catálogo de juegos individuales
  /packs              # Catálogo de paquetes digitales
/components           # Componentes UI reutilizables
/lib                  # Utilidades y configuración de servicios (Firebase)
/public               # Assets y multimedia de la marca
```

## 📝 Roadmap & Features
[x] Enrutamiento dinámico y optimización SEO.

[x] Implementación de API RESTful interna.

[x] Panel administrativo asegurado con Firebase Admin.

[ ] Optimización del funnel de conversión desde Meta Ads.

## 👨‍💻 Autor
Jorge Diaz
Full-Stack Software Engineer
Especializado en Arquitectura de Software, Next.js y E-commerce Digital.

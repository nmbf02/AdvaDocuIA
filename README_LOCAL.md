# ADVANSYS Document Generator - Guía de Ejecución Local

Esta aplicación está completamente construida en **React + Node.js (Express) + TypeScript + Tailwind CSS** y utiliza el SDK oficial `@google/genai` de Google Gemini para todas las funciones de inteligencia artificial (generación y calibración de propuestas, análisis de documentos base, diapositivas ejecutivas y documentación técnica interna).

---

## 🚀 Requisitos Previos

1. **Node.js**: Versión 18.x o superior instalada (recomendado Node.js 20+ LTS).
   - Descarga gratuita: [https://nodejs.org/](https://nodejs.org/)
2. **API Key de Gemini (Gratuita o de Pago)**:
   - Puedes obtener tu clave en 1 minuto en Google AI Studio: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

---

## 📦 Paso a Paso para Correr en Local (Windows, Mac o Linux)

### 1. Clonar o descargar el código
Descarga todos los archivos del proyecto en una carpeta de tu computadora.

### 2. Instalar dependencias
Abre tu terminal (PowerShell, CMD, Bash o Terminal de VS Code) en la carpeta raíz del proyecto y ejecuta:

```bash
npm install
```

### 3. Configurar tu Clave de API de Gemini
Crea un archivo llamado `.env` en la raíz del proyecto (junto al `package.json`):

```env
GEMINI_API_KEY=tu_clave_de_gemini_aqui
PORT=3000
```

> **Nota:** Reemplaza `tu_clave_de_gemini_aqui` por tu API Key real de Google Gemini. La aplicación la leerá automáticamente en el backend Node.js y la mantendrá segura sin exponerla al navegador.

### 4. Iniciar la aplicación
Ejecuta el comando de desarrollo:

```bash
npm run dev
```

### 5. Abrir en tu Navegador
Abre tu navegador web y entra a:
👉 **`http://localhost:3000`**

---

## 🛠️ ¿Cómo funciona la IA en Local?

- **Servidor Express Local (`server.ts`)**: El servidor se encarga de recibir las solicitudes de la interfaz (`/api/generate-proposal`, `/api/refine-proposal`, `/api/generate-slides`, `/api/generate-technical-doc`, `/api/analyze-source-document`), conectar con los modelos `gemini-3.6-flash` / `gemini-3.7-flash` usando tu API Key local y devolver los datos en formato estructurado JSON.
- **Exportación Word/PDF/PowerPoint**: Se realiza en tu propio equipo sin enviar documentos a ningún servidor de terceros.
- **Almacenamiento e Historial**: Guarda todo en tu navegador (`localStorage`) y cuenta con el botón **"Copia de Seguridad (.json)"** para respaldar y restaurar todos tus documentos en cualquier momento.

---

## 📦 Compilación para Producción (Opcional)

Si deseas compilar la aplicación para un despliegue optimizado en tu red o servidor interno:

```bash
# 1. Compilar frontend y servidor
npm run build

# 2. Iniciar en modo producción
npm start
```

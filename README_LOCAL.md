# ADVANSYS Document Generator - Guía de Ejecución Local

Esta aplicación está construida en **React + Node.js (Express) + TypeScript + Tailwind CSS**. La generación con IA admite Gemini, Claude, OpenAI, Groq y OpenRouter.

---

## 🚀 Requisitos Previos

1. **Node.js**: Versión 18.x o superior instalada (recomendado Node.js 20+ LTS).
   - Descarga gratuita: [https://nodejs.org/](https://nodejs.org/)
2. **API Key** de al menos un motor (Gemini, Claude, OpenAI, Groq u OpenRouter):
   - Gemini: [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Claude: [Anthropic Console](https://console.anthropic.com) (clave API; no sirve el login de claude.ai)
   - OpenAI: [platform.openai.com](https://platform.openai.com/api-keys)
   - Groq: [console.groq.com](https://console.groq.com)
   - OpenRouter: [openrouter.ai](https://openrouter.ai)

---

## 📦 Paso a Paso para Correr en Local (Windows, Mac o Linux)

### 1. Clonar o descargar el código
Descarga todos los archivos del proyecto en una carpeta de tu computadora.

### 2. Instalar dependencias
Abre tu terminal (PowerShell, CMD, Bash o Terminal de VS Code) en la carpeta raíz del proyecto y ejecuta:

```bash
npm install
```

### 3. Configurar motores de IA
Crea un archivo `.env` en la raíz, o usa **Ajustes → Motores IA**:

```env
AI_PROVIDER=auto
AI_FALLBACK_PROVIDERS=gemini,claude
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=
PORT=3000
```

Las claves de Ajustes se guardan en `.ai-secrets.json` (no va a git). Si el motor principal falla, se usa el respaldo.

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

- **Servidor Express Local (`server.ts`)**: Recibe las solicitudes de la interfaz y las envía al motor configurado (Gemini, Claude, OpenAI, Groq u OpenRouter), con respaldo automático si el principal falla.
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

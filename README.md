# Proyecto Express App
Para crearlo desde cero fue
npm init -y
npm install express mongoose dotenv cors jsonwebtoken bcryptjs body-parser
npm install --save-dev nodemon
Crear archivo .env en la raiz con:
PORT=5000
NODE_ENV=development
HOST=0.0.0.0

# Base de datos
MONGO_URI=mongodb://localhost:27017/gestion_productos

# JWT
JWT_SECRET=mi_secreto_super_seguro
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=mi_secreto
JWT_REFRESH_EXPIRE=30d

# Frontend URL
FRONTEND_URL=http://localhost:3000

Agregar script en package.json para correr el servidor:
"scripts": {
  "start": "node src/app.js",
  "dev": "nodemon src/app.js"
}

Para ejecutar el proyecto
npm run dev
---

## Requisitos previos

- [Node.js]
- [npm] 
- [MongoDB compass] 
- [Git] 

---

## Instalación del proyecto

1. **Clonar el repositorio**

```bash
git clone https://github.com/LaSintaxis/express_app.git
cd express_app

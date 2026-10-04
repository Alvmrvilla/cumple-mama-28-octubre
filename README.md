# Invitación de cumpleaños de mamá — versión online

Esta versión usa Render Web Service + Render Postgres para guardar las confirmaciones.

Archivos:
- index.html
- style.css
- server.js
- package.json

Variables que debes configurar en Render:
- DATABASE_URL: la Internal Database URL de tu base Postgres
- ADMIN_KEY: una contraseña privada para el panel

Panel:
`https://TU-DOMINIO.onrender.com/admin?key=TU_ADMIN_KEY`

Nota: el Postgres gratuito de Render tiene una duración limitada (actualmente 30 días). Para una celebración del 28 de octubre es suficiente si se crea a inicios de octubre, pero para conservar los datos después del vencimiento hay que actualizar la base a un plan de pago o migrarla.

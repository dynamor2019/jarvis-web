@echo off
cd /d c:\Jarvis\jarvis-web
set PORT=3010
set HOSTNAME=0.0.0.0
set NODE_ENV=production
set DATABASE_URL=file:C:/Jarvis/jarvis-web/prisma/jarvis.db
node .next_build/standalone/server.js

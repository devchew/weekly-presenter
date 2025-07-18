@echo off
echo Starting Team Scheduler in production mode...

set NODE_ENV=production
set DATABASE_PATH=./data/database.sqlite
set PORT=3001

echo Building application...
call npm run build

echo Starting server...
node server/index.js

pause

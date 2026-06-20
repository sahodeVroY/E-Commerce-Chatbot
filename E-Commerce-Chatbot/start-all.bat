@echo off
REM Start backend
start cmd /k "cd backend && npm start"
REM Start frontend
start cmd /k "cd frontend && npm start" 
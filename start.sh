#!/bin/bash
cd /home/farry/hospital-system
pkill -9 -f "uvicorn main:app" 2>/dev/null
sleep 1
exec python3 -m uvicorn main:app --host 0.0.0.0 --port 8000

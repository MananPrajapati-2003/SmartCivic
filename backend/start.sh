#!/bin/bash
cd "$(dirname "$0")"
echo "Running migrations..."
python manage.py migrate
echo ""
echo "Starting Django server on port 8000..."
python manage.py runserver 0.0.0.0:8000

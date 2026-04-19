@echo off
d:\smart_civic_project\SmartCivic\backend\venv\Scripts\python.exe d:\smart_civic_project\SmartCivic\backend\manage.py migrate > d:\smart_civic_project\SmartCivic\backend\migrate_output.txt 2>&1
echo Exit code: %ERRORLEVEL% >> d:\smart_civic_project\SmartCivic\backend\migrate_output.txt

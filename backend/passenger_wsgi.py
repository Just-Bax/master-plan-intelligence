"""
Passenger WSGI entry point for cPanel deployment.

FastAPI is ASGI; Passenger expects WSGI. This file exposes the app as WSGI
via a2wsgi.ASGIMiddleware so Passenger can run it.

In cPanel "Create Application":
  - Application root: master-plan-intelligence/backend  (or path to this folder)
  - Application startup file: passenger_wsgi.py
  - Application entry point: application
  - Add all env vars in "Переменные окружения" (see .env.example).
"""

import os
import sys

# Ensure the backend directory is on the path (application root)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from a2wsgi import ASGIMiddleware
from app.main import app

# Passenger looks for this name by default
application = ASGIMiddleware(app)

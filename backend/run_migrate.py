#!/usr/bin/env python3
"""
Run Alembic migrations (upgrade to head).
Use from cPanel: "Execute python script" -> path to this file, e.g. run_migrate.py
Or via SSH: cd repositories/master-plan-intelligence/backend && python run_migrate.py
"""
import os
import subprocess
import sys

def main() -> None:
    # Run from this script's directory so alembic.ini is found
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)
    code = subprocess.call(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=backend_dir,
    )
    sys.exit(code)

if __name__ == "__main__":
    main()

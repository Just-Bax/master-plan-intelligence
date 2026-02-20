#!/usr/bin/env python3
"""
Run Alembic migrations (upgrade to head).
Use from cPanel: "Execute python script" -> path to this file, e.g.:
  run_migrate.py
or full path:
  repositories/master-plan-intelligence/backend/run_migrate.py
Do NOT enter "alembic" — that is a package, not a script.
"""
import os
import sys

def main() -> None:
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)
    sys.path.insert(0, backend_dir)

    from alembic.config import Config
    from alembic import command

    alembic_ini = os.path.join(backend_dir, "alembic.ini")
    if not os.path.isfile(alembic_ini):
        print("alembic.ini not found in", backend_dir, file=sys.stderr)
        sys.exit(1)
    cfg = Config(alembic_ini)
    command.upgrade(cfg, "head")

if __name__ == "__main__":
    main()

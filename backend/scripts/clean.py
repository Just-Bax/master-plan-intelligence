import shutil
from pathlib import Path


def main():
    cleaned_count = 0
    # Collect all paths first to avoid issues during iteration
    pycache_dirs = list(Path(".").rglob("__pycache__"))
    pyc_files = list(Path(".").rglob("*.pyc"))

    for path in pycache_dirs:
        if path.exists() and path.is_dir():
            shutil.rmtree(path, ignore_errors=True)
            cleaned_count += 1

    for path in pyc_files:
        if path.exists():
            path.unlink(missing_ok=True)
            cleaned_count += 1

    print(f"Cache cleaned. Removed {cleaned_count} items.")


if __name__ == "__main__":
    main()

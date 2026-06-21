import os
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
venv_python = PROJECT_ROOT / '.venv' / 'Scripts' / 'python.exe'
PYTHON = venv_python if venv_python.exists() else Path(sys.executable)

def main():
    env = os.environ.copy()
    env['PYTHONPATH'] = str(PROJECT_ROOT)
    # Prefer venv python if it has uvicorn installed; otherwise fall back to system python
    # If a venv python exists, prefer it only if it has uvicorn installed
    if venv_python.exists():
        try:
            subprocess.run([str(venv_python), '-c', 'import uvicorn'], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            PY = str(venv_python)
        except Exception:
            PY = str(sys.executable)
    else:
        PY = str(sys.executable)

    cmd = [PY, '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000', '--log-level', 'debug']
    print('Running:', ' '.join(cmd))
    try:
        res = subprocess.run(cmd, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=6)
        print('Exit code:', res.returncode)
        print(res.stdout.decode(errors='ignore'))
    except subprocess.TimeoutExpired as e:
        # likely uvicorn started; print partial output
        print('Timeout expired; partial output:')
        print(e.stdout.decode(errors='ignore') if e.stdout else '<no output>')
    except Exception as e:
        print('Exception running uvicorn:', type(e).__name__, e)


if __name__ == '__main__':
    main()

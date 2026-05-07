import os
import time
from .config import LOG_INFO, LOG_DEBUG, LOG_WARNING, LOG_ERROR


class Logger:
    level_names = {
        LOG_DEBUG: "DEBUG",
        LOG_INFO: "INFO",
        LOG_WARNING: "WARN",
        LOG_ERROR: "ERROR",
    }

    def __init__(self, logfile: str = "logs/survivor_log.txt", level: int = LOG_INFO) -> None:
        self.logfile = logfile
        self.level = level
        try:
            log_dir = os.path.dirname(self.logfile)
            if log_dir:
                os.makedirs(log_dir, exist_ok=True)
            with open(self.logfile, 'w', encoding='utf-8') as f:
                f.write(f"Survivor Simulation Log\n{'=' * 30}\n")
                f.write(f"Started: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        except Exception:
            # Best-effort file logging; fall back to stdout-only if file not writable
            pass

    def log(self, msg: str, level: int = LOG_INFO) -> None:
        if level < self.level:
            return
        line = f"{msg}"
        print(line)
        try:
            log_dir = os.path.dirname(self.logfile)
            if log_dir:
                os.makedirs(log_dir, exist_ok=True)
            with open(self.logfile, 'a', encoding='utf-8') as f:
                f.write(line + "\n")
        except Exception:
            pass

    def debug(self, msg: str) -> None: self.log(msg, LOG_DEBUG)
    def info(self, msg: str) -> None: self.log(msg, LOG_INFO)
    def warn(self, msg: str) -> None: self.log(msg, LOG_WARNING)
    def error(self, msg: str) -> None: self.log(msg, LOG_ERROR)

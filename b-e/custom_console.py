"""
Custom Module for Console Log formats,
like Colors, Loading Indicators, etc

Something similar to https://rich.readthedocs.io/en/stable/introduction.html
"""
import sys
import time
import os

# ANSI escape codes for colors, etc, in print statements
COLOR_RED = "\033[91m"   # Bright Red
COLOR_GREEN = "\033[92m" # Bright Green
COLOR_YELLOW = "\033[93m" # Bright Yellow
COLOR_BLUE = "\033[94m"  # Bright Blue
COLOR_MAGENTA = "\033[95m"# Bright Magenta
COLOR_CYAN = "\033[96m"  # Bright Cyan
COLOR_WHITE = "\033[97m" # Bright White
RESET_COLOR = "\033[0m" # Reset to default color and formatting

# Clear console log
def clear_console():
    """Clears the console screen based on the operating system."""


    os.system('cls' if os.name == 'nt' else 'clear')

# Loading Spinners
def simple_initializer_spinner(duration=3, msg="Loading Complete!"):
    """
    Displays a Spinner Indicator that appears to animation over time.
    """
    spinner_chars = ['-', '\\', '|', '/'] # Characters for the spinner
    start_time = time.time()
    i = 0
    while time.time() - start_time < duration:
        sys.stdout.write(f'\r{COLOR_MAGENTA}Loading {spinner_chars[i % len(spinner_chars)]}')
        sys.stdout.flush()
        time.sleep(0.1) # Controls the speed of the spin
        i += 1
    sys.stdout.write(f'{COLOR_GREEN}\r{msg}') # Overwrite with final message and a newline
    sys.stdout.flush()
    print(f'{RESET_COLOR}')

def simple_spinner(duration=3, msg="Loading Complete!"):
    """
    Displays a Spinner Indicator that appears to animation over time.
    """
    spinner_chars = ['-', '\\', '|', '/'] # Characters for the spinner
    start_time = time.time()
    i = 0
    while time.time() - start_time < duration:
        sys.stdout.write(f'\r{COLOR_MAGENTA}Loading {spinner_chars[i % len(spinner_chars)]}')
        sys.stdout.flush()
        time.sleep(0.1) # Controls the speed of the spin
        i += 1
    # Overwrite with final message and a newline
    sys.stdout.write(f'{COLOR_CYAN}\r{msg}') 
    sys.stdout.flush()
    print(f'{RESET_COLOR}')

# Timers
"""
    Tracking the time taken for processes, e.i functions, to complete.
    This is useful for debugging and performance monitoring.
"""
from datetime import datetime

# Start timer

# End timer
# TODO: "Add Minutes/Hours"
def process_timer_elapsed_time_success():
    """Returns the elapsed time since the start."""
    print(f"\n✅ {COLOR_GREEN}Completed in {time.time() - start_time:.2f} seconds{RESET_COLOR}\n")
    print(f"{COLOR_GREEN}██████████████████{RESET_COLOR}\n")
    print(f"""
                    | 
    ____________    __ {COLOR_GREEN}-+-{RESET_COLOR}  ____________ 
    \_____     /   /_ \{COLOR_GREEN} |{RESET_COLOR}   \     _____/
     \_____    \____/  \____/    _____/
      \_____                    _____/
         \___________  ___________/
                   /____\\
    """)
    return time.time() - start_time
def process_timer_elapsed_time_failure():
    """Returns the elapsed time since the start."""
    print(f"\n❌ {COLOR_RED}Completed in {time.time() - start_time:.2f} seconds{RESET_COLOR}\n")
    print(f"{COLOR_RED}██████████████████{RESET_COLOR}\n")
    return time.time() - start_time
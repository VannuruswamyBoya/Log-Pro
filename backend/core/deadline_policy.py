from datetime import datetime, time, timedelta, timezone
from core.db import get_settings_col

def get_deadline_config():
    """Retrieve global deadline configuration."""
    settings_col = get_settings_col()
    cfg = settings_col.find_one({'key': 'global_config'}) or {}
    deadline_str = cfg.get('daily_deadline', '17:00')  # format "HH:MM"
    allow_replacement = cfg.get('allow_replacement_before_deadline', True)
    return deadline_str, allow_replacement

def get_current_business_date(now=None):
    """Returns the current date in YYYY-MM-DD format."""
    if now is None:
        now = datetime.now()
    return now.strftime('%Y-%m-%d')

def get_deadline_datetime_for_date(business_date_str, deadline_time_str='17:00'):
    """
    Given a date string 'YYYY-MM-DD' and deadline string 'HH:MM',
    returns the datetime object for the deadline.
    """
    parts = [int(p) for p in deadline_time_str.split(':')]
    hour = parts[0]
    minute = parts[1] if len(parts) > 1 else 0
    second = parts[2] if len(parts) > 2 else 0

    year, month, day = [int(p) for p in business_date_str.split('-')]
    return datetime(year, month, day, hour, minute, second)

def get_countdown_info():
    """
    Calculates live 24-hour countdown info for the frontend.
    Returns:
    - current_business_date (YYYY-MM-DD)
    - deadline_time ("17:00")
    - deadline_datetime (ISO string)
    - seconds_remaining (int, >= 0)
    - is_past_deadline (boolean)
    - formatted_remaining (e.g. "04:32:15")
    - next_deadline_datetime (ISO string for next day if expired)
    """
    now = datetime.now()
    deadline_str, allow_replacement = get_deadline_config()
    current_date = get_current_business_date(now)
    today_deadline = get_deadline_datetime_for_date(current_date, deadline_str)

    if now <= today_deadline:
        diff = today_deadline - now
        is_past = False
        remaining_seconds = max(0, int(diff.total_seconds()))
        active_deadline = today_deadline
    else:
        # Today's deadline has passed
        is_past = True
        remaining_seconds = 0
        tomorrow = now + timedelta(days=1)
        tomorrow_date = tomorrow.strftime('%Y-%m-%d')
        next_deadline = get_deadline_datetime_for_date(tomorrow_date, deadline_str)
        diff_next = next_deadline - now
        active_deadline = today_deadline

    hours = remaining_seconds // 3600
    minutes = (remaining_seconds % 3600) // 60
    seconds = remaining_seconds % 60
    formatted = f"{hours:02d}:{minutes:02d}:{seconds:02d}"

    return {
        'current_time': now.isoformat(),
        'current_business_date': current_date,
        'deadline_time_setting': deadline_str,
        'today_deadline': today_deadline.isoformat(),
        'is_past_deadline': is_past,
        'remaining_seconds': remaining_seconds,
        'formatted_remaining': formatted,
        'allow_replacement_before_deadline': allow_replacement,
        'hours': hours,
        'minutes': minutes,
        'seconds': seconds
    }

def evaluate_submission_status(submission_datetime, business_date_str=None):
    """
    Determines if a submission is ON_TIME or LATE.
    """
    deadline_str, _ = get_deadline_config()
    if business_date_str is None:
        business_date_str = submission_datetime.strftime('%Y-%m-%d')
        
    deadline_dt = get_deadline_datetime_for_date(business_date_str, deadline_str)
    
    if submission_datetime <= deadline_dt:
        return 'ON_TIME'
    else:
        return 'LATE'

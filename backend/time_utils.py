from datetime import datetime, timedelta
import re
import locale

# Đảm bảo định dạng tiếng Việt nếu dùng hệ điều hành hỗ trợ
try:
    locale.setlocale(locale.LC_TIME, "vi_VN.UTF-8")
except:
    pass  # Bỏ qua nếu máy không hỗ trợ

def extract_forecast_date(message: str) -> str:
    """
    Trích xuất ngày dự báo từ tin nhắn người dùng (nếu có)
    Trả về định dạng YYYY-MM-DD hoặc None nếu không rõ
    """
    message = message.lower()
    today = datetime.now()
        # Dạng ngày cụ thể: 22/6 hoặc 22-06
    match = re.search(r"(\d{1,2})[/-](\d{1,2})", message)
    if match:
        day, month = map(int, match.groups())
        year = today.year
        try:
            target_date = datetime(year, month, day)
            # Nếu ngày đã qua thì mặc định là tháng tới hoặc năm sau
            if target_date < today:
                target_date = datetime(year + 1, month, day)
            return target_date.strftime("%Y-%m-%d")
        except ValueError:
            pass  # Ngày không hợp lệ

    if "ngày mai" in message:
        return (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    
    if "ngày mốt" in message:
        return (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
    
    # Cách nói phổ biến
    if any(kw in message for kw in [ "hôm nay", "bây giờ", "hiện tại", "thời điểm này", 
        "ra sao", "như thế nào", "trời sao",
        "có nắng", "có mưa", "đang mưa", "nắng không", "mưa không", "nắng à", "mưa à"
        ]):
        return datetime.now().strftime("%Y-%m-%d")

    # (Tuỳ chọn) Tìm theo thứ trong tuần: "thứ 7", "chủ nhật"
    weekdays = {
        "thứ hai": 0, "thứ ba": 1, "thứ tư": 2,
        "thứ năm": 3, "thứ sáu": 4, "thứ bảy": 5, "thứ 7": 5,
        "chủ nhật": 6
    }
    for label, target_weekday in weekdays.items():
        if label in message:
            days_ahead = (target_weekday - today.weekday() + 7) % 7
            if days_ahead == 0:
                days_ahead = 7  # Không phải hôm nay
            return (today + timedelta(days=days_ahead)).strftime("%Y-%m-%d")

    return None  # Không xác định được ngày

def parse_reminder(text):
    text = text.lower().strip()

    pattern_relative = re.compile(
        r'''
        (?:
            # Trường hợp mở đầu bằng "nhắc"
            (?:(?:nhắc)(?: giúp)?(?: tôi)?|làm ơn nhắc(?: tôi)?)
            \s*(?P<action1>.+?)\s*
            (?:trong|sau)\s*(?P<number1>\d+)\s*(?P<unit1>giây|phút|giờ|ngày|tuần)(?: nữa)?
        )
        |
        (?:
            # Trường hợp mở đầu bằng "trong/sau"
            (?:trong|sau)\s*(?P<number2>\d+)\s*(?P<unit2>giây|phút|giờ|ngày|tuần)(?: nữa)?[,]?\s*
            (?:(?:hãy\s*)?(?:nhắc)(?: giúp)?(?: tôi)?|làm ơn nhắc(?: tôi)?)\s*(?P<action2>.+?)
        )
        |
        (?:
            # Trường hợp mở đầu bằng số thời gian
            (?P<number3>\d+)\s*(?P<unit3>giây|phút|giờ|ngày|tuần)(?: nữa)?[,]?\s*
            (?:(?:hãy\s*)?(?:nhắc)(?: giúp)?(?: tôi)?|làm ơn nhắc(?: tôi)?)?\s*(?P<action3>.+?)
        )
        ''',
        re.IGNORECASE | re.VERBOSE
    )

    m = pattern_relative.search(text)
    if not m:
        return None, None

    # Ưu tiên group nào khớp
    if m.group("action1"):
        action = m.group("action1").strip()
        number = int(m.group("number1"))
        unit = m.group("unit1")
    elif m.group("action2"):
        action = m.group("action2").strip()
        number = int(m.group("number2"))
        unit = m.group("unit2")
    elif m.group("action3"):
        action = m.group("action3").strip()
        number = int(m.group("number3"))
        unit = m.group("unit3")
    else:
        return None, None

    now = datetime.now()
    if unit == 'giây':
        remind_time = now + timedelta(seconds=number)
    elif unit == 'phút':
        remind_time = now + timedelta(minutes=number)
    elif unit == 'giờ':
        remind_time = now + timedelta(hours=number)
    elif unit == 'ngày':
        remind_time = now + timedelta(days=number)
    elif unit == 'tuần':
        remind_time = now + timedelta(weeks=number)
    else:
        return None, None

    note = f'Nhắc nhở {action}'
    return remind_time, note

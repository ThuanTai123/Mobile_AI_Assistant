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
    
    if "ngày kia" in message:
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

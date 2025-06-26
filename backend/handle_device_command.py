import re


def extract_level(message):
    match = re.search(r'(?:mức|đến|tới|đặt)\s*(\d{1,3})\s*(?:%|phần trăm)?', message)
    if match:
        level = int(match.group(1))
        return max(0, min(level, 100))
    return None

def handle_device_command(message):
    msg = message.lower()
      # Flash
    if "bật đèn" in msg or "bật flash" in msg:
        return "Đã bật đèn pin cho bạn."
    elif "tắt đèn" in msg or "tắt flash" in msg:
        return "Đã tắt đèn pin cho bạn."

    # Thông báo
    elif "bật thông báo" in msg:
        return "Đã bật thông báo."
    elif "tắt thông báo" in msg:
        return "Đã tắt thông báo."

    # Âm lượng
    elif "âm lượng" in msg:
        if "tăng" in msg:
            return "Đã tăng âm lượng."
        elif "giảm" in msg:
            return "Đã giảm âm lượng."
        elif "tắt" in msg:
            return "Đã tắt âm lượng."
        elif "bật" in msg:
            return "Đã bật âm lượng."
        elif (level := extract_level(msg)) is not None:
            return f"Đang chỉnh âm lượng đến mức {level}%."

    # Độ sáng
    elif "độ sáng" in msg:
        if "tăng" in msg:
            return "Đã tăng độ sáng."
        elif "giảm" in msg:
            return "Đã giảm độ sáng."
        elif (level := extract_level(msg)) is not None:
            return f"Đang chỉnh độ sáng đến mức {level}%."

    # Điều hướng
    elif "mở điều hướng" in msg or "mở thanh điều hướng" in msg:
        return "Đã mở thanh điều hướng."

    return None
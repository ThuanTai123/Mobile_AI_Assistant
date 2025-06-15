def handle_device_command(message):
    msg = message.lower()
    if "bật đèn" in msg or "bật flash" in msg:
        return "Đã bật đèn pin cho bạn."
    elif "tắt đèn" in msg or "tắt flash" in msg:
        return "Đã tắt đèn pin cho bạn."
    elif "tăng âm lượng" in msg:
        return "Đã tăng âm lượng."
    elif "giảm âm lượng" in msg:
        return "Đã giảm âm lượng."
    elif "bật thông báo" in msg:
        return "Đã bật thông báo."
    elif "tắt thông báo" in msg:
        return "Đã tắt thông báo."
    elif "mở điều hướng" in msg or "mở thanh điều hướng" in msg:
        return "Đã mở thanh điều hướng."
    else:
        return None

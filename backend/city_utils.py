import re
import unicodedata
from map import VIETNAM_CITIES, ALIAS_MAP,CITY_MAP 

def remove_accents(text: str) -> str:
    return ''.join(
        c for c in unicodedata.normalize('NFD', text)
        if unicodedata.category(c) != 'Mn'
    )

def clean_city(city: str) -> str:
    city = re.sub(r"^(thành phố|tỉnh)\s+", "", city, flags=re.IGNORECASE)
    city = re.sub(r"(ra sao|thế nào|hôm nay|hiện tại|như thế nào).*$", "", city, flags=re.IGNORECASE)
    return city.strip().title()

def extract_city(message: str) -> str | None:
    message = message.lower()
    normalized_msg = remove_accents(message)

    # 1. So khớp alias
    for alias, real_city in ALIAS_MAP.items():
        if alias in message or remove_accents(alias) in normalized_msg:
            print(f"[DEBUG] Phát hiện alias: {alias} -> {real_city}")
            return real_city

    # 2. So khớp không dấu với danh sách chính thức
    for city_name in VIETNAM_CITIES:
        if remove_accents(city_name.lower()) in normalized_msg:
            print(f"[DEBUG] So khớp không dấu với danh sách: {city_name}")
            return city_name

    return None

def get_normalized_city(message: str) -> str | None:
    city_vi = extract_city(message)
    if city_vi:
        city_en = CITY_MAP.get(city_vi, city_vi)  # fallback nếu không có trong map
        print(f"[DEBUG] Thành phố trích xuất: {city_vi}")
        print(f"[DEBUG] Thành phố chuẩn để gọi API: {city_en}")
        return city_en
    return None

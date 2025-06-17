import re

# Danh sách tỉnh/thành chính thức
VIETNAM_CITIES = [
    "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Bắc Ninh",
    "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước", "Bình Thuận", "Cà Mau",
    "Cần Thơ", "Cao Bằng", "Đà Nẵng", "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai",
    "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh", "Hải Dương",
    "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang",
    "Kon Tum", "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An", "Nam Định",
    "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình",
    "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La",
    "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang",
    "TP Hồ Chí Minh", "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
]

# Biệt danh/thường gọi
ALIAS_MAP = {
    "sài gòn": "TP Hồ Chí Minh",
    "hcm": "TP Hồ Chí Minh",
    "tp hcm": "TP Hồ Chí Minh"
}

def clean_city(city: str) -> str:
    city = re.sub(r"^(thành phố|tỉnh)\s+", "", city, flags=re.IGNORECASE)
    city = re.sub(r"(ra sao|thế nào|hôm nay|hiện tại|như thế nào).*$", "", city, flags=re.IGNORECASE)
    return city.strip().title()

def normalize_city_name(city):
    mapping = {
        "hồ chí minh": "Ho Chi Minh",
        "tphcm": "Ho Chi Minh",
        "sài gòn": "Ho Chi Minh",
        "hà nội": "Hanoi",
        "đà nẵng": "Da Nang",
        # bạn có thể thêm các tỉnh thành khác nếu cần
    }
    key = city.strip().lower()
    return mapping.get(key, city)

def extract_city(message: str) -> str | None:
    message = message.lower()

    # 1. Xử lý alias
    for alias, real_city in ALIAS_MAP.items():
        if alias in message:
            return real_city

    # 2. Regex thông dụng: "thời tiết [ở|tại] city"
    match = re.search(
        r"(?:thời tiết|trời)[^\n]*?(?:ở|tại)?\s*(?P<city>[A-Za-zÀ-ỹ\s\-]+)",
        message,
        re.IGNORECASE
    )
    if match:
        city = match.group("city").strip()
        return clean_city(city)

    # 3. Fallback từ danh sách
    for city_name in VIETNAM_CITIES:
        if city_name.lower() in message:
            return city_name

    return None
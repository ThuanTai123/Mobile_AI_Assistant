

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
    "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa", "Huế", "Tiền Giang",
    "TP Hồ Chí Minh", "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
]

# Biệt danh/thường gọi
ALIAS_MAP = {
    # TP.HCM
    "sài gòn": "TP Hồ Chí Minh",
    "sai gon": "TP Hồ Chí Minh",
    "hcm": "TP Hồ Chí Minh",
    "tp hcm": "TP Hồ Chí Minh",
    "hồ chí minh": "TP Hồ Chí Minh",
    "thành phố hồ chí minh": "TP Hồ Chí Minh",

    # Hà Nội
    "hn": "Hà Nội",
    "ha noi": "Hà Nội",

    # Huế
    "hue": "Huế",
    "tt hue": "Huế",
    "thua thien hue": "Huế",
    "thừa thiên huế": "Huế",

    # Đà Nẵng
    "da nang": "Đà Nẵng",
    "dn": "Đà Nẵng",

    # Cần Thơ
    "can tho": "Cần Thơ",

    # Hải Phòng
    "hai phong": "Hải Phòng",

    # Bà Rịa - Vũng Tàu
    "vung tau": "Bà Rịa - Vũng Tàu",
    "ba ria": "Bà Rịa - Vũng Tàu",
    "ba ria vung tau": "Bà Rịa - Vũng Tàu",

    # Lâm Đồng
    "da lat": "Lâm Đồng",

    # Khánh Hòa
    "nha trang": "Khánh Hòa",

    # Kiên Giang
    "phu quoc": "Kiên Giang",

    # Quảng Ninh
    "halong": "Quảng Ninh",
    "hạ long": "Quảng Ninh",

    # Nghệ An
    "vinh": "Nghệ An",

    # Thái Nguyên
    "thai nguyen": "Thái Nguyên",

    # Bình Dương
    "binh duong": "Bình Dương",

    # Đồng Nai
    "dong nai": "Đồng Nai",

    # Long An
    "long an": "Long An",

    # Bắc Ninh
    "bac ninh": "Bắc Ninh",

    # Sóc Trăng
    "soc trang": "Sóc Trăng",

    # Tất cả còn lại (không dấu)
    "ha giang": "Hà Giang",
    "tuyen quang": "Tuyên Quang",
    "yen bai": "Yên Bái",
    "lao cai": "Lào Cai",
    "dien bien": "Điện Biên",
    "lai chau": "Lai Châu",
    "son la": "Sơn La",
    "hoa binh": "Hòa Bình",
    "lang son": "Lạng Sơn",
    "bac kan": "Bắc Kạn",
    "cao bang": "Cao Bằng",
    "phu tho": "Phú Thọ",
    "bac giang": "Bắc Giang",
    "quang ninh": "Quảng Ninh",
    "bac lieu": "Bạc Liêu",
    "ca mau": "Cà Mau",
    "ben tre": "Bến Tre",
    "tra vinh": "Trà Vinh",
    "vinh long": "Vĩnh Long",
    "hau giang": "Hậu Giang",
    "tien giang": "Tiền Giang",
    "dong thap": "Đồng Tháp",
    "an giang": "An Giang",
    "kien giang": "Kiên Giang",
    "tay ninh": "Tây Ninh",
    "binh phuoc": "Bình Phước",
    "binh thuan": "Bình Thuận",
    "ninh thuan": "Ninh Thuận",
    "dak lak": "Đắk Lắk",
    "dak nong": "Đắk Nông",
    "gia lai": "Gia Lai",
    "kon tum": "Kon Tum",
    "lam dong": "Lâm Đồng",
    "ninh binh": "Ninh Bình",
    "thanh hoa": "Thanh Hóa",
    "nghe an": "Nghệ An",
    "ha tinh": "Hà Tĩnh",
    "quang binh": "Quảng Bình",
    "quang tri": "Quảng Trị",
    "quang nam": "Quảng Nam",
    "quang ngai": "Quảng Ngãi",
    "phu yen": "Phú Yên",
    "binh dinh": "Bình Định",
    "khanh hoa": "Khánh Hòa",
    "thua thien hue": "Huế",
    "thai binh": "Thái Bình",
    "nam dinh": "Nam Định",
    "ninh binh": "Ninh Bình",
    "ha nam": "Hà Nam",
    "hung yen": "Hưng Yên",
    "vinh phuc": "Vĩnh Phúc"
}


# Ánh xạ tên tiếng Việt sang tiếng Anh để gọi API
CITY_MAP = {
    "An Giang": "An Giang",
    "Bà Rịa - Vũng Tàu": "Ba Ria - Vung Tau",
    "Bắc Giang": "Bac Giang",
    "Bắc Kạn": "Bac Kan",
    "Bạc Liêu": "Bac Lieu",
    "Bắc Ninh": "Bac Ninh",
    "Bến Tre": "Ben Tre",
    "Bình Định": "Binh Dinh",
    "Bình Dương": "Binh Duong",
    "Bình Phước": "Binh Phuoc",
    "Bình Thuận": "Binh Thuan",
    "Cà Mau": "Ca Mau",
    "Cần Thơ": "Can Tho",
    "Cao Bằng": "Cao Bang",
    "Đà Nẵng": "Da Nang",
    "Đắk Lắk": "Dak Lak",
    "Đắk Nông": "Dak Nong",
    "Điện Biên": "Dien Bien",
    "Đồng Nai": "Dong Nai",
    "Đồng Tháp": "Dong Thap",
    "Gia Lai": "Gia Lai",
    "Hà Giang": "Ha Giang",
    "Hà Nam": "Ha Nam",
    "Hà Nội": "Hanoi",
    "Hà Tĩnh": "Ha Tinh",
    "Hải Dương": "Hai Duong",
    "Hải Phòng": "Hai Phong",
    "Hậu Giang": "Hau Giang",
    "Hòa Bình": "Hoa Binh",
    "Hưng Yên": "Hung Yen",
    "Khánh Hòa": "Khanh Hoa",
    "Kiên Giang": "Kien Giang",
    "Kon Tum": "Kon Tum",
    "Lai Châu": "Lai Chau",
    "Lâm Đồng": "Lam Dong",
    "Lạng Sơn": "Lang Son",
    "Lào Cai": "Lao Cai",
    "Long An": "Long An",
    "Nam Định": "Nam Dinh",
    "Nghệ An": "Nghe An",
    "Ninh Bình": "Ninh Binh",
    "Ninh Thuận": "Ninh Thuan",
    "Phú Thọ": "Phu Tho",
    "Phú Yên": "Phu Yen",
    "Quảng Bình": "Quang Binh",
    "Quảng Nam": "Quang Nam",
    "Quảng Ngãi": "Quang Ngai",
    "Quảng Ninh": "Quang Ninh",
    "Quảng Trị": "Quang Tri",
    "Sóc Trăng": "Soc Trang",
    "Sơn La": "Son La",
    "Tây Ninh": "Tay Ninh",
    "Thái Bình": "Thai Binh",
    "Thái Nguyên": "Thai Nguyen",
    "Thanh Hóa": "Thanh Hoa",
    "Huế": "Hue",
    "Thừa Thiên Huế": "Hue",  # Nếu bạn giữ tên gốc là 'Thừa Thiên Huế'
    "Tiền Giang": "Tien Giang",
    "TP Hồ Chí Minh": "Ho Chi Minh",
    "Trà Vinh": "Tra Vinh",
    "Tuyên Quang": "Tuyen Quang",
    "Vĩnh Long": "Vinh Long",
    "Vĩnh Phúc": "Vinh Phuc",
    "Yên Bái": "Yen Bai"
}
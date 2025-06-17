import os
import re
import sqlite3
import uuid
import requests
import threading
import urllib.parse
import time
from datetime import datetime, timedelta, timezone
from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
from gtts import gTTS
from handle_device_command import handle_device_command
from city_utils import extract_city
from time_utils import extract_forecast_date
from city_utils import normalize_city_name


# Load API key từ .env
load_dotenv()
api_key = os.getenv("OPENROUTER_API_KEY")
weather_api_key = os.getenv("OPENWEATHER_API_KEY")

# Flask app
app = Flask(__name__)
CORS(app)

# Cấu hình database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///appointments.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Định nghĩa model lịch hẹn
class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    datetime = db.Column(db.DateTime, nullable=False)
    description = db.Column(db.String(255), nullable=False)
    notified = db.Column(db.Boolean, default=False)

# Tạo thư mục audio
AUDIO_FOLDER = "static/audio"
os.makedirs(AUDIO_FOLDER, exist_ok=True)

# Ghi chú, công việc, lịch hẹn dạng tạm (RAM)
notes = []
tasks = []
appointments = []

# Tạo bảng database
with app.app_context():
    db.create_all()

def parse_reminder(text):
    text = text.lower().strip()

    # Dạng "nhắc tôi ... trong X giây/phút/giờ/ngày nữa"
    pattern_relative = re.compile(r'nhắc(?: tôi)? (.+?) trong (\d+) (giây|phút|giờ|ngày) nữa')
    m_rel = pattern_relative.search(text)
    if m_rel:
        note = 'Nhắc nhở ' + m_rel.group(1).strip()
        number = int(m_rel.group(2))
        unit = m_rel.group(3)

        now = datetime.now()
        if unit == 'giây':
            remind_time = now + timedelta(seconds=number)
        elif unit == 'phút':
            remind_time = now + timedelta(minutes=number)
        elif unit == 'giờ':
            remind_time = now + timedelta(hours=number)
        elif unit == 'ngày':
            remind_time = now + timedelta(days=number)
        else:
            return None, None

        return remind_time, note    

# Hàm lấy thời tiết kết hợp current và forecast

def get_weather(city, date=None):
    encoded_city = urllib.parse.quote(city)
    today = datetime.now().date()

    # Current weather nếu date None hoặc hôm nay
    if date is None or date == today.strftime("%Y-%m-%d"):
        url = f'https://api.openweathermap.org/data/2.5/weather?q={encoded_city}&units=metric&lang=vi&appid={weather_api_key}'
        res = requests.get(url)
        if res.status_code == 200:
            data = res.json()
            desc = data['weather'][0]['description']
            temp = data['main']['temp']
            return f"🌤️ Thời tiết tại {city} hiện tại: {desc}, nhiệt độ {temp}°C"
        else:
            return "❌ Không tìm thấy thông tin thời tiết cho địa điểm bạn yêu cầu."

    # Forecast 5 ngày/3 giờ
    url = f'https://api.openweathermap.org/data/2.5/forecast?q={encoded_city}&units=metric&lang=vi&appid={weather_api_key}'
    res = requests.get(url)
    if res.status_code != 200:
        return "❌ Không tìm thấy thông tin dự báo thời tiết cho địa điểm bạn yêu cầu."

    data = res.json()
    forecasts = data.get("list", [])
    target_date = datetime.strptime(date, "%Y-%m-%d").date()

    # Gom toàn bộ khung giờ trong ngày
    lines = []
    for item in forecasts:
        # Parse thời gian UTC từ dt_txt, gán timezone UTC;
        dt_utc = datetime.strptime(item['dt_txt'], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
        # Chuyển về múi giờ Việt Nam (UTC+7)
        dt_local = dt_utc.astimezone(timezone(timedelta(hours=7)))
        if dt_local.date() == target_date:
            desc = item['weather'][0]['description']
            temp = item['main']['temp']
            lines.append(f"- {dt_local.strftime('%H:%M')}: {desc}, {temp}°C")

    if lines:
        return f"📅 Dự báo {city} ngày {target_date.strftime('%d/%m/%Y')}:\n" + "\n".join(lines)
    else:
        return f"❗ Không có dữ liệu dự báo thời tiết cho {city} vào ngày {date}."

# Route thời tiết
@app.route('/weather', methods=['POST'])
def weather():
    data = request.json
    message = data.get("message", "")
    city_from_client = data.get("city", "").strip()

    print(f"[DEBUG] Message nhận được: {message}")

    # 1. Trích xuất thành phố
    city = extract_city(message)
    if not city and city_from_client:
        city = city_from_client
        print(f"[DEBUG] Dùng thành phố từ client gửi: {city}")
    if not city:
        city = "TP Hồ Chí Minh"
        print(f"[DEBUG] Không tìm thấy thành phố, dùng mặc định: {city}")
    city = normalize_city_name(city)

    # 2. Trích xuất ngày dự báo
    forecast_date = extract_forecast_date(message)
    print(f"[DEBUG] Ngày cần dự báo: {forecast_date}")

    # 3. Gọi hàm thời tiết
    result = get_weather(city, forecast_date)
    return jsonify({"reply": result})
# Tự động xóa file âm thanh sau vài phút
def auto_delete_file(path, delay_minutes=10):
    def delete():
        time.sleep(delay_minutes * 60)
        try:
            if os.path.exists(path):
                os.remove(path)
                print(f"Đã xóa file âm thanh: {path}")
        except Exception as e:
            print(f"Lỗi khi xóa file {path}: {e}")
    threading.Thread(target=delete, daemon=True).start()

@app.route("/chat", methods=["POST"])
def chat_endpoint():
    try:
        body = request.get_json()
        user_message = body.get("message", "").lower().strip()
        now = datetime.now()
        # 1. Kiểm tra lệnh điều khiển thiết bị
        device_response = handle_device_command(user_message)
        if device_response:
            return jsonify({
                "reply": device_response
            })

        # 2. Tạo nhắc nhở từ văn bản
        dt, content = parse_reminder(user_message)
        if dt:
            new_appt = Appointment(datetime=dt, description=content)
            db.session.add(new_appt)
            db.session.commit()

            reply = f"Đã tạo nhắc nhở lúc {dt.strftime('%H:%M %d/%m/%Y')}"
            tts = gTTS(text=reply, lang="vi", tld="com.vn")
            filename = f"{uuid.uuid4()}.mp3"
            filepath = os.path.join(AUDIO_FOLDER, filename)
            tts.save(filepath)
            auto_delete_file(filepath)

            return jsonify({
                "reply": reply,
                "audio_url": f"/static/audio/{filename}",
                "datetime": dt.isoformat()
            })

        # 3. Câu hỏi thường gặp
        if "mấy giờ" in user_message or "bây giờ là mấy giờ" in user_message:
            reply = f"Bây giờ là {now.strftime('%H:%M:%S')}"
        elif "ngày mấy" in user_message or "hôm nay là ngày mấy" in user_message:
            reply = f"Hôm nay là ngày {now.strftime('%d/%m/%Y')}"
        else:
            # 4. Gửi đến OpenRouter (ChatGPT)
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "openai/gpt-3.5-turbo",
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "Bạn là Ruby, trợ lý ảo nói tiếng Việt tự nhiên, thân thiện, chính xác. "
                            "Trả lời ngắn gọn, dễ hiểu và đúng ngữ pháp."
                        )
                    },
                    {"role": "user", "content": user_message}
                ]
            }

            response = requests.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            reply = data["choices"][0]["message"]["content"]

        # Chuyển văn bản thành giọng nói
        tts = gTTS(text=reply, lang="vi", tld="com.vn")
        filename = f"{uuid.uuid4()}.mp3"
        filepath = os.path.join(AUDIO_FOLDER, filename)
        tts.save(filepath)
        auto_delete_file(filepath)

        return jsonify({
            "reply": reply,
            "audio_url": f"/static/audio/{filename}"
        })

    except Exception as e:
        print("Lỗi:", str(e))
        return jsonify({"reply": "Xin lỗi, có lỗi xảy ra", "error": str(e)}), 500


@app.route("/static/audio/<filename>")
def serve_audio(filename):
    return send_from_directory(AUDIO_FOLDER, filename)

@app.route('/note', methods=['POST'])
def create_note():
    data = request.json
    note = {
        'id': len(notes) + 1,
        'content': data['content'],
        'created_at': datetime.now().isoformat()
    }
    notes.append(note)
    return jsonify(note), 201

@app.route('/note', methods=['GET'])
def get_notes():
    return jsonify(notes)

@app.route('/task', methods=['POST'])
def create_task():
    data = request.json
    print("📥 Dữ liệu nhận được từ frontend:", data)

    task_text = data.get('task')
    remind_time = data.get('remind_time')

    if not task_text:
        return jsonify({'error': 'Thiếu trường task'}), 400

    task = {
        'id': len(tasks) + 1,
        'task': task_text,
        'remind_time': remind_time  # Có thể None nếu không gửi
    }
    tasks.append(task)
    reply_text = f"🛎️ Đã tạo nhắc việc: {task_text}"
    if remind_time:
        reply_text += f" lúc {remind_time}"
    return jsonify({'reply': reply_text}), 201


@app.route('/task', methods=['GET'])
def get_tasks():
    return jsonify(tasks)

@app.route('/appointment', methods=['POST'])
def create_appointment():
    data = request.json
    appointment = {
        'id': len(appointments) + 1,
        'title': data['title'],
        'date': data['date'],
        'time': data['time'],
        'location': data['location']
    }
    appointments.append(appointment)
    return jsonify(appointment), 201

@app.route('/appointment', methods=['GET'])
def get_appointments():
    with app.app_context():
        all_appts = Appointment.query.all()
        result = []
        for appt in all_appts:
            result.append({
                'id': appt.id,
                'datetime': appt.datetime.strftime("%Y-%m-%d %H:%M"),
                'description': appt.description,
                'notified': appt.notified
            })
        return jsonify(result)

@app.route('/appointment/<int:reminder_id>/notified', methods=['POST'])
def mark_as_notified(reminder_id):
    with app.app_context():
        appt = Appointment.query.get(reminder_id)
        if appt:
            appt.notified = True
            db.session.commit()
            return jsonify({"status": "ok"})
        else:
            return jsonify({"status": "not found"}), 404

# Thread nền kiểm tra nhắc nhở
def check_appointments():
    with app.app_context():
        while True:
            now = datetime.now()
            upcoming = Appointment.query.filter(
                Appointment.datetime <= now,
                Appointment.notified == False
            ).all()

            for appt in upcoming:
                print(f"🔔 Nhắc nhở: {appt.description} lúc {appt.datetime}")
                appt.notified = True
                db.session.commit()

            time.sleep(60)

# Khởi động thread nền
threading.Thread(target=check_appointments, daemon=True).start()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)  # Quan trọng để dùng trên di động

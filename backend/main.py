import os
import re
import sqlite3
import uuid
import requests
import threading
import urllib.parse
import time
import traceback
from datetime import datetime, timedelta, timezone
from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
from gtts import gTTS
from handle_device_command import handle_device_command 
from city_utils import CITY_MAP, extract_city  
from time_utils import extract_forecast_date, parse_reminder 

# Load API key từ .env
load_dotenv()
api_key = os.getenv("OPENROUTER_API_KEY")
weather_api_key = os.getenv("OPENWEATHER_API_KEY")

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///appointments.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    datetime = db.Column(db.DateTime, nullable=False)
    description = db.Column(db.String(255), nullable=False)
    notified = db.Column(db.Boolean, default=False)

AUDIO_FOLDER = "static/audio"
os.makedirs(AUDIO_FOLDER, exist_ok=True)

def init_notes_db():
    conn = sqlite3.connect('notes.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()
    print("✅ Notes database initialized")

init_notes_db()

with app.app_context():
    db.create_all()

tasks = []
appointments = []

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

def get_weather(city, date=None):
    encoded_city = urllib.parse.quote(city)
    today = datetime.now().date()

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

    url = f'https://api.openweathermap.org/data/2.5/forecast?q={encoded_city}&units=metric&lang=vi&appid={weather_api_key}'
    res = requests.get(url)
    if res.status_code != 200:
        return "❌ Không tìm thấy thông tin dự báo thời tiết cho địa điểm bạn yêu cầu."

    data = res.json()
    forecasts = data.get("list", [])
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
        if (target_date - today).days > 5:
            return "📅 Dự báo thời tiết chỉ hỗ trợ trong 5 ngày tới."
    except:
        return "❌ Không xác định được ngày bạn yêu cầu."

    lines = []
    for item in forecasts:
        dt_utc = datetime.strptime(item['dt_txt'], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
        dt_local = dt_utc.astimezone(timezone(timedelta(hours=7)))
        if dt_local.date() == target_date:
            desc = item['weather'][0]['description']
            temp = item['main']['temp']
            lines.append(f"- {dt_local.strftime('%H:%M')}: {desc}, {temp}°C")

    if lines:
        return f"📅 Dự báo {city} ngày {target_date.strftime('%d/%m/%Y')}:\n" + "\n".join(lines)
    return f"❗ Không có dữ liệu dự báo thời tiết cho {city} vào ngày {date}."

@app.route("/weather", methods=["POST"])
def weather():
    data = request.json
    message = data.get("message", "")
    city_from_client = data.get("city", "").strip()
    city_vi = extract_city(message) or city_from_client or "TP Hồ Chí Minh"
    city_en = CITY_MAP.get(city_vi, city_vi)
    forecast_date = extract_forecast_date(message)
    result = get_weather(city_en, forecast_date)
    return jsonify({"reply": result})

@app.route("/chat", methods=["POST"])
def chat_endpoint():
    try:
        body = request.get_json()
        user_message = body.get("message", "").lower().strip()
        now = datetime.now()

        print(f"📥 [Chat] Tin nhắn nhận được: {user_message}")

        device_response = handle_device_command(user_message)
        if device_response:
            return jsonify({"reply": device_response})

        dt, content = parse_reminder(user_message)
        if dt:
            new_appt = Appointment(datetime=dt, description=content)
            db.session.add(new_appt)
            db.session.commit()
            reply = f"Đã tạo nhắc nhở lúc {dt.strftime('%H:%M %d/%m/%Y')}"
        elif "mấy giờ" in user_message:
            reply = f"Bây giờ là {now.strftime('%H:%M:%S')}"
        elif "ngày mấy" in user_message:
            reply = f"Hôm nay là ngày {now.strftime('%d/%m/%Y')}"
        else:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "mistralai/mistral-7b-instruct",
                "messages": [
                    {"role": "system", "content": "Bạn là Ruby – trợ lý ảo lanh lợi, trả lời NGẮN GỌN, đúng trọng tâm, súc tích, kèm chút hài hước dí dỏm. Không nói lan man, không giải thích thừa. Ưu tiên trả lời nhanh, vui, dễ hiểu."},
                    {"role": "user", "content": user_message}
                ]
            }
            response = requests.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers, timeout=20)
            response.raise_for_status()
            data = response.json()
            reply = data["choices"][0]["message"]["content"]

        try:
            tts = gTTS(text=reply, lang="vi", tld="com.vn")
            filename = f"{uuid.uuid4()}.mp3"
            filepath = os.path.join(AUDIO_FOLDER, filename)
            tts.save(filepath)
            auto_delete_file(filepath)
            audio_url = f"/static/audio/{filename}"
        except Exception as tts_err:
            print("⚠️ TTS lỗi:", tts_err)
            audio_url = None

        return jsonify({"reply": reply, "audio_url": audio_url})

    except Exception as e:
        print("❌ Lỗi chat_endpoint:", e)
        traceback.print_exc()
        return jsonify({"reply": "Xin lỗi, có lỗi xảy ra", "error": str(e)}), 500

@app.route("/static/audio/<filename>")
def serve_audio(filename):
    return send_from_directory(AUDIO_FOLDER, filename)

@app.route("/note", methods=["POST"])
def create_note():
    data = request.json
    content = data.get('content', '')
    note_title = "Ghi chú"
    if 'tạo ghi chú' in content.lower():
        content = content.lower().replace('tạo ghi chú', '').strip()
        note_title = content or "Ghi chú"

    conn = sqlite3.connect('notes.db')
    cursor = conn.cursor()
    cursor.execute('INSERT INTO notes (title, content) VALUES (?, ?)', (note_title, content))
    note_id = cursor.lastrowid
    created_at = datetime.now().isoformat()
    conn.commit()
    conn.close()

    reply_text = f"Đã tạo ghi chú '{content}' thành công!"

    try:
        tts = gTTS(text=reply_text, lang="vi", tld="com.vn")
        filename = f"{uuid.uuid4()}.mp3"
        filepath = os.path.join(AUDIO_FOLDER, filename)
        tts.save(filepath)
        auto_delete_file(filepath)
        audio_url = f"/static/audio/{filename}"
    except:
        audio_url = None

    return jsonify({
        'reply': reply_text,
        'type': 'note_created',
        'audio_url': audio_url,
        'note_data': {
            'id': note_id,
            'title': note_title,
            'content': content,
            'created_at': created_at
        }
    }), 201

@app.route("/note", methods=["GET"])
def get_notes():
    conn = sqlite3.connect('notes.db')
    cursor = conn.cursor()
    cursor.execute('SELECT id, title, content, created_at FROM notes ORDER BY created_at DESC')
    rows = cursor.fetchall()
    conn.close()
    return jsonify([
        {"id": r[0], "title": r[1], "content": r[2], "created_at": r[3]} for r in rows
    ])

@app.route("/task", methods=["POST"])
def create_task():
    data = request.json
    task = {
        'id': len(tasks) + 1,
        'task': data.get('task'),
        'remind_time': data.get('remind_time')
    }
    tasks.append(task)
    return jsonify({'reply': f"🛎️ Đã tạo nhắc việc: {task['task']}"}), 201

@app.route("/task", methods=["GET"])
def get_tasks():
    return jsonify(tasks)

@app.route("/appointment", methods=["GET"])
def get_appointments():
    with app.app_context():
        return jsonify([
            {
                'id': a.id,
                'datetime': a.datetime.strftime("%Y-%m-%d %H:%M"),
                'description': a.description,
                'notified': a.notified
            } for a in Appointment.query.all()
        ])

@app.route("/appointment/<int:reminder_id>/notified", methods=["POST"])
def mark_as_notified(reminder_id):
    with app.app_context():
        appt = Appointment.query.get(reminder_id)
        if appt:
            appt.notified = True
            db.session.commit()
            return jsonify({"status": "ok"})
        return jsonify({"status": "not found"}), 404

def check_appointments():
    while True:
        with app.app_context():   
            now = datetime.now()
            upcoming = Appointment.query.filter(Appointment.datetime <= now, Appointment.notified == False).all()
            for appt in upcoming:
                print(f"🔔 Nhắc nhở: {appt.description} lúc {appt.datetime}")
                appt.notified = True
                db.session.commit()
            time.sleep(60)

@app.route("/")
def index():
    return "✅ Flask server is running!"

if __name__ == "__main__":
    init_notes_db()
    print("🚀 Starting Flask server...")
    threading.Thread(target=check_appointments, daemon=True).start()
    app.run(debug=True, host="0.0.0.0", port=5000)

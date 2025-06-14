import os
import re
import sqlite3
import uuid
import requests
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
from gtts import gTTS
import threading
import time
import handle_device_command

# Load API key từ .env
load_dotenv()
api_key = os.getenv("OPENROUTER_API_KEY")

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

    # Dạng "tạo nhắc nhở vào lúc 10:40 ngày 6/6/2025"
    match = re.search(r'lúc (\d{1,2}[:h]\d{2}) ngày (\d{1,2})[/-](\d{1,2})[/-](\d{4})', text)
    if match:
        time_str = match.group(1).replace('h', ':')
        day = int(match.group(2))
        month = int(match.group(3))
        year = int(match.group(4))
        try:
            dt = datetime.strptime(f"{day:02}/{month:02}/{year} {time_str}", "%d/%m/%Y %H:%M")
            note = 'Nhắc nhở ' + text
            return dt, note
        except ValueError:
            return None, None

    # Dạng "nhắc tôi <nội dung> vào HH:mm ngày dd/mm/yyyy"
    match2 = re.search(
        r'nhắc (?:tôi|nhở) (.+) vào (\d{1,2}:\d{2}) ?(?:ngày )?(\d{1,2})[/-](\d{1,2})[/-](\d{4})', text)
    if match2:
        note = 'Nhắc nhở ' + match2.group(1).strip()
        time_str = match2.group(2)
        day = int(match2.group(3))
        month = int(match2.group(4))
        year = int(match2.group(5))
        try:
            dt = datetime.strptime(f"{day:02}/{month:02}/{year} {time_str}", "%d/%m/%Y %H:%M")
            return dt, note
        except ValueError:
            return None, None

    return None, None

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
        print("User Message:", user_message)

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
        elif "mở youtube" in user_message:
            return jsonify({"reply": "Đã mở YouTube giúp bạn.", "open_url": "https://www.youtube.com"})
        elif "mở google" in user_message:
            return jsonify({"reply": "Mở Google nè.", "open_url": "https://www.google.com"})
        elif "mở facebook" in user_message:
            return jsonify({"reply": "Đây là Facebook!", "open_url": "https://www.facebook.com"})
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
    task = {
        'id': len(tasks) + 1,
        'task': data['task'],
        'remind_time': data['remind_time']
    }
    tasks.append(task)
    return jsonify(task), 201

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

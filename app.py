"""
Face Recognition Backend
------------------------
Routes:
  POST /auth/signup           — create account (optionally with face image)
  POST /auth/login            — password login, returns JWT
  GET  /auth/me               — verify JWT, return current user
  POST /face/register         — register / update a face embedding
  POST /face/authenticate     — face login, returns JWT + triggers door grant
  GET  /face/list             — list registered faces (debug)
  DELETE /face/delete/<u>     — remove a face record
  GET  /sensors               — latest sensor readings from ESP
  GET  /device/list           — current device on/off states
  POST /device/toggle         — send on/off command to ESP
  GET  /health                — liveness check
"""

import os
import io
import uuid
import json
import sqlite3
import datetime
import traceback
import hashlib
import hmac
import threading

import jwt
import numpy as np
from PIL import Image
import face_recognition
import serial
import serial.tools.list_ports
from flask import Flask, request, jsonify
from flask_cors import CORS

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
DB_PATH   = os.path.join(BASE_DIR, 'faces.db')

JWT_SECRET       = os.environ.get('JWT_SECRET', 'change-me-in-production-supersecretkey')
JWT_ALGORITHM    = 'HS256'
JWT_EXPIRY_HOURS = 24

FACE_DISTANCE_THRESHOLD = 0.6

ESP_PORT     = os.environ.get('ESP_PORT', 'COM3')
ESP_BAUDRATE = 115200

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ---------------------------------------------------------------------------
# Shared ESP state  (written by serial reader thread, read by routes)
# Protected by a lock so there are no race conditions.
# ---------------------------------------------------------------------------
_state_lock = threading.Lock()

esp_state = {
    # Sensor readings
    'temperature': None,
    'humidity':    None,
    'motion':      False,
    'last_update': None,   # ISO timestamp of the last received packet

    # Device states — authoritative mirror of what the ESP is actually doing
    'fan':    'off',
    'lights': 'off',
}

door_state = {
    'status':     'IDLE',
    'username':   None,
    'granted_at': None,
}

# ---------------------------------------------------------------------------
# Serial port
# ---------------------------------------------------------------------------
_serial_conn: serial.Serial | None = None
_serial_lock = threading.Lock()


def get_serial() -> serial.Serial | None:
    global _serial_conn
    with _serial_lock:
        if _serial_conn and _serial_conn.is_open:
            return _serial_conn
        try:
            _serial_conn = serial.Serial(ESP_PORT, ESP_BAUDRATE, timeout=1)
            print(f'[serial] Connected on {ESP_PORT}')
            return _serial_conn
        except serial.SerialException as e:
            ports = [p.device for p in serial.tools.list_ports.comports()]
            print(f'[serial] Cannot open {ESP_PORT}: {e}')
            print(f'[serial] Available ports: {ports}')
            return None


def send_to_esp(message: str) -> None:
    """Write a newline-terminated command to the ESP."""
    conn = get_serial()
    if conn:
        try:
            with _serial_lock:
                conn.write(f'{message}\n'.encode('utf-8'))
                conn.flush()
            print(f'[serial] >> {message}')
        except serial.SerialException as e:
            print(f'[serial] Write error: {e}')
    else:
        print(f'[serial] Not connected — could not send: {message}')


# ---------------------------------------------------------------------------
# Background thread: continuously read lines from the ESP
# ---------------------------------------------------------------------------
def serial_reader() -> None:
    """
    Runs in a daemon thread.
    Reads lines from the ESP and updates esp_state.

    Expected JSON format from ESP every ~2 s:
      {"temp":25.3,"hum":60.1,"motion":1,"fan":"on","lights":"on"}

    Any non-JSON line (debug prints, etc.) is just logged.
    """
    print('[serial_reader] Starting...')
    while True:
        try:
            conn = get_serial()
            if not conn:
                threading.Event().wait(3)   # Wait 3 s before retrying
                continue

            raw = conn.readline()
            if not raw:
                continue

            line = raw.decode('utf-8', errors='ignore').strip()
            if not line:
                continue

            # Try to parse as JSON sensor packet
            if line.startswith('{'):
                try:
                    data = json.loads(line)
                    with _state_lock:
                        if 'temp'   in data: esp_state['temperature'] = round(float(data['temp']),  1)
                        if 'hum'    in data: esp_state['humidity']    = round(float(data['hum']),   1)
                        if 'motion' in data: esp_state['motion']      = bool(int(data['motion']))
                        if 'fan'    in data: esp_state['fan']         = str(data['fan'])
                        if 'lights' in data: esp_state['lights']      = str(data['lights'])
                        esp_state['last_update'] = datetime.datetime.utcnow().isoformat()
                except (json.JSONDecodeError, ValueError, KeyError) as e:
                    print(f'[serial_reader] JSON parse error: {e} — line: {line}')
            else:
                # Plain debug print from ESP — just show it
                print(f'[ESP] {line}')

        except serial.SerialException as e:
            print(f'[serial_reader] Serial error: {e} — reconnecting in 3 s')
            with _serial_lock:
                _serial_conn = None
            threading.Event().wait(3)
        except Exception as e:
            print(f'[serial_reader] Unexpected error: {e}')
            threading.Event().wait(1)


# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id            TEXT PRIMARY KEY,
                username      TEXT NOT NULL UNIQUE,
                email         TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at    TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS faces (
                id          TEXT PRIMARY KEY,
                user_id     TEXT NOT NULL,
                username    TEXT NOT NULL,
                embedding   BLOB NOT NULL,
                created_at  TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        conn.commit()


# ---------------------------------------------------------------------------
# Password helpers
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    return hmac.new(JWT_SECRET.encode(), password.encode(), hashlib.sha256).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    return hmac.compare_digest(hash_password(password), password_hash)


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------
def make_jwt(user_id: str, username: str, email: str) -> str:
    payload = {
        'sub':      user_id,
        'username': username,
        'email':    email,
        'iat': datetime.datetime.utcnow(),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_jwt(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def get_current_user() -> dict | None:
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    return decode_jwt(auth_header[len('Bearer '):])


# ---------------------------------------------------------------------------
# Image / face helpers
# ---------------------------------------------------------------------------
def embedding_to_blob(embedding: np.ndarray) -> bytes:
    buf = io.BytesIO()
    np.save(buf, embedding)
    return buf.getvalue()


def blob_to_embedding(blob: bytes) -> np.ndarray:
    return np.load(io.BytesIO(blob))


def decode_image(image_bytes: bytes) -> np.ndarray:
    return np.array(Image.open(io.BytesIO(image_bytes)).convert('RGB'))


def extract_embedding(image_array: np.ndarray) -> np.ndarray | None:
    locations = face_recognition.face_locations(image_array, model='hog')
    if not locations:
        return None
    encodings = face_recognition.face_encodings(image_array, known_face_locations=locations)
    return encodings[0] if encodings else None


def now_iso() -> str:
    return datetime.datetime.utcnow().isoformat()


# ===========================================================================
# ROUTES
# ===========================================================================

# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

@app.route('/auth/signup', methods=['POST'])
def signup():
    if request.content_type and 'multipart/form-data' in request.content_type:
        username  = (request.form.get('username') or '').strip()
        email     = (request.form.get('email') or '').strip()
        password  = request.form.get('password') or ''
        face_file = request.files.get('faceImage')
    else:
        data      = request.get_json(silent=True) or {}
        username  = (data.get('username') or '').strip()
        email     = (data.get('email') or '').strip()
        password  = data.get('password') or ''
        face_file = None

    if not username:
        return jsonify({'success': False, 'message': 'Username is required'}), 400
    if not email:
        return jsonify({'success': False, 'message': 'Email is required'}), 400
    if not password or len(password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400

    with get_db() as conn:
        if conn.execute('SELECT id FROM users WHERE username = ?', (username,)).fetchone():
            return jsonify({'success': False, 'message': 'Username already taken'}), 409
        if conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone():
            return jsonify({'success': False, 'message': 'Email already registered'}), 409

        user_id    = str(uuid.uuid4())
        face_warning = None

        conn.execute(
            'INSERT INTO users (id, username, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)',
            (user_id, username, email, hash_password(password), now_iso())
        )

        if face_file:
            try:
                image_array = decode_image(face_file.read())
                embedding   = extract_embedding(image_array)
                if embedding is None:
                    face_warning = 'No face detected — register your face separately.'
                else:
                    conn.execute(
                        'INSERT INTO faces (id, user_id, username, embedding, created_at) VALUES (?, ?, ?, ?, ?)',
                        (str(uuid.uuid4()), user_id, username, embedding_to_blob(embedding), now_iso())
                    )
            except Exception:
                face_warning = 'Face image unreadable — register your face separately.'

        conn.commit()

    token   = make_jwt(user_id, username, email)
    message = 'Account created successfully'
    if face_warning:
        message += f'. Note: {face_warning}'

    print(f'[signup] "{username}" created')
    return jsonify({
        'success': True, 'message': message, 'token': token,
        'user': {'id': user_id, 'username': username, 'email': email},
    }), 201


@app.route('/auth/login', methods=['POST'])
def login():
    data     = request.get_json(silent=True) or {}
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''

    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password are required'}), 400

    with get_db() as conn:
        user = conn.execute(
            'SELECT id, username, email, password_hash FROM users WHERE username = ?', (username,)
        ).fetchone()

    if not user or not verify_password(password, user['password_hash']):
        return jsonify({'success': False, 'message': 'Invalid username or password'}), 401

    token = make_jwt(user['id'], user['username'], user['email'])
    print(f'[login] "{username}"')
    return jsonify({
        'success': True, 'message': 'Login successful', 'token': token,
        'user': {'id': user['id'], 'username': user['username'], 'email': user['email']},
    })


@app.route('/auth/me', methods=['GET'])
def me():
    payload = get_current_user()
    if not payload:
        return jsonify({'success': False, 'message': 'Invalid or expired token'}), 401
    with get_db() as conn:
        user = conn.execute(
            'SELECT id, username, email FROM users WHERE id = ?', (payload['sub'],)
        ).fetchone()
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    return jsonify({
        'success': True,
        'user': {'id': user['id'], 'username': user['username'], 'email': user['email']},
    })


# ---------------------------------------------------------------------------
# Face
# ---------------------------------------------------------------------------

@app.route('/face/register', methods=['POST'])
def register_face():
    if 'image' not in request.files:
        return jsonify({'success': False, 'message': 'No image provided'}), 400
    username = (request.form.get('username') or '').strip()
    if not username:
        return jsonify({'success': False, 'message': 'Username is required'}), 400

    try:
        image_array = decode_image(request.files['image'].read())
    except Exception:
        return jsonify({'success': False, 'message': 'Could not decode image'}), 400

    embedding = extract_embedding(image_array)
    if embedding is None:
        return jsonify({'success': False,
                        'message': 'No face detected. Ensure your face is clearly visible.'}), 422

    with get_db() as conn:
        user    = conn.execute('SELECT id FROM users WHERE username = ?', (username,)).fetchone()
        user_id = user['id'] if user else username
        existing = conn.execute('SELECT id FROM faces WHERE username = ?', (username,)).fetchone()
        if existing:
            conn.execute('UPDATE faces SET embedding = ?, created_at = ? WHERE username = ?',
                         (embedding_to_blob(embedding), now_iso(), username))
            face_id = existing['id']
        else:
            face_id = str(uuid.uuid4())
            conn.execute(
                'INSERT INTO faces (id, user_id, username, embedding, created_at) VALUES (?, ?, ?, ?, ?)',
                (face_id, user_id, username, embedding_to_blob(embedding), now_iso())
            )
        conn.commit()

    print(f'[face/register] "{username}"')
    return jsonify({'success': True, 'message': f'Face registered for {username}', 'faceId': face_id})


@app.route('/face/authenticate', methods=['POST'])
def authenticate_face():
    if 'image' not in request.files:
        return jsonify({'success': False, 'authenticated': False, 'message': 'No image provided'}), 400

    try:
        image_array = decode_image(request.files['image'].read())
    except Exception:
        return jsonify({'success': False, 'authenticated': False, 'message': 'Could not decode image'}), 400

    incoming_embedding = extract_embedding(image_array)
    if incoming_embedding is None:
        return jsonify({'success': False, 'authenticated': False,
                        'message': 'No face detected. Please ensure your face is clearly visible.'}), 422

    with get_db() as conn:
        rows = conn.execute('SELECT id, user_id, username, embedding FROM faces').fetchall()

    if not rows:
        return jsonify({'success': False, 'authenticated': False,
                        'message': 'No faces registered yet.'}), 403

    known = [blob_to_embedding(r['embedding']) for r in rows]
    distances    = face_recognition.face_distance(known, incoming_embedding)
    best_idx     = int(np.argmin(distances))
    best_distance = float(distances[best_idx])

    print(f'[face/authenticate] Best distance: {best_distance:.4f}')

    if best_distance > FACE_DISTANCE_THRESHOLD:
        return jsonify({'success': False, 'authenticated': False,
                        'message': 'Face not recognised. Please try again.'}), 401

    matched = rows[best_idx]
    with get_db() as conn:
        user = conn.execute(
            'SELECT id, username, email FROM users WHERE id = ?', (matched['user_id'],)
        ).fetchone()

    if user:
        user_id, username, email = user['id'], user['username'], user['email']
    else:
        user_id, username, email = matched['user_id'], matched['username'], ''

    token = make_jwt(user_id, username, email)

    # Unlock door
    send_to_esp('GRANTED')
    door_state.update({'status': 'GRANTED', 'username': username,
                       'granted_at': datetime.datetime.utcnow()})
    print(f'[face/authenticate] Authenticated "{username}"')

    return jsonify({
        'success': True, 'authenticated': True, 'token': token,
        'user': {'id': user_id, 'username': username, 'email': email},
        'message': f'Welcome, {username}!',
    })


@app.route('/face/list', methods=['GET'])
def list_faces():
    with get_db() as conn:
        rows = conn.execute('SELECT id, username, created_at FROM faces').fetchall()
    return jsonify({
        'success': True, 'count': len(rows),
        'faces': [{'id': r['id'], 'username': r['username'], 'createdAt': r['created_at']} for r in rows],
    })


@app.route('/face/delete/<username>', methods=['DELETE'])
def delete_face(username: str):
    with get_db() as conn:
        result = conn.execute('DELETE FROM faces WHERE username = ?', (username,))
        conn.commit()
    if result.rowcount == 0:
        return jsonify({'success': False, 'message': f'No face for "{username}"'}), 404
    return jsonify({'success': True, 'message': f'Face for "{username}" deleted'})


# ---------------------------------------------------------------------------
# Sensor + Device routes  (polled by the Dashboard every 2 s)
# ---------------------------------------------------------------------------

@app.route('/sensors', methods=['GET'])
def get_sensors():
    """Return the latest sensor readings received from the ESP."""
    with _state_lock:
        temp    = esp_state['temperature']
        hum     = esp_state['humidity']
        motion  = esp_state['motion']
        updated = esp_state['last_update']

    sensors = [
        {
            'id':     'temperature',
            'name':   'Temperature Sensor',
            'value':  temp if temp is not None else '--',
            'unit':   '°C',
            'status': 'active' if temp is not None else 'inactive',
        },
        {
            'id':     'humidity',
            'name':   'Humidity Sensor',
            'value':  hum if hum is not None else '--',
            'unit':   '%',
            'status': 'active' if hum is not None else 'inactive',
        },
        {
            'id':     'motion',
            'name':   'IR Motion Sensor',
            'value':  'Detected' if motion else 'Not detected',
            'status': 'detected' if motion else 'not_detected',
        },
    ]
    return jsonify(sensors)


@app.route('/device/list', methods=['GET'])
def get_devices():
    """Return current on/off state of each device as reported by the ESP."""
    with _state_lock:
        fan_status    = esp_state['fan']
        lights_status = esp_state['lights']

    devices = [
        {'id': 'fan',    'name': 'Fan',    'status': fan_status},
        {'id': 'lights', 'name': 'Lights', 'status': lights_status},
    ]
    return jsonify(devices)


@app.route('/device/toggle', methods=['POST'])
def toggle_device():
    """
    Receive a toggle command from the dashboard and forward it to the ESP.
    Body: { "deviceId": "fan" | "lights", "status": "on" | "off" }
    """
    data      = request.get_json(silent=True) or {}
    device_id = (data.get('deviceId') or '').lower().strip()
    status    = (data.get('status') or '').lower().strip()

    if device_id not in ('fan', 'lights'):
        return jsonify({'success': False, 'message': 'Unknown device'}), 400
    if status not in ('on', 'off'):
        return jsonify({'success': False, 'message': 'Status must be "on" or "off"'}), 400

    # e.g.  "FAN:ON"  or  "LIGHTS:OFF"
    command = f'{device_id.upper()}:{status.upper()}'
    send_to_esp(command)

    # Optimistically update our mirror so the next /device/list is correct
    # even before the ESP echoes back a JSON packet
    with _state_lock:
        esp_state[device_id] = status

    device_names = {'fan': 'Fan', 'lights': 'Lights'}
    return jsonify({
        'success': True,
        'message': f'{device_names[device_id]} turned {status}',
        'device': {'id': device_id, 'name': device_names[device_id], 'status': status},
    })


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.route('/health', methods=['GET'])
def health():
    with _state_lock:
        last = esp_state['last_update']
    return jsonify({'status': 'ok', 'esp_last_seen': last})


# ---------------------------------------------------------------------------
# Error handlers
# ---------------------------------------------------------------------------

@app.errorhandler(404)
def not_found(_e):
    return jsonify({'success': False, 'message': 'Endpoint not found'}), 404


@app.errorhandler(405)
def method_not_allowed(_e):
    return jsonify({'success': False, 'message': 'Method not allowed'}), 405


@app.errorhandler(Exception)
def handle_exception(e):
    traceback.print_exc()
    return jsonify({'success': False, 'message': 'Internal server error'}), 500


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    init_db()

    # Start the serial reader in a background daemon thread
    t = threading.Thread(target=serial_reader, daemon=True)
    t.start()

    print(f'Database  : {DB_PATH}')
    print(f'ESP port  : {ESP_PORT}')
    print(f'Threshold : {FACE_DISTANCE_THRESHOLD}')
    print('Server    : http://localhost:5000')

    # use_reloader=False is required — the reloader forks the process which
    # would start two serial reader threads and cause port conflicts.
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)

from flask import Flask, request, jsonify
from flask_cors import CORS
from face_service import enroll_user, authenticate_user
import os

app = Flask(__name__)
CORS(app)  # Allow calls from Node.js backend or browser

@app.route("/api/enroll", methods=["POST"])
def enroll():
    data = request.json
    
    if not data or "name" not in data:
        return jsonify({"error": "Name is required"}), 400

    result = enroll_user(data["name"])
    return jsonify(result)


@app.route("/api/authenticate", methods=["POST"])
def authenticate():
    result = authenticate_user()
    return jsonify(result)


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "face-recognition"})


if __name__ == "__main__":
    # Run on port 5001 to avoid conflict with Node.js backend on port 5000
    port = int(os.environ.get("FACE_SERVICE_PORT", 5001))
    app.run(debug=True, port=port)

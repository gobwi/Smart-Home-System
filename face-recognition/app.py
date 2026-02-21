from flask import Flask, request, jsonify
from face_service import enroll_user, authenticate_user

app = Flask(__name__)

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


if __name__ == "__main__":
    app.run(debug=True)

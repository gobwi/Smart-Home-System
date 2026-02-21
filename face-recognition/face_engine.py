import cv2
import face_recognition
import numpy as np
import os
import sys
import json

# Use absolute path so the database is always in the face-recognition folder
# regardless of who spawns this script (Node.js backend uses backend's CWD)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, "face_database")

if not os.path.exists(DATABASE_PATH):
    os.makedirs(DATABASE_PATH)

def enroll_image(name, image_path):
    """
    Extract face encoding from a given image file and save it for the user.
    """
    if not os.path.exists(image_path):
        return {"success": False, "message": f"Image file not found: {image_path}"}

    frame = cv2.imread(image_path)
    if frame is None:
        return {"success": False, "message": "Failed to read image file"}

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    faces = face_recognition.face_locations(rgb)
    
    if not faces:
        return {"success": False, "message": "No face detected in image"}

    # We take the first face detected
    encoding = face_recognition.face_encodings(rgb, faces)[0]
    
    # Check if user already has encodings
    save_path = os.path.join(DATABASE_PATH, f"{name}.npy")
    if os.path.exists(save_path):
        existing_embeddings = np.load(save_path)
        # Append new encoding to existing profile
        embeddings = np.vstack([existing_embeddings, encoding])
    else:
        embeddings = np.array([encoding])

    np.save(save_path, embeddings)
    return {"success": True, "message": f"Face for {name} enrolled successfully", "name": name}

def authenticate_image(image_path):
    """
    Compare face in image file against all known faces in the database.
    """
    if not os.path.exists(image_path):
        return {"success": False, "message": f"Image file not found: {image_path}"}

    known_embeddings = []
    known_names = []

    # Filter for .npy files only – ignore any other files in the database folder
    files = [f for f in os.listdir(DATABASE_PATH) if f.endswith(".npy")]
    
    if not files:
        return {"success": False, "authenticated": False, "message": "No registered faces found in database"}

    for file in files:
        data = np.load(os.path.join(DATABASE_PATH, file))
        # Use simple mean of all enrolled encodings for that user as their signature
        known_embeddings.append(data.mean(axis=0))
        known_names.append(file.replace(".npy", ""))

    frame = cv2.imread(image_path)
    if frame is None:
        return {"success": False, "message": "Failed to read image file"}

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    faces = face_recognition.face_locations(rgb)

    if not faces:
        return {"success": False, "authenticated": False, "message": "No face detected in capture"}

    encoding = face_recognition.face_encodings(rgb, faces)[0]
    distances = face_recognition.face_distance(known_embeddings, encoding)

    result = {"success": True, "authenticated": False, "message": "Face not recognized"}

    if len(distances) > 0:
        min_distance = np.min(distances)
        # Standard threshold for face_recognition is 0.6, lower is stricter
        if min_distance < 0.5:
            name = known_names[np.argmin(distances)]
            result = {
                "success": True,
                "authenticated": True,
                "username": name,
                "confidence": float(1 - min_distance),
                "message": f"Recognized user: {name}"
            }

    return result

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "message": "Usage: python face_engine.py [enroll|authenticate] [image_path] [name]"}))
        sys.exit(1)

    command = sys.argv[1]
    img_path = sys.argv[2]
    
    if command == "enroll":
        if len(sys.argv) < 4:
            print(json.dumps({"success": False, "message": "Enrollment requires a name"}))
        else:
            name = sys.argv[3]
            print(json.dumps(enroll_image(name, img_path)))
    elif command == "authenticate":
        print(json.dumps(authenticate_image(img_path)))
    else:
        print(json.dumps({"success": False, "message": "Unknown command"}))

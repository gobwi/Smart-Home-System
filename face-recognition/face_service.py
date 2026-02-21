import cv2
import face_recognition
import numpy as np
import os

# Use absolute path so the database is always in the face-recognition folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, "face_database")

if not os.path.exists(DATABASE_PATH):
    os.makedirs(DATABASE_PATH)


def enroll_user(name):
    """Capture 15 face frames from webcam and save embeddings."""
    video = cv2.VideoCapture(0)
    embeddings = []

    while len(embeddings) < 15:
        ret, frame = video.read()
        if not ret:
            break
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        faces = face_recognition.face_locations(rgb)
        if faces:
            encoding = face_recognition.face_encodings(rgb, faces)[0]
            embeddings.append(encoding)

    video.release()
    cv2.destroyAllWindows()

    if not embeddings:
        return {"message": f"No face detected for {name}", "success": False}

    save_path = os.path.join(DATABASE_PATH, f"{name}.npy")
    np.save(save_path, np.array(embeddings))

    return {"message": f"{name} enrolled successfully", "success": True}
    

def authenticate_user():
    """Capture one frame from webcam and compare against known faces."""
    video = cv2.VideoCapture(0)

    known_embeddings = []
    known_names = []

    # Filter for .npy files only to avoid crashes on stray files
    for file in [f for f in os.listdir(DATABASE_PATH) if f.endswith(".npy")]:
        data = np.load(os.path.join(DATABASE_PATH, file))
        known_embeddings.append(data.mean(axis=0))
        known_names.append(file.replace(".npy", ""))

    if not known_embeddings:
        video.release()
        return {"status": "Denied", "reason": "No registered faces"}

    ret, frame = video.read()
    video.release()
    cv2.destroyAllWindows()

    if not ret or frame is None:
        return {"status": "Denied", "reason": "Failed to capture frame"}

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    result = {"status": "Denied"}

    faces = face_recognition.face_locations(rgb)

    if faces:
        encoding = face_recognition.face_encodings(rgb, faces)[0]
        distances = face_recognition.face_distance(known_embeddings, encoding)

        if len(distances) > 0:
            min_distance = np.min(distances)

            if min_distance < 0.5:
                name = known_names[np.argmin(distances)]
                result = {
                    "status": "Granted",
                    "user": name,
                    "confidence": float(1 - min_distance)
                }

    return result

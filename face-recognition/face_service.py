import cv2
import face_recognition
import numpy as np
import os

DATABASE_PATH = "face_database"

if not os.path.exists(DATABASE_PATH):
    os.makedirs(DATABASE_PATH)


def enroll_user(name):
    video = cv2.VideoCapture(0)
    embeddings = []

    while len(embeddings) < 15:
        ret, frame = video.read()
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        faces = face_recognition.face_locations(rgb)
        if faces:
            encoding = face_recognition.face_encodings(rgb, faces)[0]
            embeddings.append(encoding)

    video.release()
    cv2.destroyAllWindows()

    np.save(f"{DATABASE_PATH}/{name}.npy", np.array(embeddings))

    return {"message": f"{name} enrolled successfully"}
    

def authenticate_user():
    video = cv2.VideoCapture(0)

    known_embeddings = []
    known_names = []

    for file in os.listdir(DATABASE_PATH):
        data = np.load(f"{DATABASE_PATH}/{file}")
        known_embeddings.append(data.mean(axis=0))
        known_names.append(file.replace(".npy", ""))

    ret, frame = video.read()
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
                    "confidence": float(min_distance)
                }

    video.release()
    cv2.destroyAllWindows()

    return result

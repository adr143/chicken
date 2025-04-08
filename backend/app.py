from flask import Flask, render_template
from flask_socketio import SocketIO
from ultralytics import YOLO
import cv2
import base64
import numpy as np
import eventlet
import pyaudio
import wave
import struct
import torch
import torchaudio
import torchaudio.transforms as T
from tensorflow.keras.models import load_model

# ----------------- Load Models ------------------
# YOLOv8 model
model = YOLO("Chicken_Dis.pt")

# Audio classification model
audio_model = load_model("Chicken_Well_Being.h5")

# ----------------- Flask Setup ------------------
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")

# ----------------- Video Setup ------------------
video = cv2.VideoCapture(0)

# ----------------- Audio Setup ------------------
CHUNK = 2048
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000  # Match training sample rate
MEL_N_MELS = 64
TARGET_AUDIO_LEN = 16000  # 1 second of audio

audio = pyaudio.PyAudio()
stream = audio.open(format=FORMAT, channels=CHANNELS,
                    rate=RATE, input=True, frames_per_buffer=CHUNK)

# MelSpectrogram transform using Torch
mel_transform = T.MelSpectrogram(sample_rate=RATE, n_mels=MEL_N_MELS)

# Labels used in your classifier (change accordingly)
CLASS_LABELS = ["Healthy Chicken", "Unhealthy Chicken", "Noise"]


# ----------------- Helper Functions ------------------

def preprocess_audio_tensor(audio_tensor):
    if audio_tensor.size(1) > TARGET_AUDIO_LEN:
        audio_tensor = audio_tensor[:, :TARGET_AUDIO_LEN]
    elif audio_tensor.size(1) < TARGET_AUDIO_LEN:
        padding = TARGET_AUDIO_LEN - audio_tensor.size(1)
        audio_tensor = torch.cat([audio_tensor, torch.zeros(1, padding)], dim=1)
    
    mel_spec = mel_transform(audio_tensor)  # (1, n_mels, time)
    mel_spec = mel_spec.squeeze(0).numpy()  # (n_mels, time)
    mel_spec = np.expand_dims(mel_spec, axis=-1)  # (n_mels, time, 1)
    mel_spec = np.expand_dims(mel_spec, axis=0)  # (1, n_mels, time, 1)
    return mel_spec


def generate_video():
    while True:
        success, frame = video.read()
        if not success:
            break
        
        frame = model.predict(frame)[0].plot()
        _, buffer = cv2.imencode('.jpg', frame)
        frame_encoded = base64.b64encode(buffer).decode('utf-8')
        socketio.emit('video_stream', {'image': frame_encoded})
        eventlet.sleep(0.03)  # ~30 FPS


audio_buffer = []

def generate_audio_waveform():
    global audio_buffer
    while True:
        data = stream.read(CHUNK, exception_on_overflow=False)
        audio_data = struct.unpack(str(CHUNK) + 'h', data)
        audio_np = np.array(audio_data, dtype=np.float32) / 32768.0  # normalize to [-1, 1]
        audio_buffer.extend(audio_np.tolist())

        socketio.emit('audio_waveform', {'waveform': audio_data})

        # Once we have ~1 second of audio
        if len(audio_buffer) >= TARGET_AUDIO_LEN:
            audio_tensor = torch.tensor(audio_buffer[:TARGET_AUDIO_LEN]).unsqueeze(0)  # shape: (1, L)
            audio_buffer = audio_buffer[CHUNK:]  # Keep remaining for next round

            # Preprocess and predict
            mel_input = preprocess_audio_tensor(audio_tensor)
            prediction = audio_model.predict(mel_input)
            predicted_idx = np.argmax(prediction)
            predicted_label = CLASS_LABELS[predicted_idx]
            confidence = float(np.max(prediction))

            socketio.emit('audio_prediction', {
                'label': predicted_label,
                'confidence': round(confidence, 3)
            })

        eventlet.sleep(0.05)


# ----------------- Socket Events ------------------

@socketio.on('connect')
def connect():
    socketio.start_background_task(generate_video)
    socketio.start_background_task(generate_audio_waveform)
    print("Client connected")


@socketio.on('disconnect')
def disconnect():
    print("Client disconnected")


# ----------------- Run ------------------

if __name__ == '__main__':
    eventlet.monkey_patch()
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)

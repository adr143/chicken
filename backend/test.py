import os

os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import pyaudio
import numpy as np
import librosa
import tensorflow as tf
from tensorflow.keras.models import load_model

# Load the trained model
MODEL_PATH = "Chicken_Well_Being.h5"
model = load_model(MODEL_PATH)

# Define class labels
CATEGORIES = ["Healthy Chicken", "Unhealthy Chicken", "Noise Data"]

# Audio settings
CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 22050  # Balanced for chicken disease detection

# Start audio stream
p = pyaudio.PyAudio()
stream = p.open(format=FORMAT, channels=CHANNELS, rate=RATE, input=True, frames_per_buffer=CHUNK)

def extract_features(audio_data, sr=22050, n_mels=128, n_fft=2048, hop_length=512):
    if len(audio_data) == 0:
        return None  # Skip empty files

    mel_spec = librosa.feature.melspectrogram(y=audio_data, sr=sr, n_mels=n_mels, n_fft=n_fft, hop_length=hop_length)
    log_mel_spec = librosa.power_to_db(mel_spec)

    return np.mean(log_mel_spec, axis=1)  # Averaging over time


try:
    print("🎤 Listening for real-time chicken sounds...")

    while True:
        # Read audio from microphone
        audio_data = np.frombuffer(stream.read(CHUNK, exception_on_overflow=False), dtype=np.int16)
        audio_data = audio_data.astype(np.float32) / np.max(np.abs(audio_data))  # Normalize

        # Extract features
        features = extract_features(audio_data).reshape(1, -1)  # Reshape for model input

        # Predict class
        prediction = model.predict(features)
        predicted_class = CATEGORIES[np.argmax(prediction)]
        confidence = np.max(prediction)

        # Apply confidence threshold
        if confidence < 0.6:
            print("🔈 Noise detected (uncertain sound)")
        else:
            print(f"✅ Predicted Class: {predicted_class} (Confidence: {confidence:.2f})")

except KeyboardInterrupt:
    print("\n🛑 Stopping real-time classification...")

finally:
    # Cleanup
    stream.stop_stream()
    stream.close()
    p.terminate()

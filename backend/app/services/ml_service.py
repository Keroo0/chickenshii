import io
import os
import numpy as np
from PIL import Image
import tensorflow as tf

from app.core.config import settings

class MLService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MLService, cls).__new__(cls)
            cls._instance._load_model()
        return cls._instance

    def _load_model(self):
        """Memuat model TensorFlow ke memory saat instance pertama kali dibuat"""
        model_path = settings.model_path
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file tidak ditemukan di path: {model_path}")
        
        # Load the model directly without custom_objects since we use standard Rescaling layer
        self.model = tf.keras.models.load_model(model_path)
        
        # Class mapping sesuai alfabetikal saat training ImageDataGenerator
        self.class_names = [
            "Coccidiosis",
            "Healthy",
            "New Castle Disease",
            "Salmonellosis"
        ]

    def process_image(self, image_bytes: bytes) -> np.ndarray:
        """
        Membaca bytes, me-resize ke 224x224, mengubah ke RGB, 
        dan mereturn array shape (1, 224, 224, 3) bernilai 0-255.
        (Normalisasi -1 to 1 dilakukan di dalam model secara otomatis lewat layer Rescaling).
        """
        img = Image.open(io.BytesIO(image_bytes))
        
        # Hindari error konversi dari PNG/RGBA yang punya 4 channel
        if img.mode != "RGB":
            img = img.convert("RGB")
            
        img = img.resize((224, 224))
        
        img_array = np.array(img, dtype=np.float32)
        
        # Expand dimensi untuk batch (1, 224, 224, 3)
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array

    def predict(self, image_bytes: bytes) -> dict:
        """Melakukan inference dan mengembalikan probabilitas semua kelas"""
        img_array = self.process_image(image_bytes)
        
        # Lakukan prediksi (mendapatkan probabilitas Softmax)
        preds = self.model.predict(img_array, verbose=0)[0]
        
        # Menentukan kelas pemenang
        predicted_index = np.argmax(preds)
        predicted_class_name = self.class_names[predicted_index]
        confidence = float(preds[predicted_index] * 100)
        
        # Distribusi probabilitas seluruh kelas
        probabilities = {
            name: float(prob * 100) 
            for name, prob in zip(self.class_names, preds)
        }
        
        return {
            "class_name": predicted_class_name,
            "confidence": confidence,
            "probabilities": probabilities
        }

# Singleton instance
ml_service = MLService()

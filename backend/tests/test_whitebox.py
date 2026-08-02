import pytest
from fastapi.testclient import TestClient
import numpy as np
from PIL import Image, UnidentifiedImageError
from io import BytesIO
from unittest.mock import patch

from app.main import app
from app.services.ml_service import ml_service
from app.services.supabase_service import verify_admin_token

client = TestClient(app)

def test_layer1_validation_rejects_pdf():
    """Menguji fungsi pemeriksaan ekstensi dan MIME-type file (Layer 1)"""
    response = client.post(
        "/api/v1/predict",
        files={"file": ("dokumen.pdf", b"%PDF-1.4...", "application/pdf")}
    )
    assert response.status_code == 422
    assert "Tipe file tidak didukung" in response.json()["detail"]

def test_layer2_validation_corrupted_image():
    """Menguji fungsi pemeriksaan integritas byte gambar (Layer 2)"""
    fake_bytes = b"Ini adalah script palsu, bukan gambar"
    with pytest.raises(UnidentifiedImageError):
        ml_service.process_image(fake_bytes)

def test_ml_service_preprocessing_shape():
    """Menguji fungsi prapemrosesan citra (Image Preprocessing)"""
    # Membuat gambar dummy ukuran 500x300
    img = Image.new('RGB', (500, 300), color='blue')
    img_byte_arr = BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_bytes = img_byte_arr.getvalue()
    
    tensor = ml_service.process_image(img_bytes)
    
    assert isinstance(tensor, np.ndarray)
    assert tensor.shape == (1, 224, 224, 3)

@patch('app.services.supabase_service.httpx.post')
def test_verify_admin_token_invalid(mock_post):
    """Menguji verifikasi token sesi pengguna untuk Supabase"""
    # Mock response untuk simulasi token expired/invalid (status 401)
    class MockResponse:
        status_code = 401
        
    mock_post.return_value = MockResponse()
    
    with pytest.raises(ValueError, match="token tidak valid"):
        verify_admin_token("token_expired_123")

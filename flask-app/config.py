import os

dir_path = os.path.dirname(os.path.abspath(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'default_secret_key'
    EXCEL_UPLOAD_FOLDER = os.environ.get('EXCEL_UPLOAD_FOLDER') or os.path.join(dir_path, 'temp', 'uploads')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'postgresql://postgres:qwerty123@localhost'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SESSION_TYPE = 'filesystem'
    SESSION_FILE_DIR = os.environ.get('SESSION_FILE_DIR') or os.path.join(dir_path, 'temp', 'flask_session_files')
    SESSION_PERMANENT = False
    IMAGE_UPLOAD_FOLDER = os.path.join(dir_path, 'uploads', 'images')
    IMAGE_ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

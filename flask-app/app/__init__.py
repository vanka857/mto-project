from flask import Flask, current_app
from flask_sqlalchemy import SQLAlchemy
from flask_session import Session
from config import Config
import os


db = SQLAlchemy()
sess = Session()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Создание директории для файлов сессий, если она не существует
    os.makedirs(app.config['SESSION_FILE_DIR'], exist_ok=True)
    # Настройка сессий
    sess.init_app(app)

    # Инициализация для работы с базой
    db.init_app(app)

    from . import routes
    app.register_blueprint(routes.bp)

    return app

def check_database_connection():
    with current_app.app_context():  # Использование current_app для активации контекста
        try:
            db.session.is_active
            return True
        except Exception as e:
            print(f"Failed to connect to the database: {e}")
            return False

from flask import Flask, current_app
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_session import Session
from config import Config
import os


db = SQLAlchemy(session_options={"expire_on_commit": False})
migrate = Migrate()
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
    migrate.init_app(app, db)

    from .routes import bp as main_bp
    app.register_blueprint(main_bp)

    return app

def check_database_connection():
    with current_app.app_context():  # Использование current_app для активации контекста
        try:
            db.session.is_active
            return True
        except Exception as e:
            print(f"Failed to connect to the database: {e}")
            return False

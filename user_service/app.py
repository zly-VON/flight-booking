# service1/app.py

from flask import Flask
from models import db
from flask_jwt_extended import JWTManager
from datetime import timedelta
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://admin:password@user_db:5432/user_db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config["JWT_SECRET_KEY"] = "my-secret"
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

    db.init_app(app)

    limiter = Limiter(
        get_remote_address,
        default_limits=["5 per minute"]
    )
    limiter.init_app(app)

    @app.route('/')
    def home():
        return 'User Authentication Service is running!'

    return app


if __name__ == '__main__':
    app = create_app()

    import routes

    jwt = JWTManager(app)
    app.run(debug=False, host='0.0.0.0', port=5000)

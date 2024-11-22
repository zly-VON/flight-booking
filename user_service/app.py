from flask import Flask
from models import db
from flask_jwt_extended import JWTManager
from datetime import timedelta
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_socketio import SocketIO
from flask_cors import CORS

from prometheus_flask_exporter import PrometheusMetrics


socketio = SocketIO()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://admin:password@user_db:5432/user_db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config["JWT_SECRET_KEY"] = "my-secret"
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

    CORS(app)
    db.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")
    jwt = JWTManager(app)
    
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
    metrics = PrometheusMetrics(app)

    import routes

    jwt = JWTManager(app)
    socketio.run(app, host='0.0.0.0', port=5000, debug=False, allow_unsafe_werkzeug=True)

from flask import Flask
from flask_jwt_extended import JWTManager
from models import db
from redis import Redis
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from prometheus_flask_exporter import PrometheusMetrics


def create_app():
    app = Flask(__name__)
    
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://admin:password@flight_db:3306/flight_db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'my-secret'
    
    db.init_app(app)

    app.redis = Redis(host='redis', port=6379, db=0)

    limiter = Limiter(
        get_remote_address,
        default_limits=["15 per minute"]
    )
    limiter.init_app(app)

    @app.route('/')
    def home():
        return 'Flight Booking Service is running!'
    
    return app


if __name__ == '__main__':
    app = create_app()
    metrics = PrometheusMetrics(app)

    import routes

    jwt = JWTManager(app)
    app.run(debug=False, host='0.0.0.0', port=5004)

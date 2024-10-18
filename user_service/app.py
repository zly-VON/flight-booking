from flask import Flask
from models import db
from flask_jwt_extended import JWTManager
from datetime import timedelta
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_socketio import SocketIO
from flask_cors import CORS

from flask import request, jsonify
from models import User, Subscription
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash


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
    
    @app.route('/register', methods=['POST'])
    def register():
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('password') or not data.get('email'):
            return jsonify({"message": "Missing username, password, or email"}), 400
        
        if User.query.filter_by(username=data['username']).first() or User.query.filter_by(email=data['email']).first():
            return jsonify({"message": "Username or Email already exists"}), 400

        hashed_password = generate_password_hash(data['password'])

        new_user = User(
            username=data['username'],
            password=hashed_password,
            email=data['email']
        )

        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            "message": "User registered successfully",
            "userId": new_user.id
        }), 201


    @app.route('/login', methods=['POST'])
    def login():
        data = request.get_json()

        if not data or not data.get('username') or not data.get('password'):
            return jsonify({"message": "Missing username or password"}), 400

        user = User.query.filter_by(username=data['username']).first()
        
        if user and check_password_hash(user.password, data['password']):
            access_token = create_access_token(identity=user.id)
            return jsonify({
                "message": "Login successful",
                "userId": user.id,
                "token": access_token
            }), 200
        else:
            return jsonify({"message": "Invalid username or password"}), 401


    @app.route('/user-subscriptions/<int:user_id>', methods=['GET'])
    def get_user_flights(user_id):
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({"message": "User not found"}), 404
        
        subscriptions = Subscription.query.filter_by(user_id=user_id).all()
        flights = [subscription.flight_code for subscription in subscriptions]

        return jsonify({
            "userId": user_id,
            "flights": flights
        })


    return app


if __name__ == '__main__':
    app = create_app()

    import routes

    jwt = JWTManager(app)
    # app.run(debug=False, host='0.0.0.0', port=5000)
    socketio.run(app, host='0.0.0.0', port=5000, debug=False, allow_unsafe_werkzeug=True)

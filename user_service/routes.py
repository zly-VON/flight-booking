from flask import request, jsonify
from __main__ import app, db, socketio
from models import User, Subscription
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from flask_socketio import emit, join_room, leave_room
# import eventlet

# @app.route('/register', methods=['POST'])
# def register():
#     data = request.get_json()
    
#     if not data or not data.get('username') or not data.get('password') or not data.get('email'):
#         return jsonify({"message": "Missing username, password, or email"}), 400
    
#     if User.query.filter_by(username=data['username']).first() or User.query.filter_by(email=data['email']).first():
#         return jsonify({"message": "Username or Email already exists"}), 400

#     hashed_password = generate_password_hash(data['password'])

#     new_user = User(
#         username=data['username'],
#         password=hashed_password,
#         email=data['email']
#     )

#     db.session.add(new_user)
#     db.session.commit()

#     return jsonify({
#         "message": "User registered successfully",
#         "userId": new_user.id
#     }), 201


# @app.route('/login', methods=['POST'])
# def login():
#     data = request.get_json()

#     if not data or not data.get('username') or not data.get('password'):
#         return jsonify({"message": "Missing username or password"}), 400

#     user = User.query.filter_by(username=data['username']).first()
    
#     if user and check_password_hash(user.password, data['password']):
#         access_token = create_access_token(identity=user.id)
#         return jsonify({
#             "message": "Login successful",
#             "userId": user.id,
#             "token": access_token
#         }), 200
#     else:
#         return jsonify({"message": "Invalid username or password"}), 401


# @app.route('/user-subscriptions/<int:user_id>', methods=['GET'])
# def get_user_flights(user_id):
#     subscriptions = Subscription.query.filter_by(user_id=user_id).all()
#     flights = [subscription.flight_code for subscription in subscriptions]

#     return jsonify({
#         "userId": user_id,
#         "flights": flights
#     })


@socketio.on('connect')
def handle_connect():
    print("Client connected")


# # WebSocket handlers
# @socketio.on('connect')
# def handle_connect():
#     print("Client connected, boob")


@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected")


@socketio.on('subscribe')
@jwt_required()
def handle_subscription(data):
    user_id = get_jwt_identity()
    flight_code = data.get('flight_code')

    if flight_code:
        existing_subscription = Subscription.query.filter_by(user_id=user_id, flight_code=flight_code).first()

        if existing_subscription:
            emit('subscription_response', {'message': f'Already subscribed to flight updates for {flight_code}'})
            return 

        room = f'flight_updates_{flight_code}'  

        subscription = Subscription(user_id=user_id, flight_code=flight_code)
        db.session.add(subscription)
        db.session.commit()

        emit('subscription_response', {'message': f'Subscribed to flight updates for {flight_code}'})
    else:
        emit('subscription_response', {'message': 'Flight code is missing'})


@socketio.on('connect-room')
@jwt_required()
def handle_connect_room(data):
    user_id = get_jwt_identity()
    flight_code = data.get('flight_code')

    if flight_code:
        existing_subscription = Subscription.query.filter_by(user_id=user_id, flight_code=flight_code).first()

        if existing_subscription:
            room = f'flight_updates_{flight_code}'
            join_room(room)
            emit('connection_response', {'message': f'Connected to room {room} for flight updates.'})
            print(f"User {user_id} joined room {room}.")
        else:
            emit('connection_response', {'message': f'User {user_id} is not subscribed to flight {flight_code}.'})
    else:
        emit('connection_response', {'message': 'Flight code is missing'})


@socketio.on('unsubscribe')
@jwt_required()
def handle_unsubscription(data):
    user_id = get_jwt_identity()
    flight_code = data.get('flight_code')

    if flight_code:
        subscription = Subscription.query.filter_by(user_id=user_id, flight_code=flight_code).first()

        if subscription:
            db.session.delete(subscription)
            db.session.commit()

            room = f'flight_updates_{flight_code}'
            leave_room(room) 

            emit('unsubscription_response', {'message': f'Unsubscribed from flight updates for {flight_code}'})
        else:
            emit('unsubscription_response', {'message': 'No subscription found for this flight code'})
    else:
        emit('unsubscription_response', {'message': 'Flight code is missing'})


@socketio.on('disconnect-room')
@jwt_required()
def handle_disconnect_room(data):
    user_id = get_jwt_identity()
    flight_code = data.get('flight_code')

    if flight_code:
        subscription = Subscription.query.filter_by(user_id=user_id, flight_code=flight_code).first()

        if subscription:
            room = f'flight_updates_{flight_code}'
            leave_room(room)
            emit('disconnection_response', {'message': f'Disconnected from room {room}.'})
            print(f"User {user_id} left room {room}.")
        else:
            emit('disconnection_response', {'message': f'User {user_id} is not subscribed to flight {flight_code}.'})
    else:
        emit('disconnection_response', {'message': 'Flight code is missing'})


@socketio.on('broadcast_update')
def handle_flight_update(data):
    flight_code = data.get('flight_code')
    update = data.get('update')

    if flight_code and update:
        room = f'flight_updates_{flight_code}'
        emit('flight_update', {'update': update}, room=room)
    else:
        emit('flight_update', {'message': 'Flight code or update is missing'})


@app.route('/simulate-failure', methods=['GET'])
def simulate_failure():
    raise Exception("Simulated failure for testing purposes.")

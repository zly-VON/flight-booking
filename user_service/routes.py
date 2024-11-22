from flask import request, jsonify
from __main__ import app, db, socketio
from models import User, Subscription
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from flask_socketio import emit, join_room, leave_room

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

@app.route('/update-credit/<int:user_id>', methods=['PATCH'])
def update_user_credit(user_id):
    data = request.get_json()

    if 'credit' not in data:
        return jsonify({"message": "Credit amount is required"}), 400

    user = User.query.get(user_id)

    if not user:
        return jsonify({"message": "User not found"}), 404

    user.credit = data['credit']

    try:
        db.session.commit()
        return jsonify({"message": f"Credit of {user.username} updated successfully", "credit": user.credit}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error updating credit", "error": str(e)}), 500


@app.route('/profile/<int:user_id>', methods=['GET'])
def get_user_info(user_id):

    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    subscriptions = Subscription.query.filter_by(user_id=user.id).all()
    flight_codes = [subscription.flight_code for subscription in subscriptions]
    
    user_data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "credit": user.credit,
        "subscriptions": flight_codes
    }
    
    return jsonify(user_data), 200

@app.route('/deduct-credits/<int:user_id>', methods=['PATCH'])
def deduct_user_credits(user_id):
    data = request.get_json()

    if 'credit' not in data:
        return jsonify({"message": "Credit amount is required to deduct"}), 400

    try:
        credit_to_deduct = int(data['credit'])
    except ValueError:
        return jsonify({"message": "Invalid credit amount provided"}), 400

    user = User.query.get(user_id)

    if not user:
        return jsonify({"message": "User not found"}), 404

    if user.credit < credit_to_deduct:
        return jsonify({"message": "Insufficient credits"}), 400

    user.credit -= credit_to_deduct

    try:
        db.session.commit()
        return jsonify({"message": f"{credit_to_deduct} credits deducted from {user.username}", "credit": user.credit}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error deducting credits", "error": str(e)}), 500


@app.route('/refund-credits/<int:user_id>', methods=['PATCH'])
def refund_user_credits(user_id):
    data = request.get_json()

    if 'credit' not in data:
        return jsonify({"message": "Credit amount is required to refund"}), 400

    try:
        credit_to_refund = int(data['credit'])
    except ValueError:
        return jsonify({"message": "Invalid credit amount provided"}), 400

    user = User.query.get(user_id)

    if not user:
        return jsonify({"message": "User not found"}), 404

    user.credit += credit_to_refund

    try:
        db.session.commit()
        return jsonify({"message": f"{credit_to_refund} credits refunded to {user.username}", "credit": user.credit}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error refunding credits", "error": str(e)}), 500



@socketio.on('connect')
def handle_connect():
    print("Client connected")


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
    try:
        raise Exception("Simulated failure for testing purposes.")
    except Exception as e:
        app.logger.error(f"Simulated failure: {str(e)}")
        return {"message": "An error occurred. Please try again later."}, 500

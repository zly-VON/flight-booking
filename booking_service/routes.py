# service2/routes.py
from flask import request, jsonify
from __main__ import app, db
from models import Flight, Booking
from flask_jwt_extended import jwt_required, get_jwt_identity
import json

@app.route('/seed', methods=['GET'])
def seed_database():
    if Flight.query.count() == 0:
        flight_data = [
            Flight(flight_code='FL001', airline='WizzAir', departure='2024-10-01 10:00', arrival='2024-10-01 12:00', from_city='Chisinau', to_city='London', price=200, status='On Time'),
            Flight(flight_code='FL002', airline='FlyOne', departure='2024-10-02 15:00', arrival='2024-10-02 17:00', from_city='Chisinau', to_city='London', price=180, status='On Time'),
            Flight(flight_code='FL003', airline='WizzAir', departure='2024-10-03 09:00', arrival='2024-10-03 11:00', from_city='Chisinau', to_city='Berlin', price=220, status='On Time')
        ]

        db.session.add_all(flight_data)
        db.session.commit()
        return jsonify({"message": "Default flight data added."}), 201
    else:
        return jsonify({"message": "Flight data already exists."}), 200

@app.route('/search-flights', methods=['GET'])
def search_flights():
    from_city = request.args.get('from')
    to_city = request.args.get('to')

    
    cache_key = f"flights:{from_city}:{to_city}"

    cached_result = app.redis.get(cache_key)
    if cached_result:
        data = json.loads(cached_result)
        return jsonify(message='Results retrieved from cache', flights=data['flights']), 200

    flights = Flight.query.filter_by(from_city=from_city, to_city=to_city).all()
    
    if not flights:
        return jsonify({"message": "No flights found"}), 404
    
    result = []
    for flight in flights:
        result.append({
            "flightCode": flight.flight_code,
            "airline": flight.airline,
            "departure": flight.departure,
            "arrival": flight.arrival,
            "price": flight.price,
            "status": flight.status
        })

    app.redis.set(cache_key, json.dumps({"flights": result}), ex=3600,)
    
    return jsonify({"flights": result}), 200

@app.route('/book-flight', methods=['POST'])
@jwt_required()
def book_flight():
    data = request.get_json()

    user_id = get_jwt_identity()
    flight_code = data.get('flightId')
    payment_method = data.get('paymentMethod')

    flight = Flight.query.filter_by(flight_code=flight_code).first()
    
    if not flight:
        return jsonify({"message": "Flight not found"}), 404
    
    new_booking = Booking(
        user_id=user_id,
        flight_id=flight.id,
        status='Confirmed',
        payment_method=payment_method
    )
    
    db.session.add(new_booking)
    db.session.commit()

    return jsonify({
        "message": "Flight booked successfully",
        "bookingId": new_booking.id,
        "flightId": flight.flight_code,
        "price": flight.price
    }), 201

@app.route('/bookings/<int:user_id>', methods=['GET'])
def get_user_bookings(user_id):
    bookings = Booking.query.filter_by(user_id=user_id).all()
    
    if not bookings:
        return jsonify({"message": "No bookings found for this user"}), 404
    
    result = []
    for booking in bookings:
        result.append({
            "bookingId": booking.id,
            "flightCode": booking.flight.flight_code,
            "bookingStatus": booking.status,
            "departure": booking.flight.departure,
            "flightStatus": booking.flight.status
        })

    return jsonify({
        "userId": user_id,
        "bookings": result
    }), 200

@app.route('/cancel-booking/<int:booking_id>', methods=['DELETE'])
@jwt_required()
def cancel_booking(booking_id):
    booking = Booking.query.filter_by(id=booking_id).first()
    
    if not booking:
        return jsonify({"message": "Booking not found"}), 404
    
    booking.status = 'Canceled'
    db.session.commit()

    return jsonify({"message": "Booking canceled successfully"}), 200

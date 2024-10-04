from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Flight(db.Model):
    __tablename__ = 'flights'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    flight_code = db.Column(db.String(10), unique=True, nullable=False)
    airline = db.Column(db.String(100), nullable=False)
    departure = db.Column(db.String(30), nullable=False)
    arrival = db.Column(db.String(30), nullable=False)
    from_city = db.Column(db.String(100), nullable=False)
    to_city = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(30), nullable=False)

class Booking(db.Model):
    __tablename__ = 'bookings'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, nullable=False)
    flight_id = db.Column(db.Integer, db.ForeignKey('flights.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='Confirmed')
    payment_method = db.Column(db.String(20), nullable=False)

    flight = db.relationship('Flight', backref=db.backref('bookings', lazy=True))

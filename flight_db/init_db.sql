\c flight_db;

CREATE TABLE flights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flight_code VARCHAR(10) UNIQUE NOT NULL,
    airline VARCHAR(100) NOT NULL,
    departure VARCHAR(30) NOT NULL,
    arrival VARCHAR(30) NOT NULL,
    from_city VARCHAR(100) NOT NULL,
    to_city VARCHAR(100) NOT NULL,
    price INT NOT NULL,
    status VARCHAR(30) NOT NULL
);

CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    flight_id INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Confirmed',
    payment_method VARCHAR(20) NOT NULL,
    FOREIGN KEY (flight_id) REFERENCES flights(id)
);

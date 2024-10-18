USE flight_db;

CREATE TABLE IF NOT EXISTS flights (
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

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    flight_id INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Confirmed',
    payment_method VARCHAR(20) NOT NULL,
    FOREIGN KEY (flight_id) REFERENCES flights(id)
);

import pytest
from app import create_app
from models import db, User, Subscription
from flask_jwt_extended import create_access_token
from sqlalchemy import text


@pytest.fixture
def app():
    app = create_app()

    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://admin:password@user_db:5432/user_db'
    with app.app_context():
        db.session.execute(text("DELETE FROM users;"))
        db.session.execute(text("DELETE FROM subscriptions;"))
        db.session.commit()
        yield app
        db.session.execute(text("DELETE FROM users;"))
        db.session.execute(text("DELETE FROM subscriptions;"))
        db.session.commit()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def add_user(client):
    user_data = {
        'username': 'testuser',
        'password': 'testpass',
        'email': 'test@example.com'
    }
    response = client.post('/register', json=user_data)
    return response.json['userId']

def test_home(client):
    response = client.get('/') 
    assert response.status_code == 200
    assert response.data.decode('utf-8') == 'User Authentication Service is running!' 

def test_register(client):
    response = client.post('/register', json={
        'username': 'newuser',
        'password': 'newpass',
        'email': 'new@example.com'
    })
    
    assert response.status_code == 201
    assert 'userId' in response.json

def test_register_existing_username(client, add_user):
    response = client.post('/register', json={
        'username': 'testuser',
        'password': 'password',
        'email': 'another@example.com'
    })
    
    assert response.status_code == 400
    assert response.json['message'] == "Username or Email already exists"

def test_register_missing_fields(client):
    response = client.post('/register', json={
        'username': 'userwithoutpass',
        'email': 'no_password@example.com'
    })
    assert response.status_code == 400
    assert response.json['message'] == "Missing username, password, or email"

def test_register_existing_email(client, add_user):
    response = client.post('/register', json={
        'username': 'anotheruser',
        'password': 'anotherpassword',
        'email': 'test@example.com'
    })
    assert response.status_code == 400
    assert response.json['message'] == "Username or Email already exists"

def test_login(client, add_user):
    response = client.post('/login', json={
        'username': 'testuser',
        'password': 'testpass'
    })

    assert response.status_code == 200
    assert 'token' in response.json

def test_login_invalid_credentials(client):
    response = client.post('/login', json={
        'username': 'invaliduser',
        'password': 'wrongpass'
    })
    
    assert response.status_code == 401
    assert response.json['message'] == "Invalid username or password"

def test_get_user_subscriptions(client, add_user):
    user_id = add_user
    subscription = Subscription(user_id=user_id, flight_code='FL123')
    db.session.add(subscription)
    db.session.commit()

    response = client.get(f'/user-subscriptions/{user_id}')

    assert response.status_code == 200
    assert response.json['flights'] == ['FL123']

def test_get_user_subscriptions_nonexistent_user(client):
    response = client.get('/user-subscriptions/999')

    assert response.status_code == 404

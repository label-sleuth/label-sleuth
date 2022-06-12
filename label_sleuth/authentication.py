import functools

from flask import current_app, jsonify, make_response
from flask_httpauth import HTTPTokenAuth


auth = HTTPTokenAuth(scheme='Bearer')


def login_if_required(function):
    @functools.wraps(function)
    def wrapper(*args, **kwargs):
        if current_app.config["CONFIGURATION"].login_required:
            wrapped_func = auth.login_required(function)
            return wrapped_func(*args, **kwargs)
        else:
            return function(*args, **kwargs)
    return wrapper


def authenticate_response(user):
    return make_response(jsonify(user), 200)


def verify_password(username, password):
    if username in current_app.users:
        user = current_app.users[username]
        return user and user.password == password
    else:
        return False


@auth.verify_token
def verify_token(token):
    if not token:
        return False
    return token in current_app.tokens

#
#  Copyright (c) 2022 IBM Corp.
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#  http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#

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

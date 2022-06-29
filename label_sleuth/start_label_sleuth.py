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

import os
from logging.handlers import RotatingFileHandler
from pathlib import Path
from argparse import ArgumentParser
import logging

from label_sleuth import app
from label_sleuth.config import load_config

PROJECT_ROOT = os.path.abspath(os.path.join(__file__, os.pardir))


def add_file_logger(output_path):
    """
    add a rotating file logger. Files will be written to <output_path>/logs/
    """
    log_dir = os.path.join(output_path, "logs")
    os.makedirs(log_dir, exist_ok=True)
    handler = RotatingFileHandler(
        os.path.join(log_dir, "label-sleuth.log"), maxBytes=(1048576 * 5), backupCount=7
    )

    formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
    handler.setFormatter(formatter)
    logging.getLogger().addHandler(handler)


if __name__ == '__main__':
    parser = ArgumentParser()

    parser.add_argument('--host', type=str,
                        help='Hostname or IP address (string) on which to listen. Default is localhost',
                        default="localhost")
    parser.add_argument('--port', type=int, help='Port number. Default is 8000', default=8000)

    default_output = os.path.join(str(Path.home()), 'label-sleuth')
    parser.add_argument('--output_path', type=str, help=f'output directory. Default is your home directory: '
                                                        f'{default_output}', default=default_output)
    config_path = os.path.join(PROJECT_ROOT, "config.json")
    parser.add_argument('--config_path', type=str, help=f'Config file path. Default is {config_path}',
                        default=config_path)

    parser.add_argument('--num_serving_threads', type=int, help=f'Number of threads to use in waitress',
                        default=10)

    args = parser.parse_args()
    os.makedirs(args.output_path, exist_ok=True)

    add_file_logger(args.output_path) # log to file in addition to the console
    logging.info(f"Starting label-sleuth using config file {args.config_path}. Output directory is {args.output_path}")
    logging.info("(Starting the service for the first time may take a little longer)")
    curr_app = app.create_app(config=load_config(args.config_path),
                              output_dir=args.output_path)

    app.start_server(curr_app, args.host, args.port, args.num_serving_threads)

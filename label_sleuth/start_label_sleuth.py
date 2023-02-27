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

import logging
import os
import requests
import tempfile

from logging.handlers import RotatingFileHandler
from pathlib import Path
from argparse import ArgumentParser

# some operations are not yet supported by the pytorch MPS architecture, and for these operations a cpu fallback option
# needs to be specified. This environment variable must be set before importing the torch library.
os.environ['PYTORCH_ENABLE_MPS_FALLBACK'] = '1'

from label_sleuth import app
from label_sleuth.config import load_config
from label_sleuth.config import Configuration

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


def load_sample_corpus(app, corpus_name):
    if corpus_name not in app.orchestrator_api.get_all_dataset_names():
        temp_dir = os.path.join(app.config["output_dir"], "temp", "csv_upload")
        os.makedirs(temp_dir, exist_ok=True)
        temp_file_path = os.path.join(temp_dir, f"{next(tempfile._get_candidate_names())}.csv")
        logging.info(f'Downloading sample corpus "{corpus_name}" from https://github.com/label-sleuth/data-examples/')
        response = requests.get(
            f"https://github.com/label-sleuth/data-examples/raw/main/{corpus_name}/{corpus_name}.csv")
        if response.status_code != 200:
            raise Exception(f'Corpus "{corpus_name}" could not be retrieved. Please make sure it exists in '
                            f'https://github.com/label-sleuth/data-examples/')

        with open(temp_file_path, 'wb') as f:
            f.write(response.content)
        app.orchestrator_api.add_documents_from_file(corpus_name, temp_file_path)


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

    parser.add_argument('--load_sample_corpus', type=str,
                        help=f'Name of a sample corpus from https://github.com/label-sleuth/data-examples/, to be '
                             f'loaded at startup', default=None)

    for attr_name, attr_type in Configuration.__annotations__.items():
        allowed_types = [int, str, bool]
        ignore_list = ["users"]
        if attr_type in ignore_list:
            continue
        if attr_type in allowed_types:
            parser.add_argument(f"--{attr_name}", type=attr_type, required=False)
        else:
            parser.add_argument(f"--{attr_name}", type=str, required=False)

    args = parser.parse_args()
    os.makedirs(args.output_path, exist_ok=True)

    add_file_logger(args.output_path)  # log to file in addition to the console
    logging.info(f"Starting label-sleuth using config file {args.config_path}. Output directory is {args.output_path}")
    logging.info("(Starting the service for the first time may take a little longer)")
    curr_app = app.create_app(config=load_config(args.config_path, vars(args)),
                              output_dir=args.output_path)
    if args.load_sample_corpus:
        load_sample_corpus(curr_app, args.load_sample_corpus)

    app.start_server(curr_app, args.host, args.port, args.num_serving_threads)

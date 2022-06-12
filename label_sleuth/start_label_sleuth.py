import os
from argparse import ArgumentParser

from label_sleuth import app
from label_sleuth.config import load_config

PROJECT_ROOT = os.path.abspath(os.path.join(__file__, os.pardir))


if __name__ == '__main__':
    parser = ArgumentParser()
    parser.add_argument('--port', type=int, help='Port number. Default is 8000', default=8000)
    args = parser.parse_args()
    curr_app = app.create_app(config=load_config(os.path.join(PROJECT_ROOT, "config.json")),
                              output_dir=os.path.join(PROJECT_ROOT, 'output'))
    app.start_server(curr_app, args.port)

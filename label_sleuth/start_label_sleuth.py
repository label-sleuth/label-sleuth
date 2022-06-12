import os
from argparse import ArgumentParser

from label_sleuth.config import load_config

os.environ['SLEUTH_ROOT'] = os.path.abspath(os.path.join(__file__, os.pardir, ''))


if __name__ == '__main__':
    from label_sleuth import app
    parser = ArgumentParser()
    parser.add_argument('--port', type=int, help='Port number. Default is 8000', default=8000)
    args = parser.parse_args()
    root_dir = os.environ.get('SLEUTH_ROOT')
    app.create_app(load_config(os.path.join(root_dir, "config.json")),
                  root_dir)
    app.start_server(args.port)

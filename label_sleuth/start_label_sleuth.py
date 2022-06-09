import os
from argparse import ArgumentParser

os.environ['SLEUTH_ROOT'] = os.path.abspath(os.path.join(__file__, os.pardir, ''))


if __name__ == '__main__':
    from label_sleuth import app
    parser = ArgumentParser()
    parser.add_argument('--port', type=int, help='Port number. Default is 8000', default=8000)
    args = parser.parse_args()
    app.start_server(args.port)

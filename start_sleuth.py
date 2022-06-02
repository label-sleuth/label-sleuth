import os
from argparse import ArgumentParser

os.environ['SLEUTH_ROOT'] = os.path.abspath(os.path.join(__file__, os.pardir, 'lrtc_lib'))


if __name__ == '__main__':
    from lrtc_lib import app
    parser = ArgumentParser()
    parser.add_argument('--port', type=int, help='Port number. Default is 8000', default=8000)
    args = parser.parse_args()
    app.start_server(args.port)

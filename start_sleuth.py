from argparse import ArgumentParser
from lrtc_lib import app

if __name__ == '__main__':
    parser = ArgumentParser()
    parser.add_argument('--port', type=int, help='Port number. Default is 8000',default=8000)
    args = parser.parse_args()
    app.start_server(args.port)
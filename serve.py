import http.server, os, sys
from http.server import ThreadingHTTPServer

os.chdir(os.path.dirname(os.path.abspath(__file__)))

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.jsx': 'application/javascript',
        '.js': 'application/javascript',
        '.mjs': 'application/javascript',
        '.json': 'application/json',
        '.css': 'text/css',
        '': 'application/octet-stream',
    }
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, *a):
        pass

PORT = 8099
httpd = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
print(f"Serving on {PORT}", flush=True)
httpd.serve_forever()

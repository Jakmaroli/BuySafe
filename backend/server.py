"""
Local HTTP Server for BuySafe Backend
======================================
Provides a lightweight local API bridge wrapping lambda_handler directly.
Zero external dependencies (uses standard library http.server).
"""

import http.server
import json
import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from lambda_function import lambda_handler


class BuySafeLocalHandler(http.server.BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        # Clean console logging
        sys.stderr.write(f"[BuySafe Server] {self.address_string()} - {format % args}\n")

    def do_OPTIONS(self):
        event = {
            "requestContext": {"http": {"method": "OPTIONS"}},
            "httpMethod": "OPTIONS"
        }
        res = lambda_handler(event, None)
        self._send_lambda_response(res)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8") if length > 0 else ""
        event = {
            "httpMethod": "POST",
            "rawPath": self.path,
            "body": body
        }
        res = lambda_handler(event, None)
        self._send_lambda_response(res)

    def do_GET(self):
        event = {
            "httpMethod": "GET",
            "rawPath": self.path,
            "action": "health" if "/health" in self.path else ""
        }
        res = lambda_handler(event, None)
        self._send_lambda_response(res)

    def _send_lambda_response(self, res):
        self.send_response(res["statusCode"])
        headers = res.get("headers", {})
        for key, value in headers.items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(res["body"].encode("utf-8"))


def run_server(port=8000):
    server_address = ("", port)
    httpd = http.server.ThreadingHTTPServer(server_address, BuySafeLocalHandler)
    print(f"BuySafe local API server listening on http://localhost:{port}")
    httpd.serve_forever()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    run_server(port)

#!/usr/bin/env python3
"""Servidor HTTP con cabeceras anti-cache para desarrollo.
Sirve estaticamente desde el directorio actual enviando
Cache-Control: no-store, must-revalidate en cada respuesta,
para que el navegador siempre cargue la version fresca."""
import http.server
import socketserver
import os

PORT = 12000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

socketserver.TCPServer.allow_reuse_address = True


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


if __name__ == "__main__":
    with socketserver.TCPServer(("0.0.0.0", PORT), NoCacheHandler) as httpd:
        print(f"Serving {DIRECTORY} on port {PORT} (no-cache)")
        httpd.serve_forever()

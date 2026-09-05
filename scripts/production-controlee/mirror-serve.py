# Miroir local d'un site servi : chaque chemin est récupéré une fois par curl (via le proxy) puis servi en local.
import http.server, os, subprocess, sys, mimetypes, urllib.parse
PORT, ORIGINE, CACHE = int(sys.argv[1]), sys.argv[2].rstrip('/'), sys.argv[3]
os.makedirs(CACHE, exist_ok=True)
class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        chemin = urllib.parse.urlsplit(self.path).path
        if chemin.endswith('/'): chemin += 'index.html'
        local = os.path.join(CACHE, chemin.lstrip('/').replace('/', '__') or 'index.html')
        if not os.path.exists(local):
            r = subprocess.run(['curl', '-sS', '-L', '-o', local, '-w', '%{http_code}', ORIGINE + chemin], capture_output=True, text=True)
            if r.stdout.strip() != '200':
                try: os.remove(local)
                except OSError: pass
                self.send_response(404); self.end_headers(); return
        ctype = mimetypes.guess_type(chemin)[0] or 'application/octet-stream'
        if chemin.endswith('.js'): ctype = 'text/javascript'
        with open(local, 'rb') as f: corps = f.read()
        self.send_response(200); self.send_header('Content-Type', ctype); self.send_header('Content-Length', str(len(corps))); self.end_headers(); self.wfile.write(corps)
http.server.ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()

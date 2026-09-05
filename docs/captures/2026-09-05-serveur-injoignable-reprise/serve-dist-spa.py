# Sert un dossier de build (dist) en local avec repli SPA : tout chemin sans extension -> index.html (comme la réécriture Netlify).
import http.server, os, sys, mimetypes
PORT, RACINE = int(sys.argv[1]), sys.argv[2]
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=RACINE, **k)
    def log_message(self, *a): pass
    def do_GET(self):
        chemin = self.path.split('?')[0].split('#')[0]
        local = os.path.join(RACINE, chemin.lstrip('/'))
        if chemin != '/' and (not os.path.exists(local) or os.path.isdir(local)) and '.' not in os.path.basename(chemin):
            self.path = '/index.html'
        return super().do_GET()
http.server.ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()

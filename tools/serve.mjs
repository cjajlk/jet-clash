import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.md':'text/plain; charset=utf-8','.json':'application/json'};
const server=http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404);res.end('Fichier introuvable');}});
server.listen(4173,'127.0.0.1',()=>console.log('JetClash : http://localhost:4173 — Ctrl+C pour arrêter.'));
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'Le port 4173 est occupé. Ferme le serveur précédent.':error.message);process.exitCode=1;});

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { networkInterfaces } from 'node:os';
const lan=process.argv.includes('--lan'),port=lan?4174:4173;
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.md':'text/plain; charset=utf-8','.json':'application/json'};
const server=http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(lan&&!/^\/(?:$|index\.html$|(?:src|styles|assets)\/)/.test(pathname)){res.writeHead(403);res.end();return;}const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404);res.end('Fichier introuvable');}});
server.listen(port,lan?'0.0.0.0':'127.0.0.1',()=>{
  console.log(`JetClash : http://localhost:${port} — Ctrl+C pour arrêter.`);
  if(lan){console.log('Téléphone : même réseau Wi-Fi que ce PC, puis ouvrir une adresse ci-dessous.');for(const list of Object.values(networkInterfaces()))for(const net of list||[])if(net.family==='IPv4'&&!net.internal)console.log(`http://${net.address}:${port}`);}
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`Le port ${port} est occupé. Ferme le serveur précédent.`:error.message);process.exitCode=1;});

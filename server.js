const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');
const INDEX_FILE = path.join(__dirname, 'index.html');

function getDefaultDatabase() {
    return {
        appTitle: "🚓 CONTROLE DE VIATURAS - FROTA 1ª CIA DO 1º BPTRAN",
        lastStatusUpdate: new Date().toLocaleString('pt-BR'),
        customCias: ["Batalhão", "1ª Cia", "2ª Cia", "3ª Cia", "4ª Cia", "CTT"],
        customModels: ["BASE MÓVEL", "CARGO", "DUSTER", "GUINCHO", "RANGER", "S-10", "SPIN", "TRAIL BLAZER", "XT-660", "MASTER", "OUTRO"],
        customPelotoes: ["1º PEL", "2º PEL", "3º PEL", "4º PEL", "5º PEL", "6º PEL", "7º PEL", "8º PEL", "DEJEM", "DELEGADA", "ADM"],
        customStatuses: ["OPERANDO", "BAIXADA", "DESCARGA", "ADM"],
        customLocais: ["ADM", "BASE", "CONCESSIONÁRIA", "CPTRAN", "OFICINA", "PÁTIO", "EAP", "OUTRO"],
        customQuickReasons: [
            { key: "ARREFECIMENTO", label: "Arrefecimento" },
            { key: "ARRANQUE", label: "Arranque" },
            { key: "BATERIA", label: "Bateria" },
            { key: "CÂMBIO", label: "Câmbio" },
            { key: "EMBREAGEM", label: "Embreagem" },
            { key: "LUMINOSOS", label: "Luminosos" },
            { key: "MOTOR", label: "Motor" },
            { key: "PNEU", label: "Pneu" },
            { key: "RÁDIO", label: "Rádio" },
            { key: "SONORO", label: "Sonoro" },
            { key: "DESCARGA", label: "Descarga" }
        ],
        records: [],
        updatedAt: new Date().toISOString()
    };
}

function getDatabase() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const raw = fs.readFileSync(DB_FILE, 'utf-8');
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                return parsed;
            }
        }
    } catch (err) {
        console.error('Erro ao ler database.json:', err.message);
    }
    const initial = getDefaultDatabase();
    saveDatabase(initial);
    return initial;
}

function saveDatabase(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (err) {
        console.error('Erro ao salvar database.json:', err.message);
        return false;
    }
}

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (pathname === '/api/frota' || pathname === '/api/dados' || pathname === '/api/database' || pathname === '/api/oleo') {
        if (req.method === 'GET') {
            const db = getDatabase();
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify(db));
        }

        if (req.method === 'POST' || req.method === 'PUT') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
                if (body.length > 50 * 1024 * 1024) {
                    req.destroy();
                }
            });

            req.on('end', () => {
                try {
                    const payload = JSON.parse(body);
                    const currentDb = getDatabase();
                    const updatedDb = {
                        appTitle: payload.appTitle || currentDb.appTitle || "🚓 CONTROLE DE VIATURAS - FROTA 1ª CIA DO 1º BPTRAN",
                        lastStatusUpdate: payload.lastStatusUpdate || currentDb.lastStatusUpdate || new Date().toLocaleString('pt-BR'),
                        customCias: Array.isArray(payload.customCias) ? payload.customCias : (currentDb.customCias || []),
                        customModels: Array.isArray(payload.customModels) ? payload.customModels : (currentDb.customModels || []),
                        customPelotoes: Array.isArray(payload.customPelotoes) ? payload.customPelotoes : (currentDb.customPelotoes || []),
                        customStatuses: Array.isArray(payload.customStatuses) ? payload.customStatuses : (currentDb.customStatuses || []),
                        customLocais: Array.isArray(payload.customLocais) ? payload.customLocais : (currentDb.customLocais || []),
                        customQuickReasons: Array.isArray(payload.customQuickReasons) ? payload.customQuickReasons : (currentDb.customQuickReasons || []),
                        records: Array.isArray(payload.records) ? payload.records : (currentDb.records || []),
                        updatedAt: new Date().toISOString()
                    };

                    const saved = saveDatabase(updatedDb);
                    if (saved) {
                        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                        return res.end(JSON.stringify({
                            success: true,
                            message: 'Dados da frota sincronizados com sucesso no servidor online',
                            updatedAt: updatedDb.updatedAt,
                            data: updatedDb
                        }));
                    } else {
                        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                        return res.end(JSON.stringify({ error: 'Erro ao salvar no banco de dados do servidor' }));
                    }
                } catch (err) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    return res.end(JSON.stringify({ error: 'Payload JSON inválido: ' + err.message }));
                }
            });
            return;
        }
    }

    if (pathname === '/api/status') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
            status: 'online',
            service: 'Painel de Controle de Viaturas (VTR) - 1º BPTran',
            timestamp: new Date().toISOString()
        }));
    }

    let sanitizedPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    let filePath = path.join(__dirname, sanitizedPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'text/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml'
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        return fs.createReadStream(filePath).pipe(res);
    }

    if (fs.existsSync(INDEX_FILE)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return fs.createReadStream(INDEX_FILE).pipe(res);
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
});

server.listen(PORT, () => {
    console.log('Servidor da Frota de Viaturas (VTR) online na porta ' + PORT);
});

import express from 'express';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root of main project (two levels up from web-host/src)
const root = path.resolve(__dirname, '..', '..');

// --------------------------- Unified Instrument Config ----------------------
import fsPromises from 'fs/promises';

const DEFAULT_CONFIG = { name: 'MyInstrument', width: 400, height: 512 };

function parseArgs() {
  const out = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.split('=', 2);
      const key = k.replace(/^--/, '');
      if (v !== undefined) {
        out[key] = v;
      } else if (i + 1 < argv.length && !argv[i + 1].startsWith('-')) {
        out[key] = argv[++i];
      } else {
        out[key] = true;
      }
    } else if (a === '-i') {
      out.instrument = argv[++i];
    } else if (a === '-w') {
      out.width = argv[++i];
    } else if (a === '-h') {
      out.height = argv[++i];
    } else if (a === '-c') {
      out.config = argv[++i];
    }
  }
  return out;
}

function safeInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
}

function sanitizeName(name) {
  let out = (name || '').trim().replace(/[^A-Za-z0-9_-]/g, '');
  if (!out) out = DEFAULT_CONFIG.name;
  return out;
}

function loadFileJSON(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[InstrumentConfig] Failed to read JSON config', filePath, err.message);
  }
  return {};
}

function resolveConfig() {
  const args = parseArgs();
  const cfg = { ...DEFAULT_CONFIG };

  const configPath = args.config || process.env.INSTRUMENT_CONFIG || path.join(root, 'instrument.config.json');
  const fileCfg = loadFileJSON(configPath);
  if (fileCfg.name) cfg.name = fileCfg.name;
  if (fileCfg.width) cfg.width = safeInt(fileCfg.width, cfg.width);
  if (fileCfg.height) cfg.height = safeInt(fileCfg.height, cfg.height);

  if (process.env.INSTRUMENT_NAME) cfg.name = process.env.INSTRUMENT_NAME;
  if (process.env.INSTRUMENT_WIDTH) cfg.width = safeInt(process.env.INSTRUMENT_WIDTH, cfg.width);
  if (process.env.INSTRUMENT_HEIGHT) cfg.height = safeInt(process.env.INSTRUMENT_HEIGHT, cfg.height);

  if (args.instrument) cfg.name = args.instrument;
  if (args.width) cfg.width = safeInt(args.width, cfg.width);
  if (args.height) cfg.height = safeInt(args.height, cfg.height);

  cfg.name = sanitizeName(cfg.name);

  return {
    name: cfg.name,
    width: cfg.width,
    height: cfg.height,
    sourceFile: fs.existsSync(configPath) ? configPath : null
  };
}

const instrumentConfig = resolveConfig();
const instrumentName = instrumentConfig.name;
const INSTRUMENT_WIDTH = instrumentConfig.width;
const INSTRUMENT_HEIGHT = instrumentConfig.height;

const buildDir = path.join(root, 'build');
const instrumentHtml = path.join(root, `${instrumentName}.html`);

const app = express();
const PORT = process.env.PORT || 5173;

app.use(compression());
app.use(morgan('dev'));

// Serve build assets (JS/CSS) under /static
app.use('/static', express.static(buildDir));

// Serve additional public assets (like the import-script loader)
const publicDir = path.join(__dirname, '..', 'public');
app.use('/_public', express.static(publicDir));

// MSFS-like virtual path mapping for instrument JS
// e.g. /Pages/VCockpit/Instruments/<Instrument>/<Instrument>.js
app.get(`/Pages/VCockpit/Instruments/${instrumentName}/${instrumentName}.js`, (_req, res) => {
  res.sendFile(path.join(buildDir, `${instrumentName}.js`));
});

// Also expose the stylesheet at root path used by original fragment
app.get(`/${instrumentName}.css`, (_req, res) => {
  res.type('text/css');
  res.sendFile(path.join(buildDir, `${instrumentName}.css`));
});

// Optionally expose the whole build directory under the VCockpit instrumentation root
app.use(`/Pages/VCockpit/Instruments/${instrumentName}`, express.static(buildDir));

// Dimensions now come from config; retained comments for clarity.

async function sendInstrument(res) {
  // Inject loader script tag before closing body or at end of file
  try {
    // Attempt to read the instrument html; if missing, provide a helpful message
    let data;
    try {
      data = await fsPromises.readFile(instrumentHtml, 'utf8');
    } catch (e) {
      data = `<div style="padding:1rem;color:#ddd;font:14px/1.4 Segoe UI, sans-serif;">` +
              `<h2 style="margin-top:0;">Missing instrument HTML</h2>` +
              `<p>Expected file <code>${instrumentName}.html</code> at: <pre style="white-space:pre-wrap;">${instrumentHtml}</pre></p>` +
              `<p>Create this file (e.g. by copying your existing fragment) and restart or cause a reload.</p>` +
              `</div>`;
    }
      const injection = [
        '<script src="/_public/coherent-sync-emulator.js"></script>',
        '<script src="/_public/base-instrument-emulator.js"></script>',
        '<script src="/_public/simvar-pre.js"></script>',
        '<script src="/_public/simvar-emulator.js"></script>',
        '<script src="/_public/runway-utils-emulator.js"></script>',
        '<script src="/_public/avionics-utils-emulator.js"></script>',
        '<script src="/_public/import-script-loader.js"></script>'
      ].join('\n');
      const loaderTag = `\n${injection}\n`;
      // We want to keep original instrument file unchanged; we wrap it in a host frame here.
      // Provide a fixed 400x500 area: __instrument_frame contains __instrument_host (target for stamping).
      const customVars = `--viewportWidth:${INSTRUMENT_WIDTH};--viewportHeight:${INSTRUMENT_HEIGHT};--viewportHeightRatio:1;--viewportWidthRatio:1;--currentPageHeight:225;--uiScale:1;--screenHeight:225;--unscaledScreenHeight:225;--touchMode:0;--font:var(--font-en-GB,var(--font-Default));--minimalFontSize:18;--fontSizeDeviceButton:calc(var(--screenHeight)*(14.94px / 1080));--fontSizeParagraph:calc(var(--screenHeight)*(18px / 1080));--fontSizeDefault:calc(var(--screenHeight)*(24px / 1080));--fontSizeMedium:calc(var(--screenHeight)*(30px / 1080));--fontSizeBig:calc(var(--screenHeight)*(36px / 1080));--fontSizeXXL:calc(var(--screenHeight)*(48px / 1080));--backgroundColorPanel:rgba(0,0,0,0.2);--backgroundColorComponent:rgba(0,0,0,0.1);--backgroundOpacityPanel:0.5;--backgroundOpacityComponent:0.2;--primaryColor:var(--color-cyan);--accentColor:var(--color-yellow);`;
  const frameStyles = `:root{${customVars}}body{background:#0c141a;margin:0;padding:16px;font-family:Segoe UI, sans-serif;display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap;}#__instrument_frame{width:${INSTRUMENT_WIDTH}px !important;height:${INSTRUMENT_HEIGHT}px !important;position:relative;background:#05080c;border:1px solid #1c2730;box-shadow:0 4px 18px rgba(0,0,0,0.6),0 0 12px rgba(0,180,255,0.15) inset;overflow:hidden;border-radius:8px;}#__instrument_frame:before{content:'';position:absolute;inset:0;background:linear-gradient(145deg,rgba(0,160,255,0.05),rgba(0,40,70,0.08));pointer-events:none;}#__instrument_host,.instrument-root{width:100%;height:100%;}#__instrument_frame #InstrumentContent{width:${INSTRUMENT_WIDTH}px !important;min-width:${INSTRUMENT_WIDTH}px !important;max-width:${INSTRUMENT_WIDTH}px !important;height:${INSTRUMENT_HEIGHT}px !important;min-height:${INSTRUMENT_HEIGHT}px !important;max-height:${INSTRUMENT_HEIGHT}px !important;display:block;aspect-ratio:auto !important;position:relative;box-sizing:border-box;overflow:hidden;}`;
      // Compose full HTML document regardless of original form (original was fragment with template + links)
  const diagnosticsScript = `<script>(function(){function enforce(tag){if(!tag)return;tag.style.width='${INSTRUMENT_WIDTH}px';tag.style.height='${INSTRUMENT_HEIGHT}px';tag.style.setProperty('width','${INSTRUMENT_WIDTH}px','important');tag.style.setProperty('height','${INSTRUMENT_HEIGHT}px','important');}
  function log(){var c=document.getElementById('InstrumentContent');if(c){var r=c.getBoundingClientRect();console.info('[InstrumentHost] InstrumentContent size',r.width+'x'+r.height);if(Math.round(r.height)!==${INSTRUMENT_HEIGHT}||Math.round(r.width)!==${INSTRUMENT_WIDTH}){console.warn('[InstrumentHost] correcting to ${INSTRUMENT_WIDTH}x${INSTRUMENT_HEIGHT}');enforce(c);setTimeout(log,100);return;}}}
  window.addEventListener('load',()=>{log();var c=document.getElementById('InstrumentContent');if(c){var mo=new MutationObserver(()=>{var r=c.getBoundingClientRect();if(Math.round(r.height)!==${INSTRUMENT_HEIGHT}||Math.round(r.width)!==${INSTRUMENT_WIDTH}){enforce(c);} });mo.observe(c,{attributes:true,attributeFilter:['style','class']});}});})();</script>`;
  const out = `<!DOCTYPE html>\n<html><head><meta charset='utf-8'><title>${instrumentName} Host</title><style>${frameStyles}</style></head><body><div id='__instrument_frame'><div id='__instrument_host'></div>${data}</div>${loaderTag}${diagnosticsScript}</body></html>`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(out);
  } catch (err) {
    console.error('Error preparing instrument output:', err);
    res.status(500).send('Error loading instrument');
  }
}

app.get('/', (_req, res) => sendInstrument(res));

// Fallback: serve instrument file for any non-API route
app.get('*', (_req, res) => sendInstrument(res));

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`${instrumentName} host running on http://localhost:${PORT}`);
  console.log(`Instrument HTML: ${instrumentHtml}`);
  console.log(`Dimensions: ${INSTRUMENT_WIDTH}x${INSTRUMENT_HEIGHT}`);
  if (instrumentConfig.sourceFile) {
    console.log(`Config file: ${instrumentConfig.sourceFile}`);
  } else {
    console.log('Config file: (none found, using defaults / overrides)');
  }
  console.log(`JS path: /Pages/VCockpit/Instruments/${instrumentName}/${instrumentName}.js`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

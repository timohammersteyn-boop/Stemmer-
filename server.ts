import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Server-side Gemini API endpoint for dramaturgical DJ playlist parsing
app.post('/api/story-parse', async (req, res) => {
  try {
    const { userStory, rawTracksText } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `Du bist der KI-Co-Pilot und dramaturgische Dramaturg für die Live-Remix-Workstation STEMSDINGS ("PLAY MUSIC DIFFERENT").
Der Nutzer will folgende Geschichte / Spannungsbogen mit seinem DJ-Set erzählen:
"${userStory || '2 Stunden Club-Dramaturgie: Start mit Deep Groove, Peak bei treibendem Acid Techno, hypnotisches Outro.'}"

Hier ist seine Track-Library (Roh-Liste):
${rawTracksText || 'Berlin Sub Dub 128 - Torso Tech\nModular Acid Sequence - S4 Labs\nNordic Deep Chill - Field Works'}

Deine Aufgaben:
1. Sortiere die Tracks so, dass sie der Geschichte dramaturgisch und harmonisch (Camelot Wheel) optimal folgen.
2. Falls Lücken im Spannungsbogen existieren, füge bis zu 3 passende Musikempfehlungen (Tracks) hinzu und markiere sie mit "isAiRecommendation": true.
3. Berechne für jeden Track den idealen Übergangs-BPM (targetBpm zwischen 120.0 und 138.0) und Key (targetKey im Camelot-Format wie '8A', '9A', '8B', '11B').
4. Weise jedem Track eine performanceRole zu ('INTRO_FLOW', 'BUILDUP_TENSION', 'PEAK_ACID', 'BREAKDOWN', 'OUTRO_GLIDE').
5. Schreibe eine prägnante 'liveInstruction' (maximal 1 Satz), welche Stem-Spuren (Drums, Bass, Music, Vocals) der DJ im Live-Modus aktivieren, stummschalten oder filtern soll.

Antworte AUSSCHLIESSLICH mit einem validen JSON-Array im folgenden Format ohne Markdown-Wrapping:
[
  {
    "trackIndex": 0,
    "title": "Song Title",
    "artist": "Artist Name",
    "targetBpm": 126.0,
    "targetKey": "8A",
    "performanceRole": "INTRO_FLOW",
    "liveInstruction": "Nutze hier nur Vocals und Music, um den vorigen DJ fließend abzulösen.",
    "isAiRecommendation": false
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const outputText = response.text || '[]';
    res.json({ text: outputText });
  } catch (err: any) {
    console.error('Server Gemini Error:', err);
    res.status(500).json({ error: err.message || 'Error processing story with Gemini' });
  }
});

async function startServer() {
  let vite: any = null;
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, () => {
    console.log(`STEMSDINGS Server listening on http://localhost:${PORT}`);
  });

  if (vite) {
    server.on('upgrade', (req, socket, head) => {
      vite.ws.handleUpgrade(req, socket, head);
    });
  }
}

startServer();

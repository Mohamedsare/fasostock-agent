import "server-only";
import OpenAI, { toFile } from "openai";
import { serverEnv } from "@/lib/env";

/**
 * Multi-modal media layer: turns inbound WhatsApp media into text the agent can
 * reason about (speech-to-text, image understanding) and turns the agent's text
 * reply back into a voice note (text-to-speech). All functions degrade
 * gracefully — they return null on failure so the engine can fall back to text.
 *
 * Each function takes the tenant's OpenAI key (falls back to the platform key).
 */

function getClient(openaiKey?: string): OpenAI | null {
  const apiKey = openaiKey || serverEnv.platformOpenaiApiKey;
  if (!apiKey) return null;
  return new OpenAI({ apiKey, baseURL: serverEnv.openaiBaseUrl });
}

/** Download a (decrypted) media URL into memory. Returns null on failure. */
async function download(url: string): Promise<{ bytes: Buffer; mimetype: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[media] download failed: HTTP ${res.status}`);
      return null;
    }
    const bytes = Buffer.from(await res.arrayBuffer());
    const mimetype = res.headers.get("content-type") ?? "application/octet-stream";
    return { bytes, mimetype };
  } catch (err) {
    console.error("[media] download error:", err);
    return null;
  }
}

/** Transcribe a voice note / audio file to text (speech-to-text). */
export async function transcribeAudio(
  url: string,
  openaiKey?: string,
  mimetype?: string,
): Promise<string | null> {
  const client = getClient(openaiKey);
  if (!client) return null;
  const dl = await download(url);
  if (!dl) return null;

  try {
    const ext = extensionFor(mimetype ?? dl.mimetype);
    const file = await toFile(dl.bytes, `audio.${ext}`, { type: mimetype ?? dl.mimetype });
    const language = serverEnv.openaiTranscribeLanguage;
    const result = await client.audio.transcriptions.create({
      file,
      model: serverEnv.openaiTranscribeModel,
      // Pin the language so French/Mooré voice notes aren't mis-detected.
      ...(language ? { language } : {}),
    });
    const text = result.text?.trim();
    return text || null;
  } catch (err) {
    console.error("[media] transcription failed:", err);
    return null;
  }
}

/** Describe an image (in French) so the agent understands what the client sent. */
export async function describeImage(
  url: string,
  openaiKey?: string,
  caption?: string,
): Promise<string | null> {
  const client = getClient(openaiKey);
  if (!client) return null;
  try {
    const completion = await client.chat.completions.create({
      model: serverEnv.openaiModel,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Décris en français, en une ou deux phrases, ce que montre cette image envoyée " +
                "par un client (produit, document, capture d'écran, problème visible...). " +
                "Sois factuel et concis." +
                (caption ? ` Légende fournie par le client : « ${caption} ».` : ""),
            },
            { type: "image_url", image_url: { url } },
          ],
        },
      ],
    });
    return completion.choices[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error("[media] image description failed:", err);
    return null;
  }
}

/**
 * Synthesize a spoken reply (text-to-speech). Returns Ogg/Opus bytes — the
 * native WhatsApp voice-note format. We deliberately avoid MP3: Wasender's
 * upload validator sniffs file content and rejects OpenAI's raw-frame MP3
 * ("File content does not match its declared type"), whereas Ogg/Opus (magic
 * "OggS") is accepted and plays back as a proper voice note.
 */
export async function synthesizeSpeech(
  text: string,
  openaiKey?: string,
): Promise<{ bytes: Uint8Array; mimetype: string } | null> {
  const client = getClient(openaiKey);
  if (!client || !text.trim()) return null;
  try {
    const res = await client.audio.speech.create({
      model: serverEnv.openaiTtsModel,
      voice: serverEnv.openaiTtsVoice,
      input: text,
      response_format: "opus",
    });
    const bytes = new Uint8Array(await res.arrayBuffer());
    return { bytes, mimetype: "audio/ogg" };
  } catch (err) {
    console.error("[media] speech synthesis failed:", err);
    return null;
  }
}

/** Map a mime type to a file extension Whisper recognises. */
function extensionFor(mimetype: string): string {
  if (mimetype.includes("ogg")) return "ogg";
  if (mimetype.includes("mpeg") || mimetype.includes("mp3")) return "mp3";
  if (mimetype.includes("mp4") || mimetype.includes("m4a")) return "m4a";
  if (mimetype.includes("wav")) return "wav";
  if (mimetype.includes("webm")) return "webm";
  if (mimetype.includes("amr")) return "amr";
  if (mimetype.includes("aac")) return "aac";
  return "ogg";
}

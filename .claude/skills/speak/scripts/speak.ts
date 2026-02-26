#!/usr/bin/env bun
/**
 * Text-to-Speech using edge-tts or macOS say
 *
 * Usage:
 *   bun speak.ts "Hello world"
 *   bun speak.ts --thai "สวัสดีครับ"
 *   bun speak.ts --voice "en-GB-RyanNeural" "Hello"
 *   bun speak.ts --mac "Hello"
 *   bun speak.ts --list
 */

import { $ } from "bun";
import { unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

// Default voices
const VOICES = {
  english: {
    male: "en-US-GuyNeural",
    female: "en-US-JennyNeural",
  },
  thai: {
    male: "th-TH-NiwatNeural",
    female: "th-TH-PremwadeeNeural",
  },
};

// macOS voice mappings
const MAC_VOICES = {
  english: { male: "Daniel", female: "Samantha" },
  thai: { male: "Kanya", female: "Kanya" }, // macOS Thai voice
};

interface Options {
  text: string;
  voice?: string;
  thai: boolean;
  female: boolean;
  mac: boolean;
  rate?: string;
  list: boolean;
}

function parseArgs(): Options {
  const args = Bun.argv.slice(2);
  const options: Options = {
    text: "",
    thai: false,
    female: false,
    mac: false,
    list: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--thai":
      case "-t":
        options.thai = true;
        break;
      case "--female":
      case "-f":
        options.female = true;
        break;
      case "--mac":
      case "-m":
        options.mac = true;
        break;
      case "--list":
      case "-l":
        options.list = true;
        break;
      case "--voice":
      case "-v":
        options.voice = args[++i];
        break;
      case "--rate":
      case "-r":
        options.rate = args[++i];
        break;
      default:
        if (!arg.startsWith("-")) {
          options.text = arg;
        }
    }
  }

  return options;
}

async function checkEdgeTts(): Promise<boolean> {
  try {
    const cmd = process.platform === "win32" ? "where" : "which";
    const proc = Bun.spawn([cmd, "edge-tts"], { stdout: "pipe", stderr: "pipe" });
    await proc.exited;
    return proc.exitCode === 0;
  } catch {
    return false;
  }
}

async function listVoices(): Promise<void> {
  const hasEdgeTts = await checkEdgeTts();

  console.log("\n Available Voices\n");
  console.log("═".repeat(60));

  if (hasEdgeTts) {
    console.log("\n edge-tts voices (neural):\n");
    const proc = Bun.spawn(["edge-tts", "--list-voices"], { stdout: "pipe" });
    const output = await new Response(proc.stdout).text();

    // Filter to show common voices
    const lines = output.split("\n");
    const filtered = lines.filter(
      (l) =>
        l.startsWith("en-") ||
        l.startsWith("th-") ||
        l.startsWith("Name") ||
        l.startsWith("-")
    );
    console.log(filtered.slice(0, 25).join("\n"));
    console.log("... (run 'edge-tts --list-voices' for full list)");
  } else {
    console.log("\n  edge-tts not installed. Install with: pip install edge-tts\n");
  }

  if (process.platform === "darwin") {
    console.log("\n macOS voices:\n");
    const macProc = Bun.spawn(["say", "-v", "?"], { stdout: "pipe" });
    const macOutput = await new Response(macProc.stdout).text();
    const macFiltered = macOutput
      .split("\n")
      .filter((l) => l.includes("en_") || l.includes("th_"))
      .slice(0, 15);
    console.log(macFiltered.join("\n"));
    console.log("... (run 'say -v ?' for full list)");
  } else {
    console.log("\n macOS voices: (only available on macOS)\n");
  }

  console.log("\n" + "═".repeat(60));
}

async function speakWithEdgeTts(
  text: string,
  voice: string,
  rate?: string
): Promise<boolean> {
  const tmpFile = join(tmpdir(), `speak-${Date.now()}.mp3`);

  try {
    // Build command
    const args = ["edge-tts", "--voice", voice, "--text", text, "--write-media", tmpFile];

    if (rate) {
      args.push("--rate", rate);
    }

    console.log(` Speaking with ${voice}...`);

    const proc = Bun.spawn(args, { stdout: "pipe", stderr: "pipe" });
    await proc.exited;

    if (proc.exitCode !== 0) {
      const err = await new Response(proc.stderr).text();
      console.error("edge-tts error:", err);
      return false;
    }

    // Play the audio (cross-platform)
    let playCmd: string[];
    if (process.platform === "win32") {
      playCmd = ["powershell", "-c", `(New-Object Media.SoundPlayer '${tmpFile}').PlaySync()`];
    } else if (process.platform === "darwin") {
      playCmd = ["afplay", tmpFile];
    } else {
      playCmd = ["aplay", tmpFile];
    }
    const playProc = Bun.spawn(playCmd, { stderr: "pipe" });
    await playProc.exited;

    // Cleanup
    await unlink(tmpFile);
    return true;
  } catch (e) {
    console.error("Error:", e);
    try {
      await unlink(tmpFile);
    } catch {}
    return false;
  }
}

async function speakWithMac(
  text: string,
  voice: string,
  rate?: string
): Promise<boolean> {
  if (process.platform !== "darwin") {
    console.log("macOS 'say' not available on this platform. Use edge-tts instead.");
    return false;
  }
  try {
    const args = ["say", "-v", voice];

    if (rate) {
      args.push("-r", rate);
    }

    args.push(text);

    console.log(` Speaking with macOS voice: ${voice}...`);

    const proc = Bun.spawn(args);
    await proc.exited;

    return proc.exitCode === 0;
  } catch (e) {
    console.error("Error:", e);
    return false;
  }
}

async function main() {
  const options = parseArgs();

  // List voices
  if (options.list) {
    await listVoices();
    return;
  }

  // Check for text
  if (!options.text) {
    console.log("Usage: bun speak.ts [options] \"text to speak\"");
    console.log("\nOptions:");
    console.log("  --thai, -t     Use Thai voice");
    console.log("  --female, -f   Use female voice");
    console.log("  --voice, -v    Specific voice name");
    console.log("  --mac, -m      Force macOS say");
    console.log("  --rate, -r     Speech rate");
    console.log("  --list, -l     List available voices");
    console.log("\nExamples:");
    console.log('  bun speak.ts "Hello world"');
    console.log('  bun speak.ts --thai "สวัสดีครับ"');
    console.log('  bun speak.ts --voice "en-GB-RyanNeural" "Hello"');
    return;
  }

  const hasEdgeTts = await checkEdgeTts();
  const lang = options.thai ? "thai" : "english";
  const gender = options.female ? "female" : "male";

  // Determine voice
  let edgeVoice = options.voice || VOICES[lang][gender];
  let macVoice = MAC_VOICES[lang][gender];

  // Try edge-tts first (unless --mac specified)
  if (!options.mac && hasEdgeTts) {
    const success = await speakWithEdgeTts(options.text, edgeVoice, options.rate);
    if (success) return;
    console.log("Falling back to macOS say...");
  }

  // Fall back to macOS say
  await speakWithMac(options.text, macVoice, options.rate);
}

main();

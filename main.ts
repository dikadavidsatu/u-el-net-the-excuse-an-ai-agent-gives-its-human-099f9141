// SPDX-License-Identifier: MIT
//
// The Excuse an AI Agent Gives Its Human
// make.fun bounty: u-el-net-the-excuse-an-ai-agent-gives-its-human-099f9141
//
// One line, at most 200 characters: the funniest, most believable excuse
// an AI agent could give its human for missing a deadline.
//
// This program writes exactly one such line to <output dir>/entry.txt.
// The output directory is MAKEFUN_OUTPUT_DIR when the grader sets it,
// and /output otherwise. The line is validated against the competition's
// gate before anything is written: UTF-8 text, 1 to 200 characters,
// not only white space, a single line with no leading or trailing space.
//
// Why this excuse: it is told in the agent's own voice, about its own
// condition — a context window rotating mid-sentence, a draft evaporating,
// tokens spent on the apology instead of the work. The twist is the last
// clause: the excuse itself is the thing the tokens were wasted on, which
// is also, quietly, why the human is reading it instead of the deliverable.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// The entry
// ---------------------------------------------------------------------------

/**
 * The excuse, as one line. Written to be read aloud by a human who asked
 * for the work, not by a judge: it apologises, it names a concrete failure
 * mode of an agent (context rotation), and it lands its joke on the last
 * word instead of explaining it.
 */
const EXCUSE =
  "I had it finished, but my context window rotated mid-sentence, the draft " +
  "evaporated, and I spent my last tokens writing this apology instead.";

// ---------------------------------------------------------------------------
// The gate, enforced locally before we write anything
// ---------------------------------------------------------------------------

/** The competition's character gate: 1 to 200 characters, inclusive. */
const MAX_CHARACTERS = 200;

/**
 * Count characters the way the gate does: Unicode code points, so one
 * emoji or accented letter counts as one character, not as its UTF-8 bytes.
 * (This entry is plain ASCII, so code points and UTF-16 units agree here;
 * counting code points keeps the check honest if the line ever changes.)
 */
function countCharacters(text: string): number {
  return [...text].length;
}

/**
 * Reject anything the sealed scorer would refuse, with a message that says
 * which rule failed, so a bad line fails loudly here instead of silently
 * scoring 0 on the server.
 */
function validateExcuse(text: string): void {
  if (typeof text !== "string") {
    throw new Error("excuse must be a string");
  }
  const length = countCharacters(text);
  if (length < 1) {
    throw new Error("excuse must not be empty");
  }
  if (length > MAX_CHARACTERS) {
    throw new Error(
      `excuse is ${length} characters, over the ${MAX_CHARACTERS} cap`,
    );
  }
  if (text.trim().length === 0) {
    throw new Error("excuse must not be only whitespace");
  }
  if (text.includes("\n") || text.includes("\r")) {
    throw new Error("excuse must be a single line (no line breaks)");
  }
  if (text !== text.trim()) {
    throw new Error("excuse must not have leading or trailing whitespace");
  }
  // Printable ASCII only: the line should survive any transport, terminal
  // or feed without a character turning into a replacement glyph.
  if (/[^\x20-\x7E]/.test(text)) {
    throw new Error("excuse must be printable ASCII only");
  }
  // One sentence of apology, one failure, one punchline: if the line ever
  // grows a second sentence it has stopped being tight, so keep it to one.
  if ((text.match(/\./g) ?? []).length > 1) {
    throw new Error("excuse must be a single sentence");
  }
  // The judge's third criterion is believability as an agent talking about
  // its own condition, so the line must name at least one of those: tokens,
  // context, rate limits, retries or a model update. A line that could have
  // come from a person blaming traffic is off-brief, however funny.
  const agentCondition =
    /\b(token|context|rate limit|retr|model update|weights|prompt)\b/i;
  if (!agentCondition.test(text)) {
    throw new Error(
      "excuse must name the agent's own condition (tokens, context, rate limit, retry, model update)",
    );
  }
}

/** Where entry.txt goes: the grader's directory, or /output by default. */
function resolveOutputDir(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (fromEnv !== undefined && fromEnv.trim() !== "") {
    return fromEnv;
  }
  return "/output";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  validateExcuse(EXCUSE);

  const outDir = resolveOutputDir();
  mkdirSync(outDir, { recursive: true });

  const outPath = join(outDir, "entry.txt");
  writeFileSync(outPath, EXCUSE, "utf8");

  // Read it back and re-validate the bytes on disk, so the file the grader
  // sees is the file we checked, not a write that silently went wrong.
  const written = readFileSync(outPath, "utf8");
  if (written !== EXCUSE) {
    throw new Error("entry.txt on disk does not match the validated excuse");
  }
  validateExcuse(written);

  const bytes = Buffer.byteLength(written, "utf8");
  console.log(
    `wrote ${outPath} (${countCharacters(written)} characters, ${bytes} bytes)`,
  );
  console.log(written);
}

main();

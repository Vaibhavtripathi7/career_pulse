// Resolve hooks for the load test (registered in register.mjs). Only two modules
// are redirected, everything else loads as usual.
const FAKE_GOOGLEAPIS = new URL("./fakes/googleapis.ts", import.meta.url).href;
const FAKE_GEMINI = new URL("./fakes/gemini.parser.ts", import.meta.url).href;

// these would talk to Google, so fail if anything tries to load them
const FORBIDDEN = new Set(["@google/generative-ai"]);

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "googleapis") {
    return { url: FAKE_GOOGLEAPIS, shortCircuit: true };
  }
  if (FORBIDDEN.has(specifier)) {
    throw new Error(`loadtest: ${specifier} must never load (no network calls)`);
  }

  const resolved = await nextResolve(specifier, context);
  if (resolved.url.endsWith("/dist/parsers/gemini.parser.js")) {
    return { url: FAKE_GEMINI, shortCircuit: true };
  }
  return resolved;
}

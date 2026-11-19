// Preloaded into every load-test process with `node --import`.
import net from "node:net";
import { register } from "node:module";

// swap googleapis and the gemini parser for fakes, see hooks.mjs
register("./hooks.mjs", import.meta.url);

// block anything that isn't a local connection, postgres and redis are on 127.0.0.1
const LOOPBACK = new Set(["localhost", "127.0.0.1", "::1"]);
const originalConnect = net.Socket.prototype.connect;

net.Socket.prototype.connect = function guardedConnect(...args) {
  const first = Array.isArray(args[0]) ? args[0][0] : args[0];
  let host;
  if (first && typeof first === "object") {
    if (first.path) return originalConnect.apply(this, args); // unix socket
    host = first.host ?? "localhost";
  } else if (typeof first === "number" || typeof first === "string") {
    host = typeof args[1] === "string" ? args[1] : "localhost";
  }
  if (host !== undefined && !LOOPBACK.has(host)) {
    throw new Error(`loadtest: blocked network connection to ${host}`);
  }
  return originalConnect.apply(this, args);
};

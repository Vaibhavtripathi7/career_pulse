import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(process.cwd(), ".env")
});

import { parseWithGemini } from "../parsers/gemini.parser.js";

async function test() {
  const input = {
    subject: "Application for Software Engineer Intern at Microsoft",
    sender: "Microsoft Careers <careers@microsoft.com>"
  };

  const result = await parseWithGemini(input);
  console.log("FINAL OUTPUT:", result);
}

test();
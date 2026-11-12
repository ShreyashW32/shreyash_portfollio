// Copy the Lovable source into ./src so imports resolve against this folder's node_modules.
import { cpSync, rmSync } from "node:fs";

rmSync("src", { recursive: true, force: true });
cpSync("../source/src", "src", { recursive: true });

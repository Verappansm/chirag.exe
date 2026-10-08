// Usage: npm run hash-pin -- 123456   -> prints ADMIN_PIN_HASH + SESSION_SECRET values
import { randomBytes, scryptSync } from "crypto";

const pin = process.argv[2];
if (!/^\d{6}$/.test(pin ?? "")) {
  console.error("Give a 6-digit PIN: npm run hash-pin -- 123456");
  process.exit(1);
}
const salt = randomBytes(16).toString("hex");
console.log(`ADMIN_PIN_HASH=${salt}:${scryptSync(pin, salt, 32).toString("hex")}`);
console.log(`SESSION_SECRET=${randomBytes(32).toString("hex")}`);

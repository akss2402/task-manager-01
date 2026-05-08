import crypto from "node:crypto";

export function sha256Base64Url(input: string) {
  const hash = crypto.createHash("sha256").update(input, "utf8").digest();
  return hash.toString("base64url");
}


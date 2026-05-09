import bcrypt from "bcrypt";

async function test() {
  try {
    const start = Date.now();
    const hash = await bcrypt.hash("password123", 12);
    console.log("Hash:", hash);
    console.log("Time taken:", Date.now() - start, "ms");
    const ok = await bcrypt.compare("password123", hash);
    console.log("Verify:", ok);
  } catch (err) {
    console.error("Bcrypt failed:", err);
  }
}

test();

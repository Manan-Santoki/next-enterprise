import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), "uploads");

export async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function saveFile(
  buffer: Buffer,
  filename: string,
  subdir?: string
): Promise<string> {
  await ensureUploadDir();

  const targetDir = subdir ? join(UPLOAD_DIR, subdir) : UPLOAD_DIR;

  if (!existsSync(targetDir)) {
    await mkdir(targetDir, { recursive: true });
  }

  // Generate unique filename to avoid collisions
  const timestamp = Date.now();
  const uniqueFilename = `${timestamp}-${filename}`;
  const filepath = join(targetDir, uniqueFilename);

  await writeFile(filepath, buffer);

  // Return relative path for storage in DB
  return subdir ? join(subdir, uniqueFilename) : uniqueFilename;
}

export function getFilePath(relativePath: string): string {
  return join(UPLOAD_DIR, relativePath);
}

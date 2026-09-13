import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-static';

export function GET() {
  const filePath = path.join(process.cwd(), 'public', 'machine', 'contract.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return new NextResponse(fileContents, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

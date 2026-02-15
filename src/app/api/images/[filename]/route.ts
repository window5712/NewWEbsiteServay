import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export async function GET(
    req: NextRequest,
    { params }: { params: { filename: string } }
) {
    try {
        const { filename } = params;

        // 1. Validate filename to prevent directory traversal
        if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
        }

        const filePath = path.join(UPLOAD_DIR, filename);

        // 2. Check if file exists
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }

        // 3. Read file
        const fileBuffer = fs.readFileSync(filePath);

        // 4. Determine content type
        const ext = path.extname(filename).toLowerCase();
        let contentType = 'image/jpeg';
        if (ext === '.png') contentType = 'image/png';
        if (ext === '.webp') contentType = 'image/webp';
        if (ext === '.gif') contentType = 'image/gif';

        // 5. Return image with proper headers
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });

    } catch (error: any) {
        console.error('Image serving error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

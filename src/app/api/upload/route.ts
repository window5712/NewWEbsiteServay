import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate user
        const supabase = createServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse multipart form data
        // Next.js App Router req is a Request object, not IncomingMessage.
        // We need to convert it or use a different approach for App Router.
        // For App Router, we should use req.formData()
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // 3. Validate file
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' }, { status: 400 });
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'File size exceeds 5MB limit.' }, { status: 400 });
        }

        // 4. Generate unique filename
        const buffer = Buffer.from(await file.arrayBuffer());
        const timestamp = Math.floor(Date.now() / 1000);
        const randomString = Math.random().toString(36).substring(2, 10);
        const extension = path.extname(file.name) || '.jpg';
        const fileName = `${timestamp}_${randomString}${extension}`;
        const filePath = path.join(UPLOAD_DIR, fileName);

        // 5. Compress and save image
        await sharp(buffer)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .toFormat('webp', { quality: 80 })
            .toFile(path.join(UPLOAD_DIR, fileName.replace(/\.[^.]+$/, '.webp')));

        // Use the .webp filename if we converted it
        const finalFileName = fileName.replace(/\.[^.]+$/, '.webp');
        const imageUrl = `/api/images/${finalFileName}`;

        return NextResponse.json({
            success: true,
            message: 'Image uploaded successfully',
            imageUrl: imageUrl
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

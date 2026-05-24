export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const adminPass = await bcrypt.hash('admin123', 10);
    // Gunakan upsert agar jika akun admin belum ada di database, otomatis dibuatkan.
    await prisma.user.upsert({
      where: { username: 'admin' },
      update: { password: adminPass },
      create: {
        id: 'admin-1234',
        name: 'Administrator',
        username: 'admin',
        password: adminPass,
        role: 'admin',
        isActive: true,
      }
    });
    return NextResponse.json({ 
      success: true, 
      message: 'Password admin berhasil direset menjadi: admin123' 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

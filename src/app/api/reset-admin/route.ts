import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const adminPass = await bcrypt.hash('admin123', 10);
    await prisma.user.update({
      where: { username: 'admin' },
      data: { password: adminPass },
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

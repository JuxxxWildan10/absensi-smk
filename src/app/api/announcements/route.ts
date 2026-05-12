import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

// GET - Ambil semua pengumuman
export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { publishedAt: "desc" },
    });
    return NextResponse.json({ success: true, data: announcements });
  } catch (error) {
    console.error("[API/announcements GET]", error);
    return NextResponse.json({ success: false, message: "Gagal mengambil pengumuman" }, { status: 500 });
  }
}

// POST - Tambah pengumuman
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, targetRoles, targetKelas, priority, publishedAt, expiresAt, authorId, authorName } = body;

    const announcement = await prisma.announcement.create({
      data: {
        id: uuidv4(),
        title,
        content,
        targetRoles: Array.isArray(targetRoles) ? JSON.stringify(targetRoles) : targetRoles,
        targetKelas: targetKelas && Array.isArray(targetKelas) ? JSON.stringify(targetKelas) : targetKelas,
        priority,
        publishedAt: publishedAt || new Date().toISOString(),
        expiresAt,
        authorId,
        authorName,
      },
    });

    return NextResponse.json({ success: true, data: announcement }, { status: 201 });
  } catch (error) {
    console.error("[API/announcements POST]", error);
    return NextResponse.json({ success: false, message: "Gagal menambah pengumuman" }, { status: 500 });
  }
}

// DELETE - Hapus pengumuman
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ success: false, message: "ID diperlukan" }, { status: 400 });

    await prisma.announcement.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Pengumuman dihapus" });
  } catch (error) {
    console.error("[API/announcements DELETE]", error);
    return NextResponse.json({ success: false, message: "Gagal menghapus pengumuman" }, { status: 500 });
  }
}

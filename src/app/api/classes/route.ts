export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_CLASSES = [
  "X DKV 1", "X DKV 2", "X DKV 3", "X TSM 1", "X TSM 2", "X TSM 3",
  "XI DKV 1", "XI DKV 2", "XI DKV 3", "XI TSM 1", "XI TSM 2", "XI TSM 3",
  "XII DKV 1", "XII DKV 2", "XII DKV 3", "XII TSM 1", "XII TSM 2", "XII TSM 3",
];

export async function GET() {
  try {
    const classes = await prisma.classRoom.findMany({ orderBy: { name: "asc" } });

    // Jika DB kosong, seed dengan kelas default dan langsung kembalikan
    if (classes.length === 0) {
      await Promise.all(
        DEFAULT_CLASSES.map((name) =>
          prisma.classRoom.create({ data: { name } }).catch(() => {})
        )
      );
      return NextResponse.json({ success: true, data: DEFAULT_CLASSES });
    }

    return NextResponse.json({ success: true, data: classes.map((c) => c.name) });
  } catch (error) {
    console.error("[API/classes GET]", error);
    return NextResponse.json({ success: true, data: DEFAULT_CLASSES });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ success: false }, { status: 400 });
    try {
      await prisma.classRoom.create({ data: { name } });
      return NextResponse.json({ success: true, data: name }, { status: 201 });
    } catch (dbError: any) {
      console.error("POST /api/classes error:", dbError);
      return NextResponse.json({ success: false, message: dbError.message }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { oldName, newName } = await req.json();
    if (!oldName || !newName) return NextResponse.json({ success: false }, { status: 400 });
    const existing = await prisma.classRoom.findUnique({ where: { name: oldName } });
    if (existing) {
      await prisma.classRoom.update({ where: { id: existing.id }, data: { name: newName } });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const name = req.nextUrl.searchParams.get("name");
    if (!name) return NextResponse.json({ success: false }, { status: 400 });
    const existing = await prisma.classRoom.findUnique({ where: { name } });
    if (existing) await prisma.classRoom.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

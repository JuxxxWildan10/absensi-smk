export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const classes = await prisma.classRoom.findMany({
      orderBy: { name: "asc" }
    });
    return NextResponse.json({ success: true, data: classes.map(c => c.name) });
  } catch (error) {
    console.error("[API/classes GET]", error);
    return NextResponse.json({ success: false, message: "Gagal mengambil kelas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ success: false }, { status: 400 });
    
    await prisma.classRoom.create({ data: { name } });
    return NextResponse.json({ success: true, data: name }, { status: 201 });
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
      await prisma.classRoom.update({
        where: { id: existing.id },
        data: { name: newName }
      });
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
    if (existing) {
      await prisma.classRoom.delete({ where: { id: existing.id } });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

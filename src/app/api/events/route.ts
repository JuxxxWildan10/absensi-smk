export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

// GET - Ambil semua event kalender akademik
export async function GET() {
  try {
    const events = await prisma.academicEvent.findMany({
      orderBy: { startDate: "asc" },
    });
    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error("[API/events GET]", error);
    return NextResponse.json({ success: false, message: "Gagal mengambil event kalender" }, { status: 500 });
  }
}

// POST - Tambah event
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = await prisma.academicEvent.create({
      data: {
        id: uuidv4(),
        title: body.title,
        startDate: body.startDate,
        endDate: body.endDate,
        type: body.type,
        description: body.description,
        createdBy: body.createdBy,
      },
    });
    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (error) {
    console.error("[API/events POST]", error);
    return NextResponse.json({ success: false, message: "Gagal menambah event" }, { status: 500 });
  }
}

// PATCH - Update event
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ success: false, message: "ID diperlukan" }, { status: 400 });

    const event = await prisma.academicEvent.update({
      where: { id },
      data: updates,
    });
    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    console.error("[API/events PATCH]", error);
    return NextResponse.json({ success: false, message: "Gagal update event" }, { status: 500 });
  }
}

// DELETE - Hapus event
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ success: false, message: "ID diperlukan" }, { status: 400 });

    await prisma.academicEvent.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Event dihapus" });
  } catch (error) {
    console.error("[API/events DELETE]", error);
    return NextResponse.json({ success: false, message: "Gagal menghapus event" }, { status: 500 });
  }
}

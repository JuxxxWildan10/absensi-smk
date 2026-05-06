// ============================================================
// API Route: PATCH /api/students/[id]  → Update siswa
//            DELETE /api/students/[id] → Hapus siswa
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type Params = { params: Promise<{ id: string }> };

// PATCH - Update data siswa
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updateData: Record<string, unknown> = {};

    if (body.name)     updateData.name = body.name;
    if (body.kelas)    updateData.kelas = body.kelas;
    if (body.jurusan)  updateData.jurusan = body.jurusan;
    if (body.nisn)     updateData.nisn = body.nisn;
    if (body.parentId !== undefined) updateData.parentId = body.parentId;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.password) updateData.password = await bcrypt.hash(body.password, 10);

    // Face descriptor: simpan sebagai JSON string
    if (body.faceDescriptor !== undefined) {
      updateData.faceDescriptor = body.faceDescriptor
        ? JSON.stringify(body.faceDescriptor)
        : null;
    }

    // Reset device binding
    if (body.deviceId !== undefined) updateData.deviceId = body.deviceId;

    // Alumni status
    if (body.isAlumni !== undefined) updateData.isAlumni = body.isAlumni;
    if (body.graduationYear !== undefined) updateData.graduationYear = body.graduationYear;

    const updated = await prisma.user.update({ where: { id }, data: updateData });

    await prisma.auditLog.create({
      data: { userId: "system", userName: "System", role: "admin", action: "EDIT_SISWA", target: updated.name },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safe } = updated;
    return NextResponse.json({ success: true, data: safe });

  } catch (error) {
    console.error("[API/students/[id] PATCH]", error);
    return NextResponse.json({ success: false, message: "Gagal update siswa" }, { status: 500 });
  }
}

// DELETE - Hapus siswa
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const student = await prisma.user.findUnique({ where: { id } });
    if (!student) return NextResponse.json({ success: false, message: "Siswa tidak ditemukan" }, { status: 404 });

    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: { userId: "system", userName: "System", role: "admin", action: "HAPUS_SISWA", target: student.name },
    });

    return NextResponse.json({ success: true, message: "Siswa berhasil dihapus" });

  } catch (error) {
    console.error("[API/students/[id] DELETE]", error);
    return NextResponse.json({ success: false, message: "Gagal hapus siswa" }, { status: 500 });
  }
}

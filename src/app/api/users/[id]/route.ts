// ============================================================
// API Route: PATCH /api/users/[id]  → Update guru/wali
//            DELETE /api/users/[id] → Hapus guru/wali
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Jangan izinkan update password langsung tanpa hash
    if (body.password) {
      body.password = await bcrypt.hash(body.password, 10);
    } else {
      delete body.password; // Jangan timpa dengan string kosong
    }

    // Serialize studentIds jika ada (untuk wali)
    if (body.studentIds && Array.isArray(body.studentIds)) {
      body.studentIds = JSON.stringify(body.studentIds);
    }

    // Hapus field yang tidak ada di schema
    delete body.id;
    delete body.role; // Role tidak boleh diubah sembarangan

    const user = await prisma.user.update({
      where: { id },
      data: body,
    });

    await prisma.auditLog.create({
      data: { userId: id, userName: user.name, role: user.role, action: "EDIT_USER", target: id },
    });

    const { password: _, ...safe } = user;
    return NextResponse.json({ success: true, data: safe });

  } catch (error) {
    console.error("[API/users/[id] PATCH]", error);
    return NextResponse.json({ success: false, message: "Gagal update user" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ success: false, message: "User tidak ditemukan" }, { status: 404 });
    }

    // Soft delete: nonaktifkan saja, jangan hapus permanen (menjaga integritas audit log & absensi)
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: { userId: id, userName: user.name, role: user.role, action: "HAPUS_USER", target: id },
    });

    return NextResponse.json({ success: true, message: "User dinonaktifkan" });

  } catch (error) {
    console.error("[API/users/[id] DELETE]", error);
    return NextResponse.json({ success: false, message: "Gagal hapus user" }, { status: 500 });
  }
}

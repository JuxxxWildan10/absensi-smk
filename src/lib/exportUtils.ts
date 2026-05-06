// ============================================================
// AbsensiCerdas - Export Utility (PDF & Excel)
// ============================================================

import { AttendanceRecord } from "./types";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

/**
 * Export attendance records to Excel (.xlsx)
 */
export async function exportToExcel(
  records: AttendanceRecord[],
  title = "Rekap Absensi"
): Promise<void> {
  const xlsx = await import("xlsx");
  const XLSX = xlsx.default || xlsx;

  const data = [
    ["No", "Nama Siswa", "Kelas", "Tanggal", "Status", "Jam Masuk", "Jam Keluar", "Verif Wajah", "Verif Lokasi"],
    ...records.map((r, i) => [
      i + 1,
      r.studentName,
      r.kelas,
      format(new Date(r.date), "dd MMM yyyy", { locale: idLocale }),
      r.status.replace("_", " ").toUpperCase(),
      r.checkIn?.time ?? "-",
      r.checkOut?.time ?? "-",
      r.checkIn?.faceVerified ? "✓" : "-",
      r.checkIn?.locationVerified ? "✓" : "-",
    ]),
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Column widths
  ws["!cols"] = [
    { wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Absensi");
  XLSX.writeFile(wb, `${title}_${format(new Date(), "dd-MM-yyyy")}.xlsx`);
}

/**
 * Export attendance records to PDF using jsPDF
 */
export async function exportToPDF(
  records: AttendanceRecord[],
  title = "Rekap Absensi"
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape" });

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Dicetak pada: ${format(new Date(), "dd MMMM yyyy HH:mm", { locale: idLocale })}`,
    14, 26
  );

  autoTable(doc, {
    startY: 32,
    head: [["No", "Nama Siswa", "Kelas", "Tanggal", "Status", "Jam Masuk", "Jam Keluar"]],
    body: records.map((r, i) => [
      i + 1,
      r.studentName,
      r.kelas,
      format(new Date(r.date), "dd MMM yyyy", { locale: idLocale }),
      r.status.replace("_", " ").toUpperCase(),
      r.checkIn?.time ?? "-",
      r.checkOut?.time ?? "-",
    ]),
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 255] },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  doc.save(`${title}_${format(new Date(), "dd-MM-yyyy")}.pdf`);
}

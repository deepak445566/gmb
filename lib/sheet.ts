import type { Point } from "./circle";

export const HEADERS = ["Name", "Description", "longitude", "latitude"];

// The full "lat,lng" coordinate goes in the longitude column; latitude stays blank.
// My Maps reads a single-column pair as lat,lng – the other order draws tall ovals.
export type SheetRow = [name: string, description: string, coordinate: string, lat: ""];

// Reads Name + Description from the first sheet. Uses the "Name"/"Description" header
// columns when present, otherwise columns A and B.
export async function importNameSheet(file: File) {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("File mein koi sheet nahi mili");

  const header = (ws.getRow(1).values as unknown[]).map((v) => String(v ?? "").trim().toLowerCase());
  const nameCol = header.indexOf("name");
  const descCol = header.indexOf("description");
  const hasHeader = nameCol > 0;

  const names: string[] = [];
  const descriptions: string[] = [];
  ws.eachRow((row, r) => {
    if (hasHeader && r === 1) return;
    const name = row.getCell(hasHeader ? nameCol : 1).text.trim();
    const desc = row.getCell(hasHeader && descCol > 0 ? descCol : 2).text.trim();
    if (!name && !desc) return;
    names.push(name);
    descriptions.push(desc);
  });

  const sameDesc = descriptions.every((d) => d === descriptions[0]);
  return { names, descriptions: sameDesc ? descriptions.slice(0, 1) : descriptions };
}

// Coordinates go row by row in order (all 50 m points, then 100 m, ...).
// If the list is shorter than the coordinates it repeats from the top.
export function buildRows(names: string[], descriptions: string[], points: Point[]): SheetRow[] {
  const count = points.length || names.length;
  const pick = (list: string[], i: number) => (list.length ? list[i % list.length] : "");
  return Array.from({ length: count }, (_, i) => [
    pick(names, i),
    pick(descriptions, i),
    points[i] ? `${points[i].lat},${points[i].lng}` : "",
    "",
  ]);
}

async function xlsxBuffer(rows: SheetRow[]) {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sheet1");
  ws.columns = [{ width: 43 }, { width: 45 }, { width: 24 }, { width: 14 }];
  ws.addRow(HEADERS).font = { bold: true };
  rows.forEach((r) => ws.addRow([...r]));
  ws.getColumn(2).alignment = { wrapText: true, vertical: "top" };
  return wb.xlsx.writeBuffer();
}

export async function downloadXlsx(filename: string, rows: SheetRow[]) {
  const buffer = await xlsxBuffer(rows);
  saveBlob(filename, new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
}

// Separate .xlsx downloads, spaced out so the browser doesn't drop any.
// Chrome asks once to "allow multiple downloads" for the site.
export async function downloadManyXlsx(files: { name: string; rows: SheetRow[] }[]) {
  for (const f of files) {
    await downloadXlsx(f.name, f.rows);
    await new Promise((r) => setTimeout(r, 400));
  }
}

function saveBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

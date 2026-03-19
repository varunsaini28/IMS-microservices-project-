import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportToPdf(filename, { title, columns, rows }) {
  const doc = new jsPDF({ orientation: 'landscape' })
  if (title) doc.text(title, 14, 14)

  autoTable(doc, {
    startY: title ? 18 : 10,
    head: [columns],
    body: rows,
    styles: { fontSize: 9 },
  })

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}


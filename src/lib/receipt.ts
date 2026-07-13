export function openReceiptWindow(title: string, content: string) {
  const printWindow = window.open("", "_blank", "width=900,height=700");

  if (!printWindow) return;

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          body {
            margin: 0;
            padding: 24px;
            font-family: Arial, Helvetica, sans-serif;
            background: white;
            color: #111827;
          }
          .container {
            max-width: 720px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 16px;
            margin-bottom: 16px;
          }
          .title {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 6px;
          }
          .subtitle {
            font-size: 13px;
            color: #6b7280;
            margin: 0;
          }
          .meta {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            margin-top: 12px;
            font-size: 12px;
            color: #4b5563;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }
          th,
          td {
            padding: 8px 6px;
            border-bottom: 1px solid #e5e7eb;
            text-align: left;
            font-size: 13px;
          }
          th {
            color: #6b7280;
            text-transform: uppercase;
            font-size: 11px;
          }
          .grand-total {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 16px;
            padding-top: 12px;
            border-top: 2px solid #c9a84c;
            font-weight: 700;
            font-size: 16px;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

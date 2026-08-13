// Minimal CSV generator — good enough for exporting flat rows of data.
// Wraps values in quotes and escapes internal quotes so commas/newlines
// inside a field (e.g. call notes) don't break the file.
function toCSV(rows, columns) {
  const escape = (value) => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columns.map((c) => c.label).join(",");
  const lines = rows.map((row) =>
    columns.map((c) => escape(typeof c.value === "function" ? c.value(row) : row[c.value])).join(",")
  );

  return [header, ...lines].join("\n");
}

module.exports = { toCSV };

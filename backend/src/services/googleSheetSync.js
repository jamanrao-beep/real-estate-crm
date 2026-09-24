const axios = require("axios");
const prisma = require("../prisma");

function normalizeSheetUrl(url) {
  if (!url) return url;
  if (url.includes("/export?")) {
    if (!url.includes("format=csv")) {
      url += (url.includes("?") ? "&" : "?") + "format=csv";
    }
    return url;
  }
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    const sheetId = match[1];
    const gidMatch = url.match(/gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : "0";
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  }
  return url;
}

const PROJECT_SHEETS = [
  {
    name: "Fun Valley",
    sourceName: "Fun Valley",
    url: process.env.GOOGLE_SHEET_FUN_VALLEY_URL || process.env.GOOGLE_SHEET_CSV_URL || "https://docs.google.com/spreadsheets/d/1N_JewBBH6aaWuFNKVlv1TznVaTpPnEm7PAAfNyrIOY4/export?format=csv&gid=0"
  },
  {
    name: "Sahastradhara",
    sourceName: "Sahastradhara",
    url: process.env.GOOGLE_SHEET_SAHASTRADHARA_URL || "https://docs.google.com/spreadsheets/d/1jT2h7c-Ik5AMV3ycgIWVDtxIgDWW2MZSTkxOtjGrGoI/export?format=csv&gid=0"
  },
  {
    name: "Rani Pokhari",
    sourceName: "Rani Pokhari",
    url: process.env.GOOGLE_SHEET_RANI_POKHARI_URL || "https://docs.google.com/spreadsheets/d/1JQsg_Jtdfdob9-UwrDaqjUKNRijzJL1OHSHXRqooBfU/export?format=csv&gid=0"
  },
  {
    name: "Thano",
    sourceName: "Thano",
    url: process.env.GOOGLE_SHEET_THANO_URL || "https://docs.google.com/spreadsheets/d/1lLTAtmqpRjXcSoYAbf0n66rggTO_6zDSeo4GVUm5mlk/export?format=csv&gid=0"
  }
];

// Simple robust CSV parser handling quotes, commas, and newlines
function parseCSV(text) {
  const lines = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(cell.trim());
      if (row.some(c => c !== "")) {
        lines.push(row);
      }
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some(c => c !== "")) {
      lines.push(row);
    }
  }

  return lines;
}

// Dynamically locate the true header row index within the first 10 rows
function findHeaderRowIndex(rows) {
  const knownHeaders = ["full_name", "full name", "phone_number", "phone", "email", "created_time", "campaign_name", "ad_name"];
  let bestRowIdx = 0;
  let bestScore = -1;

  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i];
    const lowerCells = row.map(c => (c || "").toLowerCase().trim());

    const hasPhoneData = row.some(c => /^p:\+?\d{7,15}/i.test(c) || /^\+?\d{10,13}$/.test(c));
    const hasEmailData = row.some(c => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c) && !c.includes("email"));

    let score = 0;
    for (const h of knownHeaders) {
      if (lowerCells.includes(h)) {
        score += 2;
      }
    }

    if (hasPhoneData) score -= 5;
    if (hasEmailData) score -= 5;

    if (score > bestScore) {
      bestScore = score;
      bestRowIdx = i;
    }
  }

  return bestRowIdx;
}

async function syncSingleSheet(project) {
  const fetchUrl = normalizeSheetUrl(project.url);
  try {
    const response = await axios.get(fetchUrl, {
      timeout: 10000,
      headers: { "Accept": "text/csv" }
    });

    const rows = parseCSV(response.data);
    if (!rows || rows.length < 2) {
      return { synced: 0, skipped: 0, total: 0, project: project.name };
    }

    const headerIdx = findHeaderRowIndex(rows);
    const headers = rows[headerIdx].map(h => (h || "").toLowerCase().trim());
    
    // Helper to find column index by potential header names
    const getIndex = (names) => {
      for (const name of names) {
        const idx = headers.indexOf(name.toLowerCase());
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const nameIdx = getIndex(["full_name", "name", "full name", "client name", "customer name"]);
    const phoneIdx = getIndex(["phone_number", "phone", "phone number", "mobile", "contact"]);
    const emailIdx = getIndex(["email", "email_address", "email address"]);
    const createdTimeIdx = getIndex(["created_time", "date", "created at", "timestamp", "time"]);
    const campaignIdx = getIndex(["campaign_name", "campaign", "ad_name", "form_name"]);

    let synced = 0;
    let skipped = 0;

    // Process all rows except the header row itself
    for (let i = 0; i < rows.length; i++) {
      if (i === headerIdx) continue;
      const row = rows[i];
      if (!row || row.length === 0) continue;

      let name = nameIdx !== -1 ? row[nameIdx] : "";
      let rawPhone = phoneIdx !== -1 ? row[phoneIdx] : "";
      let email = emailIdx !== -1 ? row[emailIdx] : "";
      let createdTime = createdTimeIdx !== -1 ? row[createdTimeIdx] : null;
      let campaign = campaignIdx !== -1 ? row[campaignIdx] : "";

      // Skip secondary header rows if present
      if (name.toLowerCase() === "full_name" || rawPhone.toLowerCase().includes("phone_number")) {
        continue;
      }

      // Clean phone: strip 'p:', spaces, hyphens, brackets
      let phone = rawPhone ? rawPhone.replace(/^p:/i, "").trim() : "";
      if (phone && !phone.includes("dummy data")) {
        phone = phone.replace(/[\s\-\(\)]/g, "");
      }
      if (phone.includes("dummy data")) {
        phone = `${phone} (${project.name})`;
      }
      
      // Fallback for name
      if (!name || name.includes("dummy data")) {
        name = `${project.name} Test Lead`;
      }

      // If both name and phone are empty/useless, skip row
      if (!phone && !email) {
        skipped++;
        continue;
      }

      // Build phone variants for matching (with +91, without +, and 10-digit)
      const phoneVariants = [];
      if (phone && !phone.includes("dummy data")) {
        phoneVariants.push(phone);
        if (phone.startsWith("+91") && phone.length === 13) {
          phoneVariants.push(phone.substring(3));
          phoneVariants.push(phone.substring(1));
        } else if (phone.length === 10) {
          phoneVariants.push("+91" + phone);
          phoneVariants.push("91" + phone);
        }
      }

      // Check if lead already exists with this phone or email
      const existing = await prisma.lead.findFirst({
        where: {
          OR: [
            ...phoneVariants.map(p => ({ phone: p })),
            ...(email && !email.includes("test@") ? [{ email }] : [])
          ]
        }
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Parse date if valid (supports ISO, standard dates, and DD/MM/YYYY)
      let dateReceived = new Date();
      if (createdTime) {
        const parsedDate = new Date(createdTime);
        if (!isNaN(parsedDate.getTime())) {
          dateReceived = parsedDate;
        } else {
          const parts = String(createdTime).split(/[\/\-\s:]+/);
          if (parts.length >= 3) {
            const d = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const y = parseInt(parts[2], 10);
            const testD = new Date(y < 100 ? 2000 + y : y, m, d);
            if (!isNaN(testD.getTime())) {
              dateReceived = testD;
            }
          }
        }
      }

      // Create new lead in unassigned inbox with project source
      const newLead = await prisma.lead.create({
        data: {
          name,
          phone: phone || "N/A",
          email: email || "",
          source: project.sourceName,
          formAnswers: {
            project: project.name,
            campaign: campaign || null,
            sheetRow: i + 1,
            raw: row,
            headers: headers
          },
          dateReceived,
          status: "ACTIVE"
        }
      });

      synced++;
      console.log(`[GoogleSheetSync] [${project.name}] Imported new lead: ${name} (${phone})`);

      // Trigger automated WhatsApp greeting via ChatMitra Bot for fresh leads (within last 24h)
      try {
        const isRecent = (Date.now() - dateReceived.getTime()) < (24 * 60 * 60 * 1000);
        if (isRecent && process.env.CHATMITRA_ENABLED === "true") {
          const { sendChatMitraLeadGreeting } = require("./chatMitraService");
          sendChatMitraLeadGreeting(newLead).catch(err =>
            console.error(`[GoogleSheetSync] WhatsApp greeting error for ${name}:`, err.message)
          );
        }
      } catch (err) {
        // ChatMitra optional
      }
    }

    return {
      project: project.name,
      synced,
      skipped,
      total: rows.length - 1
    };
  } catch (err) {
    console.warn(`[GoogleSheetSync] Could not sync ${project.name} (${project.url}): ${err.message}`);
    return {
      project: project.name,
      synced: 0,
      skipped: 0,
      total: 0,
      error: err.message
    };
  }
}

async function syncGoogleSheetLeads() {
  let totalSynced = 0;
  let totalSkipped = 0;
  let totalRows = 0;
  const projectResults = [];

  for (const project of PROJECT_SHEETS) {
    const result = await syncSingleSheet(project);
    totalSynced += result.synced || 0;
    totalSkipped += result.skipped || 0;
    totalRows += result.total || 0;
    projectResults.push(result);
  }

  return {
    synced: totalSynced,
    skipped: totalSkipped,
    total: totalRows,
    projects: projectResults
  };
}

module.exports = { syncGoogleSheetLeads, PROJECT_SHEETS, normalizeSheetUrl };

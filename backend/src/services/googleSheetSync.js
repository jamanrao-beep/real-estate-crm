const axios = require("axios");
const prisma = require("../prisma");

const DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1N_JewBBH6aaWuFNKVlv1TznVaTpPnEm7PAAfNyrIOY4/export?format=csv&gid=0";

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

async function syncGoogleSheetLeads() {
  const sheetUrl = process.env.GOOGLE_SHEET_CSV_URL || DEFAULT_SHEET_URL;

  try {
    const response = await axios.get(sheetUrl, {
      timeout: 10000,
      headers: { "Accept": "text/csv" }
    });

    const rows = parseCSV(response.data);
    if (!rows || rows.length < 2) {
      return { synced: 0, skipped: 0, total: 0, message: "No data rows in sheet" };
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());
    
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

    // Process from row 1 onwards
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      let name = nameIdx !== -1 ? row[nameIdx] : "";
      let rawPhone = phoneIdx !== -1 ? row[phoneIdx] : "";
      let email = emailIdx !== -1 ? row[emailIdx] : "";
      let createdTime = createdTimeIdx !== -1 ? row[createdTimeIdx] : null;
      let campaign = campaignIdx !== -1 ? row[campaignIdx] : "Meta Lead Form";

      // Clean phone: strip 'p:', spaces, etc.
      let phone = rawPhone ? rawPhone.replace(/^p:/i, "").trim() : "";
      
      // Fallback for name
      if (!name || name.includes("dummy data")) {
        name = phone ? `Meta Lead (${phone})` : `Meta Lead #${i}`;
      }

      // If both name and phone are empty/useless, skip row
      if (!phone && !email) {
        skipped++;
        continue;
      }

      // Check if lead already exists with this phone or email
      const existing = await prisma.lead.findFirst({
        where: {
          OR: [
            ...(phone ? [{ phone }] : []),
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

      // Create new lead in unassigned inbox
      const newLead = await prisma.lead.create({
        data: {
          name,
          phone: phone || "N/A",
          email: email || "",
          source: campaign ? `Facebook Ads (${campaign})` : "Facebook Ads (Google Sheet)",
          formAnswers: {
            sheetRow: i + 1,
            raw: row,
            headers: headers
          },
          dateReceived,
          status: "ACTIVE"
        }
      });

      synced++;
      console.log(`[GoogleSheetSync] Imported new lead: ${name} (${phone})`);

      // Trigger automated WhatsApp greeting via ChatMitra Bot
      const { sendChatMitraLeadGreeting } = require("./chatMitraService");
      sendChatMitraLeadGreeting(newLead).catch(err =>
        console.error(`[GoogleSheetSync] WhatsApp greeting error for ${name}:`, err.message)
      );
    }

    return {
      synced,
      skipped,
      total: rows.length - 1
    };
  } catch (err) {
    console.error("[GoogleSheetSync] Error syncing sheet:", err.message);
    throw err;
  }
}

module.exports = { syncGoogleSheetLeads };

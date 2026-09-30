const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const NEON_URL = "postgresql://neondb_owner:npg_bnQc5HfsJ2wt@ep-square-feather-a5cxd0tu-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function main() {
  console.log("Connecting to Neon...");
  const client = new Client({ connectionString: NEON_URL });
  await client.connect();

  console.log("Fetching Users...");
  const users = (await client.query('SELECT * FROM "User"')).rows;
  const userById = {};
  users.forEach(u => { userById[u.id] = u; });

  console.log("Fetching Leads...");
  const leads = (await client.query('SELECT * FROM "Lead"')).rows;
  const leadById = {};
  leads.forEach(l => { leadById[l.id] = l; });

  console.log("Fetching LeadAssignmentHistory...");
  const lah = (await client.query('SELECT * FROM "LeadAssignmentHistory"')).rows;

  console.log("Fetching LeadStatusHistory...");
  const lsh = (await client.query('SELECT * FROM "LeadStatusHistory"')).rows;

  console.log("Fetching CallLog...");
  const callLogs = (await client.query('SELECT * FROM "CallLog"')).rows;

  await client.end();

  console.log(`Fetched:
    Users: ${users.length}
    Leads: ${leads.length}
    LeadAssignmentHistory: ${lah.length}
    LeadStatusHistory: ${lsh.length}
    CallLog: ${callLogs.length}
  `);

  const sqlLines = [];
  sqlLines.push("-- ================================================================");
  sqlLines.push("-- ALL-IN-ONE RESTORATION: ASSIGNMENTS, TIMESTAMPS, CALL LOGS, HISTORY");
  sqlLines.push(`-- Generated At: ${new Date().toISOString()}`);
  sqlLines.push("-- ================================================================\n");
  sqlLines.push("START TRANSACTION;\n");

  sqlLines.push("-- 1. User variables");
  users.forEach(u => {
    const varName = `@user_${u.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    sqlLines.push(`SET ${varName} = (SELECT id FROM \`User\` WHERE email = '${u.email}' LIMIT 1);`);
  });
  sqlLines.push("\n");

  // Helper for dates
  const formatDate = (d) => {
    if (!d) return 'NULL';
    const iso = new Date(d).toISOString().slice(0, 19).replace('T', ' ');
    return `'${iso}'`;
  };

  const escapeStr = (str) => {
    if (str === null || str === undefined) return 'NULL';
    return `'${str.toString().replace(/'/g, "\\'")}'`;
  };

  const cleanPhone = (p) => {
    if (!p) return '';
    return p.toString().replace(/[^0-9]/g, '').slice(-10);
  };

  // 1. Update Lead assignments, timestamps, category, funnelStage, followUp
  sqlLines.push("-- ================================================================");
  sqlLines.push("-- 1. UPDATE LEADS: assignedToId, dateReceived, createdAt, category, funnelStage, followUp");
  sqlLines.push("-- ================================================================\n");

  leads.forEach(l => {
    const digits = cleanPhone(l.phone);
    const escapedName = (l.name || '').replace(/'/g, "\\'");
    const dateRec = formatDate(l.dateReceived);
    const created = formatDate(l.createdAt);
    const updated = formatDate(l.updatedAt);
    const category = l.category ? `'${l.category}'` : "'WARM'";
    const stage = l.funnelStage ? `'${l.funnelStage}'` : "'INTERESTED'";
    const followUpAt = formatDate(l.followUpAt);
    const followUpNotes = escapeStr(l.followUpNotes);

    const assignedUser = l.assignedToId ? userById[l.assignedToId] : null;
    const assignedVar = assignedUser ? `@user_${assignedUser.email.replace(/[^a-zA-Z0-9]/g, '_')}` : 'NULL';

    const whereClause = (digits && digits.length >= 10)
      ? `\`phone\` LIKE '%${digits}'`
      : `\`name\` = '${escapedName}'`;

    sqlLines.push(
      `UPDATE \`Lead\` SET ` +
      `\`assignedToId\` = ${assignedVar}, ` +
      `\`dateReceived\` = ${dateRec}, \`createdAt\` = ${created}, ` +
      `\`category\` = ${category}, \`funnelStage\` = ${stage}, ` +
      `\`followUpAt\` = ${followUpAt}, \`followUpNotes\` = ${followUpNotes} ` +
      `WHERE ${whereClause};`
    );
  });

  // 2. Clear old auto-assignment history and insert original LeadAssignmentHistory
  sqlLines.push("\n-- ================================================================");
  sqlLines.push("-- 2. RESTORE ORIGINAL LeadAssignmentHistory WITH REAL TIMESTAMPS");
  sqlLines.push("-- ================================================================\n");
  sqlLines.push("DELETE FROM `LeadAssignmentHistory`;\n");

  lah.forEach(h => {
    const lead = leadById[h.leadId];
    if (!lead) return;
    const digits = cleanPhone(lead.phone);
    const escapedName = (lead.name || '').replace(/'/g, "\\'");

    const assignedToUser = userById[h.assignedToId];
    const assignedByUser = userById[h.assignedById];
    if (!assignedToUser) return;

    const toVar = `@user_${assignedToUser.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const byVar = assignedByUser ? `@user_${assignedByUser.email.replace(/[^a-zA-Z0-9]/g, '_')}` : toVar;
    const assignedAt = formatDate(h.assignedAt);
    const histId = `'${h.id}'`;

    const whereClause = (digits && digits.length >= 10)
      ? `l.phone LIKE '%${digits}'`
      : `l.name = '${escapedName}'`;

    sqlLines.push(
      `INSERT INTO \`LeadAssignmentHistory\` (\`id\`, \`leadId\`, \`assignedToId\`, \`assignedById\`, \`assignedAt\`) ` +
      `SELECT ${histId}, l.id, ${toVar}, ${byVar}, ${assignedAt} ` +
      `FROM \`Lead\` l WHERE ${whereClause} LIMIT 1;`
    );
  });

  // 3. Clear old LeadStatusHistory and insert original LeadStatusHistory
  sqlLines.push("\n-- ================================================================");
  sqlLines.push("-- 3. RESTORE ORIGINAL LeadStatusHistory WITH REAL TIMESTAMPS");
  sqlLines.push("-- ================================================================\n");
  sqlLines.push("DELETE FROM `LeadStatusHistory`;\n");

  lsh.forEach(s => {
    const lead = leadById[s.leadId];
    if (!lead) return;
    const digits = cleanPhone(lead.phone);
    const escapedName = (lead.name || '').replace(/'/g, "\\'");

    const changedByUser = userById[s.changedById];
    const byVar = changedByUser ? `@user_${changedByUser.email.replace(/[^a-zA-Z0-9]/g, '_')}` : `@user_prashant_bkdcrm_com`;
    const changedAt = formatDate(s.changedAt);
    const stage = `'${s.stage}'`;
    const histId = `'${s.id}'`;

    const whereClause = (digits && digits.length >= 10)
      ? `l.phone LIKE '%${digits}'`
      : `l.name = '${escapedName}'`;

    sqlLines.push(
      `INSERT INTO \`LeadStatusHistory\` (\`id\`, \`leadId\`, \`stage\`, \`changedById\`, \`changedAt\`) ` +
      `SELECT ${histId}, l.id, ${stage}, ${byVar}, ${changedAt} ` +
      `FROM \`Lead\` l WHERE ${whereClause} LIMIT 1;`
    );
  });

  // 4. Restore CallLog with duration, notes, followups, timestamps
  sqlLines.push("\n-- ================================================================");
  sqlLines.push("-- 4. RESTORE ORIGINAL CallLog WITH TIMESTAMPS & DURATIONS");
  sqlLines.push("-- ================================================================\n");
  sqlLines.push("DELETE FROM `CallLog`;\n");

  callLogs.forEach(c => {
    const lead = leadById[c.leadId];
    if (!lead) return;
    const digits = cleanPhone(lead.phone);
    const escapedName = (lead.name || '').replace(/'/g, "\\'");

    const sp = userById[c.salesPersonId];
    if (!sp) return;

    const spVar = `@user_${sp.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const startTime = formatDate(c.startTime);
    const endTime = formatDate(c.endTime);
    const duration = c.durationSecs !== null && c.durationSecs !== undefined ? c.durationSecs : 'NULL';
    const notes = escapeStr(c.notes);
    const followUpAt = formatDate(c.followUpAt);
    const followUpNotes = escapeStr(c.followUpNotes);
    const createdAt = formatDate(c.createdAt);
    const callId = `'${c.id}'`;

    const whereClause = (digits && digits.length >= 10)
      ? `l.phone LIKE '%${digits}'`
      : `l.name = '${escapedName}'`;

    sqlLines.push(
      `INSERT INTO \`CallLog\` (\`id\`, \`leadId\`, \`salesPersonId\`, \`startTime\`, \`endTime\`, \`durationSecs\`, \`notes\`, \`followUpAt\`, \`followUpNotes\`, \`createdAt\`) ` +
      `SELECT ${callId}, l.id, ${spVar}, ${startTime}, ${endTime}, ${duration}, ${notes}, ${followUpAt}, ${followUpNotes}, ${createdAt} ` +
      `FROM \`Lead\` l WHERE ${whereClause} LIMIT 1;`
    );
  });

  sqlLines.push("\nCOMMIT;\n");

  const outPath = path.join(__dirname, 'restore_performance_and_timestamps.sql');
  fs.writeFileSync(outPath, sqlLines.join('\n'));

  console.log(`\nSuccessfully regenerated: ${outPath}`);
  console.log(`Lines: ${sqlLines.length}`);
}

main().catch(console.error);

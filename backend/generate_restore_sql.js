const fs = require('fs');
const path = require('path');

const dump = JSON.parse(fs.readFileSync(path.join(__dirname, 'neon_dump.json'), 'utf-8'));

const userEmailById = {};
const userNameById = {};
dump.users.forEach(u => {
  userEmailById[u.id] = u.email;
  userNameById[u.id] = u.name;
});

let sqlLines = [];
sqlLines.push("-- ================================================================");
sqlLines.push("-- RESTORE NEON MANUAL ASSIGNMENTS TO HOSTINGER MYSQL");
sqlLines.push(`-- Total Neon Leads: ${dump.leads.length}`);
sqlLines.push(`-- Generated At: ${new Date().toISOString()}`);
sqlLines.push("-- ================================================================\n");
sqlLines.push("START TRANSACTION;\n");

// Pre-fetch User IDs into variables
sqlLines.push("-- Pre-fetch User IDs into variables for high-speed execution");
sqlLines.push("SET @sapna_id = (SELECT id FROM `User` WHERE email = 'sapna@bkdcrm.com' LIMIT 1);");
sqlLines.push("SET @bharat_id = (SELECT id FROM `User` WHERE email = 'bharat@bkdcrm.com' LIMIT 1);");
sqlLines.push("SET @manashvi_id = (SELECT id FROM `User` WHERE email = 'manashvi@bkdcrm.com' LIMIT 1);");
sqlLines.push("SET @aarti_id = (SELECT id FROM `User` WHERE email = 'aarti@bkdcrm.com' LIMIT 1);");
sqlLines.push("SET @kanishka_id = (SELECT id FROM `User` WHERE email = 'kanishka@bkdcrm.com' LIMIT 1);");
sqlLines.push("SET @admin_id = (SELECT id FROM `User` WHERE email = 'prashant@bkdcrm.com' LIMIT 1);");
sqlLines.push("\n");

let assignedCount = 0;
let unassignedCount = 0;
const stats = {};

dump.leads.forEach(lead => {
  const phone = (lead.phone || '').trim();
  const digits = phone.replace(/[^0-9]/g, '').slice(-10);
  const escapedName = (lead.name || '').replace(/'/g, "\\'");

  const assignedEmail = lead.assignedToId ? userEmailById[lead.assignedToId] : null;
  const assignedName = lead.assignedToId ? userNameById[lead.assignedToId] : null;

  let varName = null;
  if (assignedEmail) {
    if (assignedEmail.includes('sapna')) varName = '@sapna_id';
    else if (assignedEmail.includes('bharat')) varName = '@bharat_id';
    else if (assignedEmail.includes('manashvi')) varName = '@manashvi_id';
    else if (assignedEmail.includes('aarti')) varName = '@aarti_id';
    else if (assignedEmail.includes('kanishka')) varName = '@kanishka_id';
    else if (assignedEmail.includes('prashant')) varName = '@admin_id';
  }

  if (varName) {
    assignedCount++;
    stats[assignedName] = (stats[assignedName] || 0) + 1;
    sqlLines.push(`-- Lead: ${escapedName} | Assign to: ${assignedName}`);
    if (digits && digits.length >= 10) {
      sqlLines.push(`UPDATE \`Lead\` SET \`assignedToId\` = ${varName} WHERE \`phone\` LIKE '%${digits}';`);
    } else {
      sqlLines.push(`UPDATE \`Lead\` SET \`assignedToId\` = ${varName} WHERE \`name\` = '${escapedName}';`);
    }
  } else {
    unassignedCount++;
    sqlLines.push(`-- Lead: ${escapedName} | Unassigned`);
    if (digits && digits.length >= 10) {
      sqlLines.push(`UPDATE \`Lead\` SET \`assignedToId\` = NULL WHERE \`phone\` LIKE '%${digits}';`);
    } else {
      sqlLines.push(`UPDATE \`Lead\` SET \`assignedToId\` = NULL WHERE \`name\` = '${escapedName}';`);
    }
  }
});

sqlLines.push("\nCOMMIT;");
sqlLines.push("\n-- Verification query:");
sqlLines.push(`
SELECT u.name as SalesPerson, COUNT(l.id) as TotalLeadsAssigned
FROM \`User\` u
LEFT JOIN \`Lead\` l ON l.assignedToId = u.id
GROUP BY u.id, u.name;
`);

const outputPath = path.join(__dirname, 'restore_neon_assignments.sql');
fs.writeFileSync(outputPath, sqlLines.join('\n'));

console.log(`Successfully generated SQL file at: ${outputPath}`);
console.log(`Total Leads Processed: ${dump.leads.length}`);
console.log(`Assigned Leads: ${assignedCount}`);
console.log(`Unassigned Leads: ${unassignedCount}`);
console.log("Stats per sales rep:", stats);

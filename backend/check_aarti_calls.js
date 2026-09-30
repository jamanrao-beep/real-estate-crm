const fs = require('fs');
const path = require('path');

const dump = JSON.parse(fs.readFileSync(path.join(__dirname, 'neon_dump.json'), 'utf-8'));

// Aarti ID
const aarti = dump.users.find(u => u.email.includes('aarti'));

// Check calls made by Aarti in Neon
const aartiCalls = (dump.callLogs || []).filter(c => c.salesPersonId === aarti.id);
console.log(`Total call log entries for Aarti in Neon: ${aartiCalls.length}`);

// Group calls by leadId
const callsPerLead = {};
aartiCalls.forEach(c => {
  callsPerLead[c.leadId] = (callsPerLead[c.leadId] || 0) + 1;
});

console.log("Distinct leads called by Aarti:", Object.keys(callsPerLead).length);
console.log("Distribution of calls per lead:");
const distribution = {};
Object.values(callsPerLead).forEach(count => {
  distribution[`${count} calls`] = (distribution[`${count} calls`] || 0) + 1;
});
console.table(distribution);

// Sample leads with multiple calls
const leadsCalledMultipleTimes = Object.entries(callsPerLead).filter(([id, cnt]) => cnt > 1);
console.log(`Leads called more than once: ${leadsCalledMultipleTimes.length}`);
leadsCalledMultipleTimes.slice(0, 5).forEach(([leadId, cnt]) => {
  const lead = dump.leads.find(l => l.id === leadId);
  console.log(`- ${lead ? lead.name : leadId}: called ${cnt} times`);
});

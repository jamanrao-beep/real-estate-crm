const fs = require('fs');
const path = require('path');

const dump = JSON.parse(fs.readFileSync(path.join(__dirname, 'neon_dump.json'), 'utf-8'));

// Find Aarti's ID
const aarti = dump.users.find(u => u.name.toLowerCase().includes('aarti') || u.email.includes('aarti'));
console.log("Aarti user:", aarti);

// 1. Leads currently assignedToId == aarti.id
const currentLeads = dump.leads.filter(l => l.assignedToId === aarti.id);
console.log(`Leads directly assigned to Aarti in Neon: ${currentLeads.length}`);

// 2. Check LeadAssignmentHistory for Aarti
const aartiHistory = dump.assignmentHistory.filter(h => h.assignedToId === aarti.id);
console.log(`LeadAssignmentHistory entries where assignedToId == Aarti: ${aartiHistory.length}`);

// Unique lead IDs assigned to Aarti at ANY point in Neon history
const uniqueLeadsEverAssigned = new Set(aartiHistory.map(h => h.leadId));
console.log(`Unique leads ever assigned to Aarti in Neon history: ${uniqueLeadsEverAssigned.size}`);

// Check if any leads have Aarti in notes, brokerId, etc.
const leadsWithAartiMention = dump.leads.filter(l => {
  const str = JSON.stringify(l).toLowerCase();
  return str.includes('aarti');
});
console.log(`Leads mentioning 'aarti' in any field: ${leadsWithAartiMention.length}`);

const fs = require('fs');
const path = require('path');

const dump = JSON.parse(fs.readFileSync(path.join(__dirname, 'neon_dump.json'), 'utf-8'));

dump.leads.forEach((l, i) => {
  const phone = (l.phone || '').trim();
  const digits = phone.replace(/[^0-9]/g, '').slice(-10);
  if (!digits || digits.length < 10) {
    console.log(`Lead with non-standard phone [${i}]:`, {
      name: l.name,
      phone: l.phone,
      email: l.email,
      assignedToId: l.assignedToId
    });
  }
});

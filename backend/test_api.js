const axios = require('axios');

async function test() {
  try {
    console.log("1. Logging in as admin...");
    const loginRes = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'admin@crm.com',
      password: 'admin123'
    });
    const token = loginRes.data.token;
    console.log("Token received:", token.substring(0, 20) + "...");
    console.log("User Data:", loginRes.data.user);

    console.log("\n2. Fetching unassigned leads...");
    const leadsRes = await axios.get('http://localhost:4000/api/leads/unassigned', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Unassigned leads array:", leadsRes.data);
    
  } catch(err) {
    console.error("Error occurred:");
    console.error(err.response ? err.response.data : err.message);
  }
}

test();

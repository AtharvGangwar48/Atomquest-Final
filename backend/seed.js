const axios = require('axios');

const BASE = 'http://localhost:3001';
const DELAY = 100;

async function post(url, data, token) {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.post(BASE + url, data, { headers });
    return res.data;
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.response?.statusText || err.message;
    throw new Error(`POST ${url}: ${errorMsg}`);
  }
}

async function get(url, token) {
  try {
    const res = await axios.get(BASE + url, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.response?.statusText || err.message;
    throw new Error(`GET ${url}: ${errorMsg}`);
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function seed() {
  console.log('\n🌱 Seeding database...\n');

  // 1. Register users
  console.log('📝 Creating users...');
  let agent, customer, admin;

  try {
    agent = await post('/auth/register', {
      email: 'agent@demo.com',
      password: 'password123',
      name: 'Sarah (Agent)',
      role: 'agent',
    });
    console.log('  ✅ Agent: agent@demo.com');
  } catch (err) {
    if (err.message.includes('already exists')) {
      agent = await post('/auth/login', { email: 'agent@demo.com', password: 'password123' });
      console.log('  ✅ Agent exists (logged in)');
    } else throw err;
  }
  await sleep(DELAY);

  try {
    customer = await post('/auth/register', {
      email: 'customer@demo.com',
      password: 'password123',
      name: 'John (Customer)',
      role: 'customer',
    });
    console.log('  ✅ Customer: customer@demo.com');
  } catch (err) {
    if (err.message.includes('already exists')) {
      customer = await post('/auth/login', { email: 'customer@demo.com', password: 'password123' });
      console.log('  ✅ Customer exists (logged in)');
    } else throw err;
  }
  await sleep(DELAY);

  try {
    admin = await post('/auth/register', {
      email: 'admin-vcp@atomquest.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'agent',
    });
    console.log('  ✅ Admin: admin-vcp@atomquest.com (Note: Manually set role to admin in DB)\n');
  } catch (err) {
    if (err.message.includes('already exists')) {
      admin = await post('/auth/login', { email: 'admin-vcp@atomquest.com', password: 'admin123' });
      console.log('  ✅ Admin exists (logged in)\n');
    } else throw err;
  }

  const agentToken = agent.accessToken;
  const customerToken = customer.accessToken;

  // 2. Create 3 historical sessions (ended)
  console.log('📞 Creating 3 historical sessions...');
  for (let i = 1; i <= 3; i++) {
    try {
      await sleep(DELAY);
      const sessionRes = await post('/sessions', {}, agentToken);
      const sessionId = sessionRes.sessionId;
      const joinToken = sessionRes.joinToken;

      console.log(`  [${i}] Session created: ${sessionId}`);

      // Customer joins
      await sleep(DELAY);
      await post('/sessions/join', { token: joinToken }, customerToken);
      console.log(`  [${i}] Customer joined`);

      // Start recording
      await sleep(DELAY);
      const recRes = await post('/recordings/start', { sessionId }, agentToken);
      console.log(`  [${i}] Recording started`);

      // Stop recording
      await sleep(200);
      await post(`/recordings/${recRes.id}/stop`, {}, agentToken);
      console.log(`  [${i}] Recording stopped`);

      // End session
      await sleep(DELAY);
      await post(`/sessions/${sessionId}/end`, {}, agentToken);
      console.log(`  [${i}] Session ended`);
    } catch (err) {
      console.error(`  ❌ Session ${i} failed:`, err.message);
      throw err;
    }
  }

  // 3. Create 1 active session
  console.log('\n🟢 Creating 1 active session...');
  await sleep(DELAY);
  const liveSessionRes = await post('/sessions', {}, agentToken);
  const liveSessionId = liveSessionRes.sessionId;
  const liveJoinToken = liveSessionRes.joinToken;

  console.log(`  Session ID: ${liveSessionId}`);
  console.log(`  Join Token: ${liveJoinToken}`);
  console.log(`  Join URL: http://localhost:3000/session/join?token=${liveJoinToken}\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ SEED COMPLETE!\n');
  console.log('📋 DEMO CREDENTIALS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Agent:    agent@demo.com           / password123');
  console.log('Customer: customer@demo.com        / password123');
  console.log('Admin:    admin-vcp@atomquest.com  / admin123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n⚠️  IMPORTANT: Update admin role manually in database:');
  console.log('   UPDATE "user" SET role = \'admin\', "isVerified" = true WHERE email = \'admin-vcp@atomquest.com\';\n');
  console.log('\n🌐 URLS');
  console.log('App:       http://localhost:3000');
  console.log('Admin:     http://localhost:3000/admin');
  console.log('API:       http://localhost:3001');
  console.log('\n📊 Test the live session:');
  console.log(`Open as Agent:    http://localhost:3000 (login with agent@demo.com)`);
  console.log(`Open as Customer: http://localhost:3000/session/join?token=${liveJoinToken}\n`);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});

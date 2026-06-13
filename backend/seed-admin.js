const axios = require('axios');
const { Client } = require('pg');

const BASE = 'http://localhost:3001';

async function post(url, data) {
  try {
    const res = await axios.post(BASE + url, data);
    return res.data;
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.response?.statusText || err.message;
    throw new Error(`POST ${url}: ${errorMsg}`);
  }
}

async function seedAdmin() {
  console.log('\n🔐 Setting up Admin User...\n');

  // 1. Try to register admin (if doesn't exist)
  let adminExists = false;
  try {
    await post('/auth/register', {
      email: 'admin-vcp@atomquest.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'agent',
    });
    console.log('✅ Admin registered: admin-vcp@atomquest.com');
  } catch (err) {
    if (err.message.includes('already exists') || err.message.includes('Internal server error')) {
      console.log('⚠️  Admin already exists, updating role...');
      adminExists = true;
    } else {
      throw err;
    }
  }

  // 2. Update role to admin in database
  console.log('\n📝 Updating admin role in database...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_hWAn8RQK7VPf@ep-delicate-moon-aonib0iy-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const result = await client.query(
      `UPDATE users SET role = $1, "isVerified" = $2, "isActive" = $3 WHERE email = $4`,
      ['admin', true, true, 'admin-vcp@atomquest.com']
    );

    if (result.rowCount > 0) {
      console.log('✅ Admin role updated successfully');
    } else {
      console.log('⚠️  No user found with email admin-vcp@atomquest.com');
    }

    await client.end();
  } catch (err) {
    console.error('❌ Database update failed:', err.message);
    throw err;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ ADMIN SETUP COMPLETE!\n');
  console.log('🔑 ADMIN CREDENTIALS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Email:    admin-vcp@atomquest.com');
  console.log('Password: admin123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🌐 Admin Dashboard: http://localhost:3000/admin\n');
}

seedAdmin().catch(err => {
  console.error('❌ Admin seed failed:', err.message);
  process.exit(1);
});

#!/usr/bin/env node

/**
 * Admin User Seeding Script
 * 
 * This script creates an admin user using Supabase's admin functions.
 * Run with: node scripts/seed-admin.js
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in environment variables')
  process.exit(1)
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables')
  console.error('   Please add your Supabase service role key to .env file:')
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminUser() {
  console.log('🔧 Creating admin user...')
  
  const adminEmail = 'admin@examica.com'
  const adminPassword = 'bl4ckA$$'
  
  try {
    // Create user using admin API
    // The trigger will automatically create the user profile from raw_user_meta_data
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin'
      }
    })

    if (authError) {
      console.error('Auth error details:', JSON.stringify(authError, null, 2))
      throw authError
    }

    console.log('✅ Auth user created successfully:', authData.user.id)
    console.log('✅ User profile created automatically by database trigger')
    console.log('🎉 Admin user setup complete!')
    console.log('')
    console.log('Login credentials:')
    console.log('  Email:', adminEmail)
    console.log('  Password:', adminPassword)
    console.log('')

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message)
    process.exit(1)
  }
}

// Check if admin user already exists
async function checkExistingUser() {
  const adminEmail = 'admin@examica.com'
  
  try {
    const { data: users } = await supabase.auth.admin.listUsers()
    const existingUser = users?.users?.find(user => user.email === adminEmail)
    
    if (existingUser) {
      console.log('⚠️  Admin user already exists with ID:', existingUser.id)
      console.log('   To recreate, delete the existing user first or use a different email.')
      return true
    }
    
    return false
  } catch (error) {
    console.error('❌ Error checking existing users:', error.message)
    process.exit(1)
  }
}

async function main() {
  console.log('🚀 Admin User Seeding Script')
  console.log('============================')
  
  const userExists = await checkExistingUser()
  
  if (!userExists) {
    await createAdminUser()
  }
}

main().catch(console.error)
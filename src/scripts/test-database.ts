import { config } from 'dotenv';
import { supabase } from '../config/supabase';

// Load environment variables
config();

async function testDatabase() {
  console.log('🔍 Testing PersonaVault Database Connection...\n');

  // Debug environment variables first
  console.log('🔧 Environment Variables Check:');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');
  console.log('Current working directory:', process.cwd());
  console.log('');

  // Check if we have the required environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('❌ Missing required environment variables!');
    console.error('Please check your .env file or environment variables.');
    return;
  }

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic database connection...');
    console.log('🔗 Connecting to:', process.env.SUPABASE_URL);
    
    // Test the Supabase client directly
    console.log('🔧 Testing Supabase client...');
    console.log('Client URL:', process.env.SUPABASE_URL);
    console.log('Client has auth:', !!supabase.auth);
    console.log('Client has storage:', !!supabase.storage);
    
    // Test network connectivity
    console.log('🌐 Testing network connectivity...');
    try {
      const response = await fetch(process.env.SUPABASE_URL!);
      console.log('✅ Network connectivity:', response.status, response.statusText);
    } catch (networkError) {
      console.error('❌ Network connectivity failed:', networkError);
    }
    
    // Test Supabase auth (this should work even if tables don't exist)
    console.log('🔐 Testing Supabase auth...');
    try {
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError) {
        console.error('❌ Auth test failed:', authError);
      } else {
        console.log('✅ Auth test successful:', authData.session ? 'Has session' : 'No session');
      }
    } catch (authException) {
      console.error('❌ Auth exception:', authException);
    }
    
    // Try a simple ping first
    console.log('📡 Testing basic ping...');
    try {
      const { data: pingData, error: pingError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (pingError) {
        console.error('❌ Ping failed:', pingError);
        console.error('Error details:', {
          message: pingError.message,
          details: pingError.details,
          hint: pingError.hint,
          code: pingError.code,

        });
      } else {
        console.log('✅ Ping successful, data:', pingData);
      }
    } catch (pingException) {
      console.error('❌ Ping exception:', pingException);
    }
    
    // Now try the count query
    console.log('📊 Testing count query...');
    const { data: healthData, error: healthError } = await supabase
      .from('users')
      .select('*');
    
    if (healthError) {
      console.error('❌ Database connection failed:', healthError);
      console.error('Error details:', {
        message: healthError.message,
        details: healthError.details,
        hint: healthError.hint,
        code: healthError.code
      });
      return;
    }
    console.log('✅ Database connection successful, users found:', healthData?.length || 0);
    console.log('');

    // Test 2: Check if tables exist
    console.log('2️⃣ Checking table existence...');
    
    // Check users table
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Users table error:', usersError);
    } else {
      console.log('✅ Users table exists');
    }

    // Check user_workspaces table
    const { data: workspacesData, error: workspacesError } = await supabase
      .from('user_workspaces')
      .select('*')
      .limit(1);
    
    if (workspacesError) {
      console.error('❌ User_workspaces table error:', workspacesError);
    } else {
      console.log('✅ User_workspaces table exists');
    }

    // Check documents table
    const { data: documentsData, error: documentsError } = await supabase
      .from('documents')
      .select('*')
      .limit(1);
    
    if (documentsError) {
      console.error('❌ Documents table error:', documentsError);
    } else {
      console.log('✅ Documents table exists');
    }

    console.log('');

    // Test 3: Count records in each table
    console.log('3️⃣ Counting records in tables...');
    
    const { count: usersCount, error: usersCountError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (usersCountError) {
      console.error('❌ Users count error:', usersCountError);
    } else {
      console.log(`📊 Users table: ${usersCount} records`);
    }

    const { count: workspacesCount, error: workspacesCountError } = await supabase
      .from('user_workspaces')
      .select('*', { count: 'exact', head: true });
    
    if (workspacesCountError) {
      console.error('❌ Workspaces count error:', workspacesCountError);
    } else {
      console.log(`📊 User_workspaces table: ${workspacesCount} records`);
    }

    const { count: documentsCount, error: documentsCountError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });
    
    if (documentsCountError) {
      console.error('❌ Documents count error:', documentsCountError);
    } else {
      console.log(`📊 Documents table: ${documentsCount} records`);
    }

    console.log('');

    // Test 4: Check specific user data
    console.log('4️⃣ Checking specific user data...');
    const testUserId = '1a9d0ab7-50ca-4836-9bfa-0b89d73f8f0a';
    
    // Check if user exists in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single();
    
    if (userError) {
      console.error('❌ User lookup error:', userError);
    } else {
      console.log('✅ User found in users table:', {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        created_at: userData.created_at
      });
    }

    // Check if user has workspaces
    const { data: userWorkspaces, error: userWorkspacesError } = await supabase
      .from('user_workspaces')
      .select('*')
      .eq('user_id', testUserId);
    
    if (userWorkspacesError) {
      console.error('❌ User workspaces lookup error:', userWorkspacesError);
    } else {
      console.log(`📊 User has ${userWorkspaces?.length || 0} workspaces`);
      if (userWorkspaces && userWorkspaces.length > 0) {
        userWorkspaces.forEach((workspace, index) => {
          console.log(`   Workspace ${index + 1}:`, {
            id: workspace.id,
            name: workspace.name,
            is_default: workspace.is_default,
            created_at: workspace.created_at
          });
        });
      }
    }

    console.log('');

    // Test 5: Check database triggers
    console.log('5️⃣ Checking database triggers...');
    
    // Try to query the trigger function
    const { data: triggerData, error: triggerError } = await supabase
      .rpc('handle_new_user', { NEW: { id: 'test-trigger', email: 'test@example.com' } });
    
    if (triggerError) {
      console.log('ℹ️ Trigger function exists but cannot be called directly (expected)');
    } else {
      console.log('✅ Trigger function is callable');
    }

    console.log('');

    // Test 6: Check RLS policies
    console.log('6️⃣ Checking RLS policies...');
    
    // Try to insert a test workspace (should fail due to RLS)
    const { data: insertData, error: insertError } = await supabase
      .from('user_workspaces')
      .insert({
        user_id: testUserId,
        name: 'Test Workspace',
        description: 'Test workspace for debugging',
        is_default: false
      })
      .select();
    
    if (insertError) {
      console.log('ℹ️ RLS policy working (insert blocked):', insertError.message);
    } else {
      console.log('⚠️ RLS policy might not be working - insert succeeded');
    }

    console.log('');

    // Test 7: Check environment variables
    console.log('7️⃣ Checking environment variables...');
    console.log('🔗 Supabase URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('🔑 Supabase Anon Key:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
    console.log('🌍 Node Environment:', process.env.NODE_ENV || 'Not set');

    // Test 8: Check database schema and connection details
    console.log('\n8️⃣ Checking database schema and connection...');
    try {
      // Try to get database info
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_schema, table_name')
        .eq('table_schema', 'public')
        .limit(5);
      
      if (schemaError) {
        console.error('❌ Schema query failed:', schemaError);
      } else {
        console.log('📋 Available tables in public schema:', schemaData?.map(t => t.table_name) || []);
      }
      
      // Check if we're in the right database by looking for specific table
      const { data: tableCheck, error: tableCheckError } = await supabase
        .from('user_workspaces')
        .select('*')
        .limit(1);
      
      if (tableCheckError) {
        console.error('❌ Table check failed:', tableCheckError);
      } else {
        console.log('📊 user_workspaces table accessible, records found:', tableCheck?.length || 0);
        if (tableCheck && tableCheck.length > 0) {
          console.log('   Sample record:', tableCheck[0]);
        }
      }
      
      // Test 9: Verify we're in the right database
      console.log('\n9️⃣ Verifying database connection...');
      console.log('🔗 Expected URL:', process.env.SUPABASE_URL);
      console.log('🔗 Expected Project ID:', process.env.SUPABASE_URL?.split('/').pop());
      
      // Try to get a specific record we know exists
      const knownUserId = '1a9d0ab7-50ca-4836-9bfa-0b89d73f8f0a';
      const { data: knownUser, error: knownUserError } = await supabase
        .from('user_workspaces')
        .select('*')
        .eq('user_id', knownUserId)
        .eq('is_default', true)
        .single();
      
      if (knownUserError) {
        console.error('❌ Known user lookup failed:', knownUserError);
        console.error('This suggests we are NOT in the right database!');
      } else {
        console.log('✅ Found known user workspace:', knownUser);
        console.log('🎯 We ARE in the right database!');
      }
      
      // Test 10: Check if RLS is blocking access
      console.log('\n🔟 Testing RLS access...');
      try {
        // Try to get ALL workspaces (this might be blocked by RLS)
        const { data: allWorkspaces, error: allWorkspacesError } = await supabase
          .from('user_workspaces')
          .select('*');
        
        if (allWorkspacesError) {
          console.error('❌ RLS blocking access to all workspaces:', allWorkspacesError.message);
          console.log('💡 This explains why you see 0 records - RLS is blocking access!');
        } else {
          console.log('✅ RLS allows access to all workspaces, found:', allWorkspaces?.length || 0);
          if (allWorkspaces && allWorkspaces.length > 0) {
            console.log('   First workspace:', allWorkspaces[0]);
          }
        }
      } catch (rlsException) {
        console.error('❌ RLS test exception:', rlsException);
      }
      
      // Test 11: Direct data verification
      console.log('\n1️⃣1️⃣ Direct data verification...');
      try {
        // Try to get the exact record we know exists
        const { data: exactRecord, error: exactError } = await supabase
          .from('user_workspaces')
          .select('*')
          .eq('id', 'f5a18fc5-298d-49d4-af71-42f9cd04091f'); // Use the exact ID from your data
        
        if (exactError) {
          console.error('❌ Exact record lookup failed:', exactError);
        } else {
          console.log('✅ Exact record found:', exactRecord);
        }
        
        // Try a different approach - get by name
        const { data: byName, error: byNameError } = await supabase
          .from('user_workspaces')
          .select('*')
          .eq('name', 'Default Workspace');
        
        if (byNameError) {
          console.error('❌ Name-based lookup failed:', byNameError);
        } else {
          console.log('✅ Name-based lookup found:', byName?.length || 0, 'records');
        }
        
      } catch (directException) {
        console.error('❌ Direct verification exception:', directException);
      }
      
    } catch (schemaException) {
      console.error('❌ Schema check exception:', schemaException);
    }

    console.log('\n🎯 Database test completed!');

  } catch (error) {
    console.error('💥 Database test failed:', error);
  }
}

// Run the test
testDatabase().catch(console.error);

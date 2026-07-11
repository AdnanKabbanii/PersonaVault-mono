import { supabase } from '../config/supabase';

async function checkCurrentUser() {
  try {
    console.log('🔍 Checking current authenticated user...');
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Error getting user:', error);
      return;
    }
    
    if (!user) {
      console.log('❌ No authenticated user found');
      return;
    }
    
    console.log('✅ Current user details:');
    console.log('  - ID:', user.id);
    console.log('  - Email:', user.email);
    console.log('  - Created at:', user.created_at);
    console.log('  - Full user object:', JSON.stringify(user, null, 2));
    
    // Check if this user exists in the users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Error getting user profile:', profileError);
    } else {
      console.log('✅ User profile from database:');
      console.log('  ', userProfile);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkCurrentUser().catch(console.error);

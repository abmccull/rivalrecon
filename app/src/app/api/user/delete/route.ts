import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user from the request
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: async () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Initialize the admin client with service role
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Step 1: Delete any storage files associated with the user
    const { data: storageFiles, error: storageError } = await serviceClient.storage
      .from('profiles')
      .list(`avatars/${userId}`);
      
    if (storageError) {
      console.error('Error listing user storage files:', storageError);
    } else if (storageFiles && storageFiles.length > 0) {
      // Delete all files found
      const filesToDelete = storageFiles.map(file => `avatars/${userId}/${file.name}`);
      const { error: deleteError } = await serviceClient.storage
        .from('profiles')
        .remove(filesToDelete);
        
      if (deleteError) {
        console.error('Error deleting user storage files:', deleteError);
      }
    }
    
    // Step 2: Delete the user's profile data
    const { error: profileError } = await serviceClient
      .from('profiles')
      .delete()
      .eq('id', userId);
      
    if (profileError) {
      console.error('Error deleting user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to delete profile data' },
        { status: 500 }
      );
    }
    
    // Step 3: Admin delete the user's auth account
    const { error: userDeleteError } = await serviceClient.auth.admin.deleteUser(userId);
    
    if (userDeleteError) {
      console.error('Error deleting user account:', userDeleteError);
      return NextResponse.json(
        { error: 'Failed to delete user account' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Account successfully deleted' 
    });
  } catch (error) {
    console.error('Unexpected error in account deletion:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 
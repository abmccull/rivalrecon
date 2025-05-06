import { createServerClient } from '@supabase/ssr';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user from the request
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
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

    // Step 2: Delete user profile data
    const { error: profileError } = await serviceClient
      .from('profiles')
      .delete()
      .eq('id', userId);
      
    if (profileError) {
      console.error('Error deleting user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to delete user profile' },
        { status: 500 }
      );
    }

    // Step 3: Delete user auth record
    const { error: authError } = await serviceClient.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error('Error deleting user auth record:', authError);
      return NextResponse.json(
        { error: 'Failed to delete user account' },
        { status: 500 }
      );
    }

    // Also sign out the user from the current session
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: 'User account deleted successfully'
    });
  } catch (error) {
    console.error('Error in user deletion:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

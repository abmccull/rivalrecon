require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateSubmissionStatus() {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .update({ status: 'pending' })
      .eq('id', '2f5780ce-4483-4c25-b6f5-97faa3c0b96f')
      .select();

    if (error) throw error;
    
    console.log('Updated submission:', data);
    process.exit(0);
  } catch (error) {
    console.error('Error updating submission:', error);
    process.exit(1);
  }
}

updateSubmissionStatus(); 
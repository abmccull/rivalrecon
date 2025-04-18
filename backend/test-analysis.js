const TaskManager = require('./services/taskManager');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize TaskManager
const taskManager = new TaskManager(process.env.REDIS_URL || 'redis://localhost:6379');

async function triggerAnalysis() {
    try {
        const submissionId = '20a0b241-fd73-44a1-a113-b0074da477bc';
        
        // Queue the analysis task
        console.log('Queueing analysis task for submission:', submissionId);
        const taskId = await taskManager.queueAnalysisTask(submissionId);
        console.log('Analysis task queued with ID:', taskId);

        // Store the task ID
        await taskManager.storeTaskIdForSubmission(submissionId, taskId);
        
        // Wait for task completion
        console.log('Waiting for task completion...');
        const result = await taskManager.waitForTaskCompletion(taskId);
        console.log('Task completed:', result);

        // Close Redis connection
        await taskManager.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Run the analysis
triggerAnalysis(); 
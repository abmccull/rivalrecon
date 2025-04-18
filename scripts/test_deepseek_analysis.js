const { createClient } = require('@supabase/supabase-js');
const DeepSeekService = require('../backend/services/deepseekService');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/worker/.env') });

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize DeepSeek service
const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
const deepseekService = new DeepSeekService(deepseekApiKey);

async function testDeepSeekAnalysis() {
    const submissionId = '20a0b241-fd73-44a1-a113-b0074da477bc';

    try {
        console.log('Fetching reviews from Supabase...');
        
        // Fetch reviews for the submission
        const { data: reviews, error: reviewsError } = await supabase
            .from('reviews')
            .select('*')
            .eq('submission_id', submissionId);

        if (reviewsError) {
            throw new Error(`Error fetching reviews: ${reviewsError.message}`);
        }

        if (!reviews || reviews.length === 0) {
            throw new Error('No reviews found for the given submission ID');
        }

        console.log(`Found ${reviews.length} reviews to analyze`);

        // Fetch submission details for metadata
        const { data: submission, error: submissionError } = await supabase
            .from('submissions')
            .select('*')
            .eq('id', submissionId)
            .single();

        if (submissionError) {
            throw new Error(`Error fetching submission: ${submissionError.message}`);
        }

        // Prepare metadata for analysis
        const metadata = {
            product_name: submission.product_title || 'Unknown Product',
            brand: submission.brand_name || 'Unknown Brand',
            category: submission.category_name || 'Unknown Category'
        };

        console.log('Starting DeepSeek analysis...');
        const analysisResults = await deepseekService.analyzeReviews(reviews, metadata);
        console.log('Analysis completed successfully');
        console.log('Analysis results:', JSON.stringify(analysisResults, null, 2));

        // Store analysis results in Supabase
        console.log('Storing analysis results in Supabase...');
        const { error: insertError } = await supabase
            .from('analyses')
            .insert({
                submission_id: submissionId,
                sentiment_score: analysisResults.sentiment_score,
                key_themes: analysisResults.key_themes,
                top_positives: analysisResults.top_positives,
                top_negatives: analysisResults.top_negatives,
                word_map: analysisResults.word_map,
                competitive_insights: analysisResults.competitive_insights,
                opportunities: analysisResults.opportunities,
                ratings_over_time: analysisResults.ratings_over_time,
                trending: analysisResults.trending
            });

        if (insertError) {
            throw new Error(`Error storing analysis results: ${insertError.message}`);
        }

        console.log('Analysis results stored successfully');

        // Update submission status
        const { error: updateError } = await supabase
            .from('submissions')
            .update({ status: 'completed' })
            .eq('id', submissionId);

        if (updateError) {
            throw new Error(`Error updating submission status: ${updateError.message}`);
        }

        console.log('Submission status updated to completed');

    } catch (error) {
        console.error('Error in test script:', error);
        
        // Update submission status to failed if there's an error
        try {
            await supabase
                .from('submissions')
                .update({ status: 'failed' })
                .eq('id', submissionId);
        } catch (updateError) {
            console.error('Error updating submission status to failed:', updateError);
        }
    }
}

// Run the test
testDeepSeekAnalysis().then(() => {
    console.log('Test script completed');
    process.exit(0);
}).catch((error) => {
    console.error('Test script failed:', error);
    process.exit(1);
}); 
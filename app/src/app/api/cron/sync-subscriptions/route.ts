import { NextResponse } from 'next/server';
import { syncAllSubscriptions } from '@/lib/subscription-sync';
import { logger } from '@/lib/logger';

/**
 * Cron job endpoint to periodically sync all subscription data with Stripe
 * This route should be called by a scheduler (like Vercel Cron Jobs) daily
 */
export async function GET(request: Request) {
  try {
    // Verify the cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // If CRON_SECRET is configured, verify it
    if (cronSecret && (!authHeader || authHeader !== `Bearer ${cronSecret}`)) {
      logger.error('Unauthorized attempt to trigger subscription sync cron job');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    logger.debug('Starting scheduled subscription sync job');
    
    // Run the sync for all subscriptions
    const result = await syncAllSubscriptions();
    
    // Handle different result types
    let stats = {
      total: 0,
      succeeded: 0,
      failed: 0
    };
    
    // Extract stats if available
    if ('totalProcessed' in result) {
      stats = {
        total: result.totalProcessed,
        succeeded: result.succeeded,
        failed: result.failed
      };
      logger.debug(`Subscription sync completed: ${stats.succeeded} succeeded, ${stats.failed} failed`);
    } else if ('message' in result) {
      logger.debug(`Subscription sync status: ${result.message}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'message' in result ? result.message : 'Subscription sync completed',
      stats
    });
    
  } catch (error: any) {
    logger.error('Error in subscription sync cron job:', error);
    return NextResponse.json(
      { error: `Failed to sync subscriptions: ${error.message}` },
      { status: 500 }
    );
  }
}

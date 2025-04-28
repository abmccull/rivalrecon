-- Function that will be triggered on insert
CREATE OR REPLACE FUNCTION public.handle_new_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Make HTTP request to our webhook
  PERFORM
    net.http_post(
      url := 'https://your-backend-domain.com/webhooks/submission-created',
      body := json_build_object(
        'record', row_to_json(NEW),
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA
      )::jsonb
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the submissions table
DROP TRIGGER IF EXISTS on_submission_created ON public.submissions;
CREATE TRIGGER on_submission_created
  AFTER INSERT ON public.submissions
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.handle_new_submission();

-- Grant permissions to use the net extension to make HTTP requests
-- Note: This requires the http extension to be enabled in your Supabase project
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role; 
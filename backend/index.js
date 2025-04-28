const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const submissionsRouter = require('./routes/submissions');
const webhooksRouter = require('./routes/webhooks');

// Debug: Print environment variables
console.log('Environment Variables:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '[PRESENT]' : '[MISSING]');

const app = express();
const port = process.env.PORT || 3001;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Debug: Print variables used for client creation
console.log('Variables used for Supabase client:');
console.log('supabaseUrl:', supabaseUrl);
console.log('supabaseKey:', supabaseKey ? '[PRESENT]' : '[MISSING]');

const supabase = createClient(supabaseUrl, supabaseKey);

// Export supabase client for use in other modules
module.exports.supabase = supabase;

// Middleware
app.use(cors());
app.use(express.json());

// Authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Webhooks - no auth middleware as these are called directly by Supabase
app.use('/webhooks', webhooksRouter);

// Protected routes
app.use('/api/submissions', authMiddleware, submissionsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 
# Celery Message Format and Redis Integration

This document explains the Celery message format used in the RivalRecon application and how it interacts with Redis. It provides guidance for maintaining and troubleshooting the communication between the Node.js backend and Python Celery workers.

## Celery Message Format

Celery expects messages in a specific format when using Redis as a broker. The message format implemented in the `taskManager.js` file includes:

```javascript
{
  "body": {
    "task": "worker.task_name",
    "id": "uuid_task_id",
    "args": ["argument1", "argument2"],
    "kwargs": {},
    "retries": 0,
    "eta": null,
    "expires": null,
    "utc": true
  },
  "content_type": "application/json",
  "content_encoding": "utf-8",
  "properties": {
    "correlation_id": "uuid_task_id",
    "reply_to": "",
    "delivery_mode": 2,
    "delivery_info": {
      "exchange": "",
      "routing_key": "celery"
    }
  }
}
```

This format includes:

1. **body**: Contains the main task information including task name, ID, arguments, and execution metadata
2. **content_type** and **content_encoding**: Describes the format of the body content
3. **properties**: Contains message delivery metadata required by Celery

## Redis Command Format

When sending messages to Redis, it's critical to use the correct argument format for the `rpush` command:

```javascript
// CORRECT: Separate arguments for key and value
redis.rpush('celery', JSON.stringify(message));

// INCORRECT: Concatenated or array format
redis.rpush('celery,' + JSON.stringify(message)); // This will fail
redis.rpush(['celery', JSON.stringify(message)]); // May not work as expected
```

The Redis client implementation in `redis.js` includes a wrapper around the `rpush` method to ensure proper argument handling.

## Task Naming Convention

Tasks in the worker must be prefixed with `worker.` when referenced from Node.js. For example:

- `scrape_reviews` in the Python worker is referenced as `worker.scrape_reviews` in Node.js
- `analyze_reviews` in the Python worker is referenced as `worker.analyze_reviews` in Node.js

## Common Issues and Troubleshooting

### KeyError: 'task'

This error occurs when Celery cannot find the task name in the expected location in the message. Check:

1. The message format to ensure `body.task` contains the full task name
2. The task name prefix (ensure it's `worker.task_name`)

### KeyError: 'properties'

This error occurs when the message doesn't contain the required `properties` field. Ensure your message includes the `properties` section with `correlation_id` and `delivery_info`.

### TypeError: 'NoneType' object is not subscriptable

This error usually indicates that the message body is `null` or in an unexpected format. Check:

1. The JSON structure of your message
2. That `rpush` is being called with the correct arguments

### Redis Command Format Issues

If you see Redis command logs containing commas in the key (e.g., `rpush('celery,{...`), the Redis command is being malformed. Check:

1. How the `rpush` method is being called
2. Ensure you're not concatenating the queue name and message

## Testing

Two test scripts are provided to verify the messaging system:

1. `test-redis.js`: Tests basic Redis rpush functionality
2. `test-task.js`: Tests the complete TaskManager task queuing

Run these tests to verify that the messaging system is working correctly after any changes:

```bash
node test-redis.js
node test-task.js
```

## Further Reading

- [Celery Protocol Documentation](https://docs.celeryq.dev/en/stable/internals/protocol.html)
- [Redis Command Reference for RPUSH](https://redis.io/commands/rpush/)
- [ioredis Documentation](https://github.com/luin/ioredis)

This document was last updated based on fixes implemented on April 15, 2025. 
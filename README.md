# poc build w/ webhook

use of express server.

```
"dependencies": {
    "body-parser": "^1.20.0",
    "dotenv": "^16.0.1",
    "express": "^4.18.1"
}
```

# Endpoints

### `/hook`

Used to start an action, securized by a `Bearer`.

### `/check`

Used to check the state of the action trigger by `/hook`.

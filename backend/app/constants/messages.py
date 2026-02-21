"""Domain and HTTP error messages used across the app."""

# Not found (404)
ERROR_MESSAGE_OBJECT_NOT_FOUND = "Object not found"
ERROR_MESSAGE_MASTER_PLAN_NOT_FOUND = "Master plan not found"
ERROR_MESSAGE_PROJECT_NOT_FOUND = "Project not found"
ERROR_MESSAGE_FILE_NOT_FOUND = "File not found"

# Auth
ERROR_MESSAGE_INCORRECT_EMAIL_OR_PASSWORD = "Incorrect email or password"
ERROR_MESSAGE_EMAIL_ALREADY_REGISTERED = "Email already registered"
ERROR_MESSAGE_NOT_AUTHENTICATED = "Not authenticated"

# AI
ERROR_MESSAGE_AI_NOT_CONFIGURED = (
    "AI is not configured. Set AI_API_KEY in .env to enable."
)
ERROR_MESSAGE_AI_CHAT_NOT_CONFIGURED = (
    "AI chat is not configured. Set AI_API_KEY in .env to enable."
)
ERROR_MESSAGE_NO_RESPONSE_FROM_MODEL = "No response from the model."

# Geometry (object point)
ERROR_MESSAGE_GEOMETRY_TYPE_POINT = "Object geometry must be type 'Point'"
ERROR_MESSAGE_GEOMETRY_COORDS_LNG_LAT = (
    "Point geometry must have coordinates [lng, lat]"
)
ERROR_MESSAGE_GEOMETRY_COORDS_NUMBERS = "Point coordinates must be numbers"

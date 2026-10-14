# API Specification — /api/upload.js

## Endpoint
`POST /api/upload`

## Headers
- `Content-Type: application/json`

## Request Body
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

## Response Success (200 OK)
```json
{
  "success": true,
  "url": "https://pub-5b2c3ea96c8b4537be5a1e8b0c44275b.r2.dev/photobooth/1711234567890.jpg"
}
```

## Response Error (500 Internal Server Error)
```json
{
  "error": "Upload gagal",
  "details": "Error message details"
}
```

## Configuration Limits
- Body parser size limit: `12mb`
- CORS enabled (`Access-Control-Allow-Origin: *`)

# Translation Examples - English Supported ✅

## Overview

The translation feature supports **13 languages** including **English**. You can translate:
- ✅ **FROM any language TO English**
- ✅ **FROM English TO any other language**
- ✅ **Between any two supported languages**

---

## Supported Languages

| Language Code | Language Name | Example Use Case |
|---------------|---------------|------------------|
| `en` | English | Translate Spanish/French/etc → English |
| `es` | Spanish | Translate English → Spanish |
| `fr` | French | Translate English → French |
| `de` | German | Translate English → German |
| `it` | Italian | Translate English → Italian |
| `pt` | Portuguese | Translate English → Portuguese |
| `ru` | Russian | Translate English → Russian |
| `zh` | Chinese | Translate English → Chinese |
| `ja` | Japanese | Translate English → Japanese |
| `ko` | Korean | Translate English → Korean |
| `ar` | Arabic | Translate English → Arabic |
| `hi` | Hindi | Translate English → Hindi |

---

## API Examples

### Example 1: Spanish → English

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/ai/translate \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hola, ¿cómo estás?",
    "targetLanguage": "en"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "original": "Hola, ¿cómo estás?",
    "translation": "Hello, how are you?",
    "targetLanguage": "en",
    "detectedLanguage": "Spanish"
  }
}
```

---

### Example 2: French → English

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/ai/translate \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Bonjour, comment allez-vous?",
    "targetLanguage": "en"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "original": "Bonjour, comment allez-vous?",
    "translation": "Hello, how are you?",
    "targetLanguage": "en",
    "detectedLanguage": "French"
  }
}
```

---

### Example 3: German → English

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/ai/translate \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Guten Tag, wie geht es Ihnen?",
    "targetLanguage": "en"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "original": "Guten Tag, wie geht es Ihnen?",
    "translation": "Good day, how are you?",
    "targetLanguage": "en",
    "detectedLanguage": "German"
  }
}
```

---

### Example 4: Hindi → English

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/ai/translate \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "नमस्ते, आप कैसे हैं?",
    "targetLanguage": "en"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "original": "नमस्ते, आप कैसे हैं?",
    "translation": "Hello, how are you?",
    "targetLanguage": "en",
    "detectedLanguage": "Hindi"
  }
}
```

---

### Example 5: English → Spanish

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/ai/translate \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how are you?",
    "targetLanguage": "es"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "original": "Hello, how are you?",
    "translation": "Hola, ¿cómo estás?",
    "targetLanguage": "es",
    "detectedLanguage": "English"
  }
}
```

---

### Example 6: English → Chinese

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/ai/translate \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Good morning, have a great day!",
    "targetLanguage": "zh"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "original": "Good morning, have a great day!",
    "translation": "早上好，祝你有美好的一天！",
    "targetLanguage": "zh",
    "detectedLanguage": "English"
  }
}
```

---

## Frontend Integration

### React/TypeScript Example

```typescript
// Translation function
async function translateMessage(
  message: string,
  targetLanguage: 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko' | 'ar' | 'hi'
) {
  const response = await fetch('/api/v1/ai/translate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      targetLanguage,
    }),
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Premium subscription required');
    }
    throw new Error('Translation failed');
  }

  const result = await response.json();
  return result.data;
}

// Example usage: Translate Spanish to English
const result = await translateMessage('Hola amigo', 'en');
console.log(result.translation); // "Hello friend"

// Example usage: Translate English to Spanish
const result2 = await translateMessage('Hello friend', 'es');
console.log(result2.translation); // "Hola amigo"
```

### Language Selector Component

```tsx
// Language dropdown component
const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
];

function LanguageSelector({ onSelect }: { onSelect: (lang: string) => void }) {
  return (
    <Select onValueChange={onSelect}>
      <SelectTrigger>
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### Usage in Chat Component

```tsx
function MessageTranslate({ message }: { message: string }) {
  const [targetLang, setTargetLang] = useState<string>('en');
  const [translation, setTranslation] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    setLoading(true);
    try {
      const result = await translateMessage(message, targetLang as any);
      setTranslation(result.translation);
    } catch (error) {
      console.error('Translation failed:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <LanguageSelector onSelect={setTargetLang} />
      <Button onClick={handleTranslate} disabled={loading}>
        {loading ? 'Translating...' : 'Translate'}
      </Button>
      {translation && (
        <div className="mt-2 p-2 bg-muted rounded">
          {translation}
        </div>
      )}
    </div>
  );
}
```

---

## Common Use Cases

### 1. Auto-Translate to User's Preferred Language

Detect user's browser language and auto-translate messages:

```typescript
const userLanguage = navigator.language.split('-')[0]; // 'en', 'es', 'fr', etc.

// Auto-translate incoming messages if not in user's language
if (message.detectedLanguage !== userLanguage) {
  const translated = await translateMessage(message.content, userLanguage);
  showTranslation(translated);
}
```

### 2. Translate to English for Moderation

Translate all messages to English for content moderation:

```typescript
// Translate to English first for moderation
const englishVersion = await translateMessage(userMessage, 'en');
const moderationResult = await moderateContent(englishVersion.translation);

if (moderationResult.flagged) {
  blockMessage('Message contains inappropriate content');
}
```

### 3. Multi-Language Group Chat

Allow users in different countries to communicate:

```typescript
// User A (Spanish speaker) sends: "Hola, ¿cómo estás?"
// User B (English speaker) receives: "Hello, how are you?" (auto-translated)
// User C (French speaker) receives: "Bonjour, comment allez-vous?" (auto-translated)

async function broadcastMessage(message: string, recipients: User[]) {
  for (const recipient of recipients) {
    const translated = await translateMessage(
      message,
      recipient.preferredLanguage
    );
    sendNotification(recipient, translated.translation);
  }
}
```

---

## Error Handling

### Premium Subscription Required

```json
{
  "statusCode": 403,
  "message": "Premium subscription required. Upgrade your plan to access AI features.",
  "error": "Forbidden"
}
```

**Solution:** Upgrade to Premium subscription ($9.99/month)

### Invalid Language Code

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "targetLanguage must be a valid enum value"
  ]
}
```

**Solution:** Use one of the supported language codes: `en`, `es`, `fr`, `de`, `it`, `pt`, `ru`, `zh`, `ja`, `ko`, `ar`, `hi`

### Empty Message

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "message must be a string",
    "message should not be empty"
  ]
}
```

**Solution:** Provide a non-empty message to translate

---

## Important Notes

1. **English is fully supported** - You can translate TO and FROM English
2. **AI-powered translation** - Uses Groq's Llama 3.3 (70B) model for high-quality translations
3. **Context-aware** - Preserves formatting, emojis, and special characters
4. **Auto language detection** - Backend automatically detects source language
5. **Premium feature** - Requires Premium subscription ($9.99/month or higher)
6. **Groq API limits** - Free tier: 14,400 requests/day, 30 requests/minute

---

## Testing Translation to English

### Test 1: Spanish → English

```bash
curl -X POST http://localhost:3000/api/v1/ai/translate \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Buenos días", "targetLanguage": "en"}'
```

Expected output:
```json
{
  "translation": "Good morning",
  "detectedLanguage": "Spanish"
}
```

### Test 2: French → English

```bash
curl -X POST http://localhost:3000/api/v1/ai/translate \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Merci beaucoup", "targetLanguage": "en"}'
```

Expected output:
```json
{
  "translation": "Thank you very much",
  "detectedLanguage": "French"
}
```

### Test 3: Japanese → English

```bash
curl -X POST http://localhost:3000/api/v1/ai/translate \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"message": "ありがとうございます", "targetLanguage": "en"}'
```

Expected output:
```json
{
  "translation": "Thank you very much",
  "detectedLanguage": "Japanese"
}
```

---

## Summary

✅ **English is fully supported as a translation target**
✅ **Translate FROM any of 12 languages TO English**
✅ **Translate FROM English TO any of 12 languages**
✅ **AI-powered with Groq (FREE API)**
✅ **Premium feature ($9.99/month)**

The translation feature is ready to use - just make sure your frontend includes English (`en`) in the language selector dropdown!

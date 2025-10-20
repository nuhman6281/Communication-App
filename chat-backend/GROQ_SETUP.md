# Groq AI Setup (FREE Alternative to OpenAI)

## Why Groq?

- **100% FREE** - No credit card required
- **Fast** - Faster than OpenAI (< 1 second responses)
- **Quality** - Llama 3.3 (70B) performs similar to GPT-3.5
- **Generous Limits** - 14,400 requests/day on free tier

## Getting Your FREE Groq API Key

### Step 1: Sign Up (2 minutes)

1. Go to: **https://console.groq.com**
2. Click "Sign Up" or "Get Started"
3. Sign up with:
   - Google account (recommended - instant)
   - GitHub account
   - Or email + password

### Step 2: Get Your API Key

1. After signing in, you'll see the Groq Console
2. Click on "API Keys" in the left sidebar
3. Click "Create API Key"
4. Give it a name (e.g., "ChatApp Development")
5. Click "Create"
6. **Copy the API key** (it starts with `gsk_...`)

### Step 3: Add to Your Project

1. Open your `.env` file in the `chat-backend` folder
2. Find the line: `GROQ_API_KEY=your-groq-api-key-here`
3. Replace `your-groq-api-key-here` with your actual Groq API key
4. Save the file

**Example:**
```env
GROQ_API_KEY=gsk_1234567890abcdefghijklmnopqrstuvwxyz...
```

### Step 4: Restart the Backend

1. Stop your backend server (Ctrl+C)
2. Start it again: `npm run start:dev`
3. You should see: `✅ Groq AI provider initialized (FREE tier)`

## Verify It's Working

Try the AI features in your chat app:
- Message Enhancement
- Translation
- Smart Replies

You should get responses within 1-2 seconds!

## Free Tier Limits

- **Requests per day**: 14,400
- **Requests per minute**: 30
- **Tokens per minute**: 20,000

This is MORE than enough for development and testing!

## Switching Back to OpenAI Later

When you're ready to use OpenAI (requires paid account):

1. Open `.env` file
2. Change: `AI_PROVIDER=groq` to `AI_PROVIDER=openai`
3. Uncomment the OpenAI API key line
4. Add credits to your OpenAI account

That's it! The code supports both providers.

## Troubleshooting

### Error: "Groq API key not configured"
- Make sure you added your key to `.env`
- Check for typos
- Restart the backend server

### Error: "Rate limit exceeded"
- You've hit the free tier limit (30 requests/minute)
- Wait a minute and try again
- Or upgrade to Groq paid tier for higher limits

### Slow responses?
- Groq is usually FASTER than OpenAI (< 1 second)
- If slow, check your internet connection
- Groq servers might be under load (rare)

## Need Help?

- Groq Docs: https://console.groq.com/docs
- Groq Discord: https://discord.gg/groq
- Or ask me (Claude) for help!

---

**Note**: Keep your API key secret! Don't commit it to Git or share it publicly.

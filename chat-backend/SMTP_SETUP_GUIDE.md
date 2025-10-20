# SMTP Email Configuration Guide

## Overview

Your backend already has email verification fully implemented! You just need to configure real SMTP credentials to make it work.

**What's Already Done:**
- ✅ Email service implemented
- ✅ Verification emails on registration
- ✅ Password reset emails
- ✅ Welcome emails
- ✅ Email templates (beautiful HTML)

**What You Need:** Real SMTP credentials

---

## Option 1: Gmail SMTP (Recommended for Development)

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** in the left sidebar
3. Under "How you sign in to Google", click **2-Step Verification**
4. Follow the prompts to enable it

### Step 2: Generate App Password

1. Go to https://myaccount.google.com/apppasswords
2. Select app: **Mail**
3. Select device: **Other (Custom name)**
4. Enter name: **ChatApp Backend**
5. Click **Generate**
6. Copy the 16-character password (it looks like: `abcd efgh ijkl mnop`)

### Step 3: Update `.env` File

Open your `.env` file and update these lines:

```env
# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com           # ← Your Gmail address
SMTP_PASSWORD=abcd efgh ijkl mnop        # ← The app password from Step 2
SMTP_FROM=noreply@yourdomain.com         # ← Can be your-email@gmail.com
SMTP_FROM_NAME=ChatApp
```

**Example with real values:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=shibili.mc@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop
SMTP_FROM=shibili.mc@gmail.com
SMTP_FROM_NAME=ChatApp
```

### Step 4: Restart Backend

```bash
cd chat-backend
npm run start:dev
```

You should see:
```
✅ Email transporter initialized: smtp.gmail.com:587
```

---

## Option 2: Gmail with OAuth2 (More Secure)

If you want even better security, use OAuth2 instead of app passwords.

**Setup steps:** https://nodemailer.com/smtp/oauth2/

---

## Option 3: Other Email Services

### SendGrid (FREE 100 emails/day)

1. Sign up at https://sendgrid.com/
2. Get your API key
3. Update `.env`:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=YOUR_SENDGRID_API_KEY
SMTP_FROM=noreply@yourdomain.com
SMTP_FROM_NAME=ChatApp
```

### Mailgun (FREE 100 emails/day)

1. Sign up at https://www.mailgun.com/
2. Verify your domain or use sandbox domain
3. Get SMTP credentials
4. Update `.env`:

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=YOUR_MAILGUN_PASSWORD
SMTP_FROM=noreply@your-domain.mailgun.org
SMTP_FROM_NAME=ChatApp
```

### Mailtrap (For Testing Only)

1. Sign up at https://mailtrap.io/
2. Get inbox credentials
3. Update `.env`:

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your_mailtrap_username
SMTP_PASSWORD=your_mailtrap_password
SMTP_FROM=noreply@chatapp.com
SMTP_FROM_NAME=ChatApp
```

**Note:** Mailtrap catches all emails - they won't be sent to real users. Good for testing!

---

## Testing Email Configuration

### Method 1: Test Registration

1. Start your backend
2. Register a new user from frontend
3. Check your email inbox
4. You should receive a verification email

### Method 2: Check Backend Logs

When you register, you should see:

```
[EmailService] Email sent successfully to user@example.com: <message-id>
```

If SMTP isn't configured:
```
⚠️ SMTP credentials not configured. Email sending will be disabled.
[EmailService] Email transporter not configured. Skipping email send.
```

### Method 3: Direct Test (Create Test Script)

Create `test-email.js` in backend root:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password',
  },
});

transporter.sendMail({
  from: 'your-email@gmail.com',
  to: 'test-recipient@example.com',
  subject: 'Test Email from ChatApp',
  text: 'If you receive this, SMTP is working!',
  html: '<h1>Success!</h1><p>SMTP is configured correctly.</p>',
})
.then(info => {
  console.log('✅ Email sent successfully!');
  console.log('Message ID:', info.messageId);
})
.catch(error => {
  console.error('❌ Failed to send email:', error.message);
});
```

Run it:
```bash
node test-email.js
```

---

## Email Verification Flow

### How It Works:

1. **User Registers**
   ```
   POST /api/v1/auth/register
   {
     "email": "user@example.com",
     "username": "johndoe",
     "password": "SecurePass123",
     "firstName": "John",
     "lastName": "Doe"
   }
   ```

2. **Backend Creates User**
   - User saved to database with `isVerified: false`
   - Verification token generated and saved
   - Token expires in 24 hours

3. **Verification Email Sent**
   ```
   To: user@example.com
   Subject: Verify your email address

   Hi John,

   Thank you for signing up! Please verify your email address to get started.

   [Verify Email Address Button]

   Link: http://localhost:5174/verify-email?token=abc123...

   This link will expire in 24 hours.
   ```

4. **User Clicks Link**
   - Frontend opens: `/verify-email?token=abc123...`
   - Frontend sends token to backend: `POST /api/v1/auth/verify-email`

5. **Backend Verifies Token**
   - Checks if token exists and not expired
   - Marks user as verified: `isVerified: true`
   - Deletes verification token
   - Sends welcome email

6. **Welcome Email Sent**
   ```
   Subject: Welcome to ChatApp!

   Hi John,

   Your email has been verified successfully! You're all set.

   [Get Started Button]
   ```

7. **User Can Now Login**
   - Before verification: Login blocked (or allowed with warning)
   - After verification: Full access

---

## Email Templates

Your backend includes beautiful HTML email templates:

### 1. Verification Email
- **Subject:** "Verify your email address"
- **Contains:** Verification button + link
- **Expires:** 24 hours
- **Template:** Lines 87-155 in `email.service.ts`

### 2. Password Reset Email
- **Subject:** "Reset your password"
- **Contains:** Reset button + link
- **Expires:** 1 hour
- **Template:** Lines 160-231 in `email.service.ts`

### 3. Welcome Email
- **Subject:** "Welcome to ChatApp!"
- **Contains:** Feature list + Get Started button
- **Sent:** After email verification
- **Template:** Lines 236-311 in `email.service.ts`

### 4. New Message Notification
- **Subject:** "New message from {sender}"
- **Contains:** Message preview + View button
- **Sent:** When user receives message (if enabled)
- **Template:** Lines 316-388 in `email.service.ts`

---

## Troubleshooting

### Error: "Email transporter not configured"

**Cause:** Missing SMTP credentials in `.env`

**Solution:** Add your SMTP credentials to `.env` and restart backend

---

### Error: "Invalid login" or "Authentication failed"

**Cause:** Wrong email or password

**Solution:**
- Gmail: Use App Password, not your regular password
- Enable 2FA on Gmail first
- Double-check credentials

---

### Error: "Connection timeout"

**Cause:** Firewall or network issue

**Solution:**
- Check if port 587 is open
- Try port 465 (set `SMTP_SECURE=true`)
- Check your internet connection

---

### Email sent but not received

**Cause:** Spam folder or wrong email

**Solution:**
- Check spam/junk folder
- Verify recipient email is correct
- Check sender reputation (Gmail might block new senders)

---

### Email sent to Mailtrap but not real users

**Cause:** You're using Mailtrap (test SMTP)

**Solution:** Switch to real SMTP (Gmail, SendGrid, etc.)

---

## Quick Setup (Gmail - 5 Minutes)

```bash
# 1. Enable 2FA on your Gmail account
#    Go to: https://myaccount.google.com/security

# 2. Generate App Password
#    Go to: https://myaccount.google.com/apppasswords
#    App: Mail, Device: Other (ChatApp Backend)
#    Copy the 16-character password

# 3. Update .env file
#    SMTP_USER=your-email@gmail.com
#    SMTP_PASSWORD=xxxx xxxx xxxx xxxx

# 4. Restart backend
cd chat-backend
npm run start:dev

# 5. Test by registering a new user
#    Check your email for verification link!
```

---

## Production Recommendations

### For Production, Use:
1. **SendGrid** - Reliable, good free tier
2. **AWS SES** - Cheap, scalable
3. **Mailgun** - Good for transactional emails
4. **Postmark** - High deliverability

### Don't Use for Production:
- ❌ Gmail personal account (has sending limits)
- ❌ Mailtrap (test service only)

### Sending Limits (Free Tiers):
- Gmail: ~500 emails/day (personal), 2000/day (workspace)
- SendGrid: 100 emails/day
- Mailgun: 100 emails/day
- AWS SES: 62,000 emails/month (free tier)

---

## Current Configuration Status

**Your Current `.env`:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com        # ❌ Need real email
SMTP_PASSWORD=your-app-password       # ❌ Need real password
SMTP_FROM=noreply@yourdomain.com      # Can keep as-is or use real email
SMTP_FROM_NAME=ChatApp                # ✅ OK
```

**Status:** ❌ Not configured (using placeholder values)

**Action Required:** Update `SMTP_USER` and `SMTP_PASSWORD` with real Gmail credentials

---

## What to Update Right Now

1. **Get Gmail App Password** (5 min)
   - https://myaccount.google.com/apppasswords

2. **Update `.env`** (1 min)
   ```env
   SMTP_USER=shibili.mc@gmail.com
   SMTP_PASSWORD=<your-16-char-app-password>
   SMTP_FROM=shibili.mc@gmail.com
   ```

3. **Restart Backend** (10 sec)
   ```bash
   npm run start:dev
   ```

4. **Test** (1 min)
   - Register a new user
   - Check email inbox for verification link

---

## Summary

✅ **Email verification is fully implemented**
✅ **Beautiful HTML email templates included**
✅ **Just need to add SMTP credentials**

**Next Steps:**
1. Generate Gmail App Password
2. Update `.env` file
3. Restart backend
4. Test registration flow

Email verification will work immediately after you configure SMTP!

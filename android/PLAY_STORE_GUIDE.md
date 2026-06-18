# OncoAI — Google Play Store Publishing Guide

## Method 1: PWABuilder (Easiest — No Coding)

### Step 1: Generate the Android App
1. Go to **https://www.pwabuilder.com**
2. Enter your URL: `https://oncoai-6ukk.onrender.com`
3. Click **Start**
4. It will analyze your PWA and show a score
5. Click **Package for stores** → **Android**
6. Fill in:
   - Package ID: `com.oncoai.app`
   - App name: `OncoAI`
   - Version: `1.0.0`
7. Click **Generate**
8. Download the `.aab` (Android App Bundle) file

### Step 2: Create Google Play Developer Account
1. Go to **https://play.google.com/console**
2. Sign up with your Google account (farijigahame@gmail.com)
3. Pay the **one-time $25 registration fee**
4. Complete identity verification (takes 1-2 days)

### Step 3: Create the App Listing
1. In Play Console → **Create app**
2. Fill in:
   - App name: **OncoAI — Oncology & Tumor Board Platform**
   - Default language: **English**
   - App or Game: **App**
   - Free or Paid: **Free**
3. Accept the declarations

### Step 4: Store Listing
Fill in the store listing:

**Short description (80 chars):**
```
AI-powered oncology decision support for tumor board coordination
```

**Full description (4000 chars):**
```
OncoAI is an AI-powered oncology decision support platform designed for head and neck cancer care. Built for specialists at Muhimbili National Hospital and ORCI in Tanzania, it transforms tumor board workflows through intelligent clinical coordination.

KEY FEATURES:

🏥 Patient Management
• Complete patient records with 38 data fields
• NHIF insurance tracking
• 10-step patient journey tracker
• Workup completion monitoring
• Medical passport generator

🧬 Tumor Board Coordination
• Schedule and manage TB meetings
• Video/voice calls via Jitsi Meet
• Structured discussion checklists
• Treatment voting system
• Attendance & CME credit tracking
• Patient dial-in via WhatsApp

🤖 AI Agent Orchestrator
• 9 specialized AI agents
• Smart routing based on patient data
• Guideline compliance checking (NCCN/WHO)
• Risk assessment & survival prediction
• Auto-generated TB briefings

🔬 Clinical Intelligence
• 70+ lab tests with auto-status detection
• Structured pathology reports (22 H&N sites)
• TNM staging with margin status
• Safety alerts & care gap detection
• AI-generated SOAP notes
• Pre-visit summaries & post-visit tasks

💬 Communication
• WhatsApp integration for care teams
• Referral document sharing
• Patient preference surveys
• Family conference support

📱 Patient Portal
• View journey progress
• Check test results
• Complete surveys
• Contact care team

Built with evidence-based clinical workflows from Human-Centered Design research at Muhimbili ORCI Tumor Board.
```

**Category:** Medical
**Tags:** oncology, cancer, tumor board, AI, clinical decision support, head and neck cancer

### Step 5: Upload App Graphics

You need these images:
- **App icon**: 512x512 (already at static/img/icon-512.png)
- **Feature graphic**: 1024x500
- **Screenshots**: At least 2 phone screenshots (1080x1920)
- **Tablet screenshots**: Optional

Take screenshots of your live app on your phone:
1. Landing page
2. Dashboard
3. Patient list
4. Tumor board meeting room
5. AI orchestrator

### Step 6: Upload the App
1. Go to **Production** → **Releases**
2. Click **Create new release**
3. Upload the `.aab` file from PWABuilder
4. Add release notes: "Initial release — OncoAI v1.0.0"
5. Click **Review release**

### Step 7: Content Rating
1. Go to **Policy** → **App content**
2. Complete the content rating questionnaire
3. Select: Medical/Health category
4. Answer: No violence, no ads, etc.

### Step 8: Submit for Review
1. Click **Send for review**
2. Google reviews within 1-7 days
3. Once approved, your app appears on Google Play!

---

## Method 2: Bubblewrap CLI (Developer Method)

```bash
# Install bubblewrap
npm install -g @nicolo-ribaudo/bubblewrap

# Initialize from TWA manifest
cd android
bubblewrap init --manifest=https://oncoai-6ukk.onrender.com/static/manifest.json

# Build the APK/AAB
bubblewrap build

# Output: app-release-bundle.aab (upload to Play Store)
# Output: app-release-signed.apk (sideload on device)
```

---

## Digital Asset Links (Required)

After generating the app, PWABuilder/Bubblewrap will give you a SHA-256 fingerprint.
You must add this file to verify domain ownership:

Create `/.well-known/assetlinks.json` with:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.oncoai.app",
    "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT_HERE"]
  }
}]
```

---

## Timeline

| Step | Time |
|---|---|
| Generate app (PWABuilder) | 5 minutes |
| Create Play Console account | 10 minutes |
| Identity verification | 1-2 days |
| Fill store listing | 30 minutes |
| Upload & submit | 15 minutes |
| Google review | 1-7 days |
| **Total** | **~3-10 days** |

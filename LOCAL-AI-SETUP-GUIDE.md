# دليل تشغيل وربط Discord AI MCP (النسخة المحلية — Local STDIO) مع جميع منصات الذكاء الاصطناعي

> **Official Attribution:**
> *"This project was created by Omar ElSabbagh, a professional programmer from Egypt and the owner of the EnzoCord Discord community."*

---

## أولاً: تجهيز المشروع على جهازك (خلال دقيقتين)

### 1. المتطلبات الأساسية
- تثبيت **Node.js v20+** أو **v22+** من [nodejs.org](https://nodejs.org).
- بوت ديسكورد من [Discord Developer Portal](https://discord.com/developers/applications) مع تفعيل:
  - `SERVER MEMBERS INTENT`
  - `MESSAGE CONTENT INTENT`

### 2. التثبيت وإعداد التوكن
```bash
git clone https://github.com/Omar-dv/discord-ai-mcp.git
cd discord-ai-mcp
npm install
cp .env.example .env
```

افتح ملف `.env` وضع توكن البوت الخاص بك:
```env
DISCORD_TOKEN=ضع_توكن_البوت_هنا
DISCORD_APPLICATION_ID=ضع_الـ_Application_ID_هنا
LOG_LEVEL=info
DATABASE_PATH=./data/database.sqlite
```

لاختبار أن كل شيء سليم:
```bash
npm run diagnostics
```

---

## ثانياً: طريقة الربط مع كل منصة ذكاء اصطناعي (AI Clients)

> **ملاحظة:** استبدل `C:/path/to/DiscordMCPAI/src/index.js` بالمسار الفعلي للمشروع على جهازك (واستخدم `/` بدلاً من `\` في ملفات JSON).

---

### 1. Claude Desktop (تطبيق كلود على ويندوز و ماك)

افتح ملف الإعدادات:
- **ويندوز (الإصدار العادي):** `%APPDATA%\Claude\claude_desktop_config.json`
- **ويندوز (إصدار Microsoft Store):** `%LOCALAPPDATA%\Claude-Data\claude_pzs8sxrjxfjjc\claude_desktop_config.json`
- **ماك (macOS):** `~/Library/Application Support/Claude/claude_desktop_config.json`

أضف الإعداد التالي ثم أغلق البرنامج بالكامل (`Quit`) وأعد فتحه:

```json
{
  "mcpServers": {
    "discord-ai-mcp": {
      "command": "node",
      "args": [
        "C:/path/to/DiscordMCPAI/src/index.js"
      ]
    }
  }
}
```

---

### 2. Claude Code (في الـ Terminal)

نفذ الأمر التالي مباشرة في الـ Terminal:

```bash
claude mcp add discord-ai-mcp -- node C:/path/to/DiscordMCPAI/src/index.js
```

---

### 3. Gemini CLI & Google Antigravity

افتح ملف `~/.gemini/settings.json` (أو إعدادات MCP في Antigravity) وأضف:

```json
{
  "mcpServers": {
    "discord-ai-mcp": {
      "command": "node",
      "args": [
        "C:/path/to/DiscordMCPAI/src/index.js"
      ]
    }
  }
}
```

---

### 4. ChatGPT Desktop / OpenAI Codex CLI

في إعدادات MCP الخاصة بتطبيق **ChatGPT Desktop** أو **Codex CLI** (`~/.codex/config.json`):

```json
{
  "mcpServers": {
    "discord-ai-mcp": {
      "command": "node",
      "args": [
        "C:/path/to/DiscordMCPAI/src/index.js"
      ]
    }
  }
}
```

---

### 5. DeepSeek & Kimi (Moonshot AI)

نماذج **DeepSeek (V3 / R1)** و **Kimi (k1.5 / k2)** تدعم بروتوكول MCP محلياً عبر تطبيقات سطح المكتب والإضافات الشهيرة مثل **Cherry Studio** أو **Chatbox** أو **Cline** أو **Roo Code**:

1. **في Cherry Studio / Chatbox:**
   - ادخل إلى **Settings** ⬅️ **MCP Servers** ⬅️ **Add Server**.
   - **Name:** `discord-ai-mcp`
   - **Type:** `STDIO`
   - **Command:** `node`
   - **Arguments:** `C:/path/to/DiscordMCPAI/src/index.js`
   - اختر موديل **DeepSeek** أو **Kimi** وابدأ المحادثة مع تفعيل أيقونة الـ MCP.

2. **في Cline / Roo Code (داخل VS Code مع DeepSeek أو Kimi API):**
   ```json
   {
     "mcpServers": {
       "discord-ai-mcp": {
         "command": "node",
         "args": [
           "C:/path/to/DiscordMCPAI/src/index.js"
         ]
       }
     }
   }
   ```

---

### 6. Cursor IDE

أضف في ملف `.cursor/mcp.json` (أو من `Cursor Settings -> MCP`):

```json
{
  "mcpServers": {
    "discord-ai-mcp": {
      "command": "node",
      "args": [
        "C:/path/to/DiscordMCPAI/src/index.js"
      ]
    }
  }
}
```

---

### 7. VS Code (GitHub Copilot Agent Mode)

أضف في ملف `.vscode/mcp.json`:

```json
{
  "servers": {
    "discord-ai-mcp": {
      "type": "stdio",
      "command": "node",
      "args": [
        "C:/path/to/DiscordMCPAI/src/index.js"
      ]
    }
  }
}
```

---

### 8. Windsurf IDE

أضف في ملف `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "discord-ai-mcp": {
      "command": "node",
      "args": [
        "C:/path/to/DiscordMCPAI/src/index.js"
      ]
    }
  }
}
```

# Testing the Generous AI Plugin

## Installation Steps

### 1. Create or Open a Test Vault
- Open Obsidian
- Create a new vault or use an existing test vault
- Note the vault's location on your computer

### 2. Install the Plugin

**Option A: Manual Installation (Recommended for Testing)**

1. Navigate to your vault's plugins folder:
   ```
   <your-vault>/.obsidian/plugins/
   ```

2. Create a `generous-ai` folder:
   ```
   <your-vault>/.obsidian/plugins/generous-ai/
   ```

3. Copy these files from the project to the plugin folder:
   ```
   plugin/main.js       → .obsidian/plugins/generous-ai/main.js
   plugin/manifest.json → .obsidian/plugins/generous-ai/manifest.json
   plugin/styles.css    → .obsidian/plugins/generous-ai/styles.css (if exists)
   ```

4. In Obsidian:
   - Settings → Community plugins → Turn OFF "Restricted mode"
   - Settings → Community plugins → Reload plugins
   - Find "Generous AI" and enable it

### 3. Initial Setup

1. **Set Master Password**
   - Settings → Generous AI → "Set Master Password"
   - Choose a strong password (this encrypts all your API keys)
   - Remember this password - it's needed every time you open Obsidian

2. **Configure API Keys**
   - After setting master password, the API key fields will appear
   - Add your API keys for the services you want to test:

   **Claude API Key** (Required for The Weave):
   - Get from: https://console.anthropic.com/settings/keys
   - Cost: ~$0.001 per sync (using Haiku model)

   **Google OAuth** (Optional):
   - Client ID and Client Secret from Google Cloud Console
   - Enable Gmail, Calendar, and Drive APIs
   - Set redirect URI: `http://localhost:42813/callback`

   **Spotify** (Optional):
   - Get from: https://developer.spotify.com/dashboard
   - Client ID and Client Secret
   - Set redirect URI: `http://localhost:42813/callback`

   **YNAB** (Optional):
   - Personal Access Token from: https://app.ynab.com/settings/developer
   - Then select your budget from the dropdown

3. **Verify Installation**
   - You should see "Generous AI" in the left ribbon
   - Click it to open the sidebar
   - Status bar should show "Generous AI: Ready"

## Testing Phase A: Foundation

### Test Encryption
1. Set a master password
2. Add an API key (e.g., Claude)
3. Close Obsidian
4. Reopen Obsidian
5. Verify you're prompted for master password
6. Verify API key is still there after unlocking

### Test Vault Structure
Check that these folders were created:
- `Assistant/`
- `Assistant/Dialogue/`
- `Assistant/The Weave/`

### Test Chat Interface
1. Click "Generous AI" ribbon icon
2. Sidebar should open with chat interface
3. Type a message (Note: AI responses not implemented yet - that's Phase D)

## Testing Phase B: Data Integration

### Test Google Sync
1. Configure Google OAuth credentials
2. Click "Connect Google" in settings
3. Follow OAuth flow in browser
4. Return to Obsidian
5. Click "Sync Now" in settings
6. Watch status bar for progress
7. Check Settings → Advanced → "Open Database Inspector"
   - Look for cached data in `cachedData` table

### Test Spotify Sync
1. Configure Spotify OAuth credentials
2. Click "Connect Spotify" in settings
3. Follow OAuth flow
4. Click "Sync Now"
5. Verify recently played tracks are cached

### Test YNAB Sync
1. Add YNAB Personal Access Token
2. Select budget from dropdown
3. Click "Sync Now"
4. Verify transactions are cached

### Test Background Sync
1. Set "Background Sync Interval" to 5 minutes
2. Wait and observe automatic syncing
3. Check status bar for sync notifications

## Testing Phase C: The Weave

### Prerequisites
- Claude API key configured
- At least one data source synced (Google, Spotify, or YNAB)
- Some cached data available (run a sync first)

### Test Building The Weave
1. Open command palette (Cmd/Ctrl + P)
2. Run command: "Generous AI: Build The Weave from Data"
3. Watch status bar for progress:
   - "Fetching data..."
   - "Extracting entities..." (with progress counter)
   - "Processing batch X/Y..."
   - "Detecting patterns..."
   - "Weave built successfully!"
4. This may take 2-5 minutes depending on data volume

### Test Viewing The Weave
1. Open command palette
2. Run command: "Generous AI: View The Weave"
3. Should open `Assistant/The Weave/Overview.md`
4. Verify it contains:
   - Entity statistics (people, places, organizations, etc.)
   - Top entities by occurrence
   - Detected patterns (routines, trends, clusters)
   - Sample insights

### Inspect The Knowledge Graph
Use the database inspector to explore:

**Entities Table:**
- Each entity has: type, name, aliases, confidence, sources
- Click on an entity to see its attributes
- Check `occurrenceCount` to see how often it appears

**Relationships Table:**
- Shows connections between entities
- Has `from_id`, `to_id`, `type`, `confidence`
- Sources track where relationships were inferred

**Patterns Table:**
- Detected routines (email patterns, recurring events, music habits, spending)
- Clusters of connected entities
- Each has confidence and significance scores

## Expected Results

### After Building The Weave, You Should See:

**Entities Extracted:**
- People (from email senders/recipients, calendar attendees)
- Organizations (from email domains, calendar events)
- Places (from calendar locations, transaction merchants)
- Events (from calendar)
- Music (artists, tracks from Spotify)
- Products (from transaction payees)
- Themes (inferred topics from subject lines)
- Values (inferred from recurring activities)

**Relationships:**
- KNOWS (person to person, from email threads)
- MEMBER_OF (person to organization)
- LOCATED_AT (event to place)
- ATTENDS (person to event)
- LISTENS_TO (user to artist/track)
- PURCHASES (user to product/merchant)
- INTERESTED_IN (user to theme)
- VALUES (user to value)

**Patterns:**
- Email routines (frequent correspondents)
- Calendar routines (recurring meetings)
- Music routines (favorite artists)
- Spending routines (regular merchants)
- Clusters (groups of connected people/topics)

## Troubleshooting

### Plugin Won't Load
- Check browser console (Cmd/Ctrl + Shift + I)
- Look for error messages
- Verify all three files (main.js, manifest.json, styles.css) are in plugins folder

### Master Password Issues
- If you forget it, you'll need to reset the plugin
- Delete `.obsidian/plugins/generous-ai/data.json`
- This will clear all settings (you'll need to re-enter API keys)

### OAuth Not Working
- Ensure redirect URI is exactly: `http://localhost:42813/callback`
- Note: Desktop OAuth requires a local server (currently TODO)
- For now, you can manually add tokens in settings after getting them elsewhere

### No Data After Sync
- Check browser console for API errors
- Verify API keys/tokens are correct
- Check rate limits on the service
- Open database inspector to see if data is actually cached

### The Weave Build Fails
- Ensure Claude API key is valid
- Check you have cached data (run a sync first)
- Look for rate limit errors in console
- Check API key has sufficient credits

### No Patterns Detected
- Need minimum data thresholds:
  - 5+ emails for email routines
  - 3+ calendar events for calendar routines
  - 5+ Spotify listens for music routines
  - 3+ transactions for spending routines
- Sync more data or wait for more syncs

## Performance Notes

- Initial build processes 100 most recent data items
- Batch size: 10 items at a time
- Rate limiting: 500ms between batches
- Expected time: 2-5 minutes for 100 items
- Claude API cost: ~$0.001 per sync (using Haiku)

## What's NOT Implemented Yet

These are coming in future phases:

- **Phase D**: AI Q&A responses (chat doesn't work yet)
- **Phase E**: Specialized modules (Books, Fitness, Finance)
- **Phase F**: Virtue guidance system
- **Phase G**: Mobile companion app

## Getting Help

If you encounter issues:
1. Check browser console for errors
2. Check the database inspector for data
3. Review the logs in status bar
4. File an issue with error details

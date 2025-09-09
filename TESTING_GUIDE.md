# 🧪 Testing Guide: Skip Button & Multi-User Testing

## 🎯 Skip Button Testing Strategy

### 1. **Understanding Skip Logic**
- **Host can always skip immediately** (no votes needed)
- **Guests need to reach vote threshold** to skip
- **Vote threshold** is set in room settings (default: 2 votes)
- **Each user can only vote once per song**

### 2. **Incognito Mode Testing Setup**

#### **Method 1: Multiple Browser Windows**
```bash
# Terminal 1: Start Django server
cd /Users/williambernal/Documents/GitHub/SpotifyRoom/rooms
python3 manage.py runserver

# Terminal 2: Start React dev server  
cd /Users/williambernal/Documents/GitHub/SpotifyRoom/rooms/frontend
npm run dev
```

#### **Method 2: Different Browsers**
- **User 1 (Host):** Regular Chrome/Safari window
- **User 2 (Guest):** Chrome Incognito window
- **User 3 (Guest):** Safari Private window
- **User 4 (Guest):** Firefox Private window

### 3. **Step-by-Step Testing Process**

#### **Setup Phase:**
1. **Host creates room** in regular browser
   - Go to: `http://localhost:8000`
   - Click "Create Room" 
   - Set "Votes to Skip" to 2 or 3
   - Note the room code

2. **Host authenticates Spotify**
   - Click "Authenticate Spotify"
   - Complete OAuth flow
   - Start playing music

#### **Guest Testing Phase:**
3. **Open incognito windows** for each guest
   - **Incognito Window 1:** `http://localhost:8000`
   - **Incognito Window 2:** `http://localhost:8000` 
   - **Incognito Window 3:** `http://localhost:8000`

4. **Each guest joins room**
   - Click "Join Room"
   - Enter the room code
   - You should see the music player

#### **Skip Button Testing:**
5. **Test guest voting**
   - In **Guest Window 1:** Click "Skip Song" button
   - Check vote counter increases: "Votes: 1 / 3"
   - Song should NOT skip yet

6. **Test additional votes**
   - In **Guest Window 2:** Click "Skip Song" button  
   - Check vote counter: "Votes: 2 / 3"
   - Song should NOT skip yet

7. **Test threshold reached**
   - In **Guest Window 3:** Click "Skip Song" button
   - Check vote counter: "Votes: 3 / 3"
   - Song should skip immediately!

8. **Test host override**
   - In **Host Window:** Click "Skip Song" button
   - Song should skip immediately (no voting needed)

### 4. **What to Look For**

#### **✅ Expected Behavior:**
- Skip button is **prominently visible** with green styling
- Vote counter shows: `"Votes to skip: X / Y"`
- Guests need to reach vote threshold
- Host can skip immediately
- Button shows hover effects
- Each user can only vote once per song

#### **🚨 Issues to Check:**
- Skip button not visible
- Vote counter not updating
- Multiple votes from same user
- Host requiring votes
- Button styling not working
- Authentication issues

### 5. **Debugging Tips**

#### **Check Developer Console:**
```javascript
// Open browser dev tools (F12)
// Look for errors in Console tab
// Network tab shows API calls to /spotify/skip/
```

#### **Check Django Server Logs:**
```bash
# In terminal running Django server
# Look for skip-related API calls
# Check for authentication errors
```

#### **Session Issues:**
- Each incognito window = different session
- Clear browser data if sessions get mixed
- Close/reopen incognito windows to reset

### 6. **Advanced Testing Scenarios**

#### **Test Edge Cases:**
- Room host leaves (does host transfer work?)
- No music playing (skip button disabled?)
- Spotify authentication expires
- Network connectivity issues
- Very fast clicking (duplicate votes?)

#### **Test Different Vote Thresholds:**
- Set votes to 1 (immediate skip for guests)
- Set votes to 5 (test with many users)
- Test with only 1 guest vs multiple

#### **Test Mobile Responsiveness:**
- Open incognito on mobile browser
- Check skip button visibility
- Test touch interactions

## 🎵 Example Testing Session

```
👥 Users Setup:
- Host (Chrome): Creates room, sets votes=3, plays music
- Guest A (Incognito): Joins room  
- Guest B (Safari Private): Joins room
- Guest C (Firefox Private): Joins room

🧪 Test Flow:
1. Guest A clicks skip → "Votes: 1/3" 
2. Guest B clicks skip → "Votes: 2/3"
3. Guest C clicks skip → Song skips! "Votes: 3/3"
4. Host clicks skip → Song skips immediately
```

## 🔧 Troubleshooting

### Common Issues:
1. **"Skip button not working"** → Check Django server running
2. **"Votes not counting"** → Check each user in different incognito
3. **"Authentication errors"** → Only host needs Spotify auth
4. **"Room not found"** → Verify room code correctly entered

### Quick Reset:
- Close all incognito windows
- Restart Django server
- Create new room
- Test again

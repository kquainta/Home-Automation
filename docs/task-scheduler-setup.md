# Windows Task Scheduler Setup for HA Media Sync

This guide shows how to set up Windows Task Scheduler to automatically sync house images from the Home Assistant network share to the local folder. **Used for local hosting** so the backend container can serve the latest house image.

## Prerequisites

- The sync script exists at: `scripts\sync-ha-media.ps1`
- You have access to the network share: `\\homeassistant\media`
- PowerShell execution policy allows script execution

## Method 1: Using Task Scheduler GUI (Recommended)

### Step 1: Open Task Scheduler
1. Press `Win + R` to open Run dialog
2. Type `taskschd.msc` and press Enter
3. Or search for "Task Scheduler" in Start menu

### Step 2: Create Basic Task
1. Click **"Create Basic Task"** in the right panel
2. **Name**: `Sync HA House Images`
3. **Description**: `Syncs house*.jpg files from \\homeassistant\media to local-ha-media folder`
4. Click **Next**

### Step 3: Set Trigger
1. Select **"Daily"** (we'll change to hourly in advanced settings)
2. Click **Next**
3. Set start date/time (e.g., today at the next hour)
4. Click **Next**

### Step 4: Set Action
1. Select **"Start a program"**
2. Click **Next**
3. **Program/script**: `powershell.exe`
4. **Add arguments**: 
   ```
   -ExecutionPolicy Bypass -File "D:\Projects\Home Automation\scripts\sync-ha-media.ps1"
   ```
   (Adjust the path to match your project location)
5. **Start in**: `D:\Projects\Home Automation`
6. Click **Next**

### Step 5: Finish and Modify
1. Check **"Open the Properties dialog for this task when I click Finish"**
2. Click **Finish**

### Step 6: Configure for Hourly Execution
1. In the Properties dialog, go to **Triggers** tab
2. Select the trigger and click **Edit**
3. Change **"Daily"** to **"Repeat task every"**
4. Set to **1 hour**
5. Set **"for a duration of"** to **Indefinitely**
6. Click **OK**

### Step 7: Configure Additional Settings
1. Go to **General** tab
2. Check **"Run whether user is logged on or not"**
3. Check **"Run with highest privileges"** (if needed for network access)
4. Go to **Settings** tab
5. Check **"Allow task to be run on demand"**
6. Check **"Run task as soon as possible after a scheduled start is missed"**
7. Click **OK**

## Method 2: Using PowerShell (Quick Setup)

Run this PowerShell command as Administrator:

```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -File `"D:\Projects\Home Automation\scripts\sync-ha-media.ps1`"" `
    -WorkingDirectory "D:\Projects\Home Automation"

$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddHours(1) -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration ([TimeSpan]::MaxValue)

$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType S4U -RunLevel Highest

$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName "Sync HA House Images" `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Settings $settings `
    -Description "Syncs house*.jpg files from \\homeassistant\media to local-ha-media folder"
```

**Note**: Adjust the path `D:\Projects\Home Automation` to match your actual project location.

## Verify the Task

1. Open Task Scheduler
2. Find **"Sync HA House Images"** in the task list
3. Right-click → **Run** to test immediately
4. Check `.\local-ha-media\` folder to verify files were copied
5. Check **History** tab to see execution logs

## Troubleshooting

### Script doesn't run
- Check PowerShell execution policy: `Get-ExecutionPolicy`
- If restricted, run: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
- Or use `-ExecutionPolicy Bypass` in the task arguments (already included)

### Network share not accessible
- Ensure the network share `\\homeassistant\media` is accessible
- Task may need to run as a user with network access
- Check **"Run whether user is logged on or not"** in task properties

### Task runs but files don't update
- Check task **History** for errors
- Verify the script path is correct
- Test running the script manually: `.\scripts\sync-ha-media.ps1`

### Task needs to run more frequently
- Edit trigger → Change repetition interval (e.g., every 30 minutes)

## Manual Test

Before setting up the scheduled task, test the script manually:

```powershell
cd "D:\Projects\Home Automation"
.\scripts\sync-ha-media.ps1
```

This should copy any `house*.jpg` files from `\\homeassistant\media` to `.\local-ha-media\`.

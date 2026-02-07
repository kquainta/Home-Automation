# Create PR from new branch and merge to main

Run these from the **project root** in a terminal (PowerShell or Git Bash). If you see "index.lock" or "Permission denied", close any other Git/IDE windows, then remove the lock and retry:

```powershell
# Remove lock if git says another process is running (run only if needed)
Remove-Item "d:\Projects\Home Automation\.git\index.lock" -Force -ErrorAction SilentlyContinue
```

Then:

```powershell
cd "d:\Projects\Home Automation"

# 1. Create new branch (if not already on it)
git checkout -b ui-fixes-and-deploy

# 2. Stage and commit all changes
git add -A
git commit -m "UI fixes: PostCSS/Tailwind for prod, deploy no-cache, nginx cache-control, build fingerprint, design brief"

# 3. Push branch to origin
git push -u origin ui-fixes-and-deploy

# 4. Create PR and merge (choose one method)
```

**Option A – GitHub CLI (if installed):**

```powershell
gh pr create --base main --head ui-fixes-and-deploy --title "UI fixes: PostCSS, deploy no-cache, build fingerprint" --body "PostCSS config for Tailwind in prod, deploy --no-cache frontend, nginx no-cache for HTML, build timestamp in status bar, design docs."
gh pr merge ui-fixes-and-deploy --merge
```

**Option B – GitHub web:**  
Open the repo on GitHub → you should see “Compare & pull request” for `ui-fixes-and-deploy` → create PR → merge.

**Option C – Merge locally (no PR):**

```powershell
git checkout main
git pull origin main
git merge ui-fixes-and-deploy -m "Merge ui-fixes-and-deploy: PostCSS, deploy no-cache, build fingerprint"
git push origin main
```

After merging, you can delete the branch locally and remotely:

```powershell
git checkout main
git branch -d ui-fixes-and-deploy
git push origin --delete ui-fixes-and-deploy
```

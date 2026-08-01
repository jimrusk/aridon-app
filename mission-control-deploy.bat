@echo off
echo.
echo ================================================
echo  Aridon Mission Control v1 — Deploy Checklist
echo ================================================
echo.

echo STEP 1: Run the schema migration in Supabase
echo -------------------------------------------------
echo  1. Go to: https://supabase.com/dashboard
echo  2. Open your Aridon project
echo  3. Click "SQL Editor" in the left nav
echo  4. Click "New query"
echo  5. Open this file: mission-control-v1-schema.sql
echo  6. Paste the entire contents and click RUN
echo  7. You should see "Success. No rows returned."
echo.
echo  NOTE: This is additive — no existing data is modified.
echo.

pause

echo STEP 2 (optional): Seed sample data
echo -------------------------------------------------
echo  To pre-populate the dashboard with sample records:
echo  1. In Supabase SQL Editor — New query
echo  2. Open this file: mission-control-v1-seed.sql
echo  3. Paste the entire contents and click RUN
echo.

pause

echo STEP 3: Deploy to GitHub + Vercel
echo -------------------------------------------------
echo  Option A — If you have the GitHub CLI configured:
echo.
cd /d "C:\Users\jimru\Downloads\aridon-v0.2\aridon-v0.2"
git status
echo.
echo  Run these commands to commit and push:
echo    git checkout -b mission-control-v1
echo    git add -A
echo    git commit -m "feat: Mission Control v1 — Heather dashboard, briefings, alerts, divisions"
echo    git push origin mission-control-v1
echo.
echo  Then in Vercel: go to your project, click Deployments,
echo  and deploy the mission-control-v1 branch.
echo.
echo  Option B — Manual GitHub upload:
echo  1. Go to: https://github.com/your-repo
echo  2. Upload the changed files via the web interface
echo  3. Vercel will auto-redeploy on push
echo.

pause

echo STEP 4: Verify deployment
echo -------------------------------------------------
echo  1. Open: https://aridon-v02.vercel.app
echo  2. Log in with your credentials
echo  3. You should see "Mission Control" dashboard
echo  4. Click "Generate Briefing" to test Heather's briefing
echo  5. Check the "Briefing" tab for the archive
echo.
echo  If the API routes return errors, check Vercel logs at:
echo  https://vercel.com/dashboard → your project → Logs
echo.

echo ================================================
echo  Files created in this session:
echo ================================================
echo  - mission-control-v1-schema.sql  (run in Supabase FIRST)
echo  - mission-control-v1-seed.sql    (optional sample data)
echo  - mission-control-deploy.bat     (this file)
echo  - app/api/alerts/route.ts        (new)
echo  - app/api/briefings/route.ts     (new)
echo  - app/api/briefings/generate/route.ts  (new)
echo  - app/api/executive-actions/route.ts   (new)
echo  - app/page.tsx                   (updated — Dashboard + Briefing tab)
echo.
echo  NEW TABLES (17):
echo    divisions, organizations, contacts, opportunities, grants,
echo    funding_deadlines, investors, pilot_sites,
echo    manufacturing_milestones, engineering_milestones,
echo    outreach, meetings, documents,
echo    executive_actions, executive_briefings, alerts, users
echo.
echo  ALTERED TABLES (3, additive):
echo    leads, projects, tasks
echo    (new columns: division, assigned_executive, owner,
echo     priority, due_date, updated_at, related_org_id,
echo     related_contact_id, source_document, next_action, tags)
echo.

pause
echo Done. Aridon Mission Control v1 is ready.
echo.

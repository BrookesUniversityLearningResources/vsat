VSAT-DEV — HEROKU CLI DEPLOY NOTES
==================================

App:       vsat-dev
Team:      vsat1   (NOTE: team also owns "vsatool" — Eric's live demo/student site. Leave it alone.)
Git URL:   https://git.heroku.com/vsat-dev.git
Dashboard: https://dashboard.heroku.com/apps/vsat-dev
Settings:  https://dashboard.heroku.com/apps/vsat-dev/settings

Prereqs: Heroku CLI installed, and `heroku login` done.
Tip: always pass `-a vsat-dev` so you never act on the wrong app (vsatool is on the same team).


ONE-TIME SETUP (add the Heroku remote)
--------------------------------------
# Option A: let the CLI add it by app name (creates a remote named "heroku")
heroku git:remote -a vsat-dev

# Option B: add it manually with an explicit name
git remote add heroku https://git.heroku.com/vsat-dev.git

git remote -v                          # verify


DEPLOY
------
# Standard deploy: push your current branch to Heroku's main
git push heroku main

# Deploy a non-main local branch to the deployed (main) slot:
git push heroku <local-branch>:main

# Force-push (use sparingly — e.g. after a rebase/history rewrite)
git push heroku <local-branch>:main --force


WATCH / VERIFY THE DEPLOY
-------------------------
heroku logs --tail -a vsat-dev         # live logs (watch the build + boot)
heroku ps -a vsat-dev                  # dyno status
heroku releases -a vsat-dev            # deploy history
heroku open -a vsat-dev                # open the app in a browser


ROLL BACK IF A DEPLOY GOES BAD
------------------------------
heroku releases -a vsat-dev            # find the last good version, e.g. v123
heroku rollback v123 -a vsat-dev       # or just `heroku rollback` for the previous one


CONFIG VARS (the auth bypass / Magic Link settings live here)
-------------------------------------------------------------
heroku config -a vsat-dev                          # list all
heroku config:get SOME_VAR -a vsat-dev             # read one
heroku config:set SOME_VAR=value -a vsat-dev       # set
heroku config:unset SOME_VAR -a vsat-dev           # remove


DATABASE (content is the disposable part — code lives in git)
-------------------------------------------------------------
heroku pg:info -a vsat-dev                          # DB status/size
heroku pg:backups:capture -a vsat-dev               # take a manual backup
heroku pg:backups -a vsat-dev                       # list backups
heroku pg:backups:download -a vsat-dev              # download latest as latest.dump


ONE-OFF COMMANDS / RESEED
-------------------------
heroku run bash -a vsat-dev                         # interactive one-off dyno
heroku run "npm run db:seed:local" -a vsat-dev      # WARNING: a seed overwrites live content

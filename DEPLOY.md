# Deploying "Atbara Trade" to PythonAnywhere

This document is the deployment runbook for pushing the Django app + marketplace UI to
PythonAnywhere. Target: the **existing** web app at
**https://mohamedalmajzoub.pythonanywhere.com** (free account = one web app).

The UI is now served **by the Django app itself** at the site root `/` (same origin), so
`frontend/app.js` uses an empty `API_BASE_URL` and the API lives at `/api/v1/`.

## What changed in the repo (prep, already done)
- UI moved into the Django project:
  - `E-commerce-API-Project/ecomm_api/templates/index.html` (homepage)
  - `E-commerce-API-Project/ecomm_api/static/frontend/style.css`
  - `E-commerce-API-Project/ecomm_api/static/frontend/app.js`
- `settings.py`: env-driven `DATABASES` (`DB_ENGINE/DB_NAME/DB_USER/DB_PASSWORD/DB_HOST/DB_PORT`),
  `TEMPLATES['DIRS']`, `STATICFILES_DIRS`, CORS origin for the live domain. No DB password in source.
- `ecomm_api/urls.py`: root `''` route renders the marketplace UI.
- `.env` (local, gitignored) carries the DB credentials.

---

## Part A — Before you start (PythonAnywhere website)
1. **Web tab** → note the app's current *Source code* / *Working directory* so you can
   roll back if needed (`mv <that folder> <that folder>.bak`).
2. **MySQL tab** → create database **`ecomm_api_db`** if it isn't there already
   (reuse it if the old deployment already created it). Note the DB username, password and
   host shown on the MySQL tab (host is usually `mohamedalmajzoub.mysql.pythonanywhere-services.com`).

## Part B — Deploy commands (PythonAnywhere **Bash console**)

```bash
cd ~
# 1) Get the code
git clone https://github.com/Mijo258/E-commerce-API-Project.git atbara_trade
cd atbara_trade/E-commerce-API-Project/ecomm_api

# 2) Python environment
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# If mysqlclient fails to install on PythonAnywhere, see Troubleshooting below.

# 3) Environment file (create/edit with the Files tab or a text editor)
#    -> .env in THIS directory (same folder as manage.py):
#       SECRET_KEY=<generate a fresh long random string>
#       DEBUG=False
#       ALLOWED_HOSTS=mohamedalmajzoub.pythonanywhere.com
#       DB_ENGINE=django.db.backends.mysql
#       DB_NAME=ecomm_api_db
#       DB_USER=mohamedalmajzoub
#       DB_PASSWORD=<password from the PA MySQL tab>
#       DB_HOST=mohamedalmajzoub.mysql.pythonanywhere-services.com
#       DB_PORT=3306

# 4) Schema + data
python manage.py migrate
# Backfill profiles for users created BEFORE UserProfile existed (signal only runs on new users):
python manage.py shell -c "from django.contrib.auth.models import User; from products.models import UserProfile; [UserProfile.objects.get_or_create(user=u) for u in User.objects.filter(profile__isnull=True)]"
python manage.py collectstatic --noinput
python manage.py createsuperuser   # optional, if you want a PA admin login
```

## Part C — Point the PythonAnywhere web app at this code
In the **Web tab** (app `mohamedalmajzoub.pythonanywhere.com`):
- **Source code** and **Working directory**:
  `/home/mohamedalmajzoub/atbara_trade/E-commerce-API-Project/ecomm_api`
- **Virtualenv**: `/home/mohamedalmajzoub/atbara_trade/E-commerce-API-Project/ecomm_api/venv`
- **Static files**: URL `/static/` → `/home/mohamedalmajzoub/atbara_trade/E-commerce-API-Project/ecomm_api/staticfiles`
- **WSGI configuration file** — replace its contents with:

```python
import os
import sys

path = '/home/mohamedalmajzoub/atbara_trade/E-commerce-API-Project/ecomm_api'
if path not in sys.path:
    sys.path.append(path)

os.environ['DJANGO_SETTINGS_MODULE'] = 'ecomm_api.settings'
os.environ['PYTHONUNBUFFERED'] = '1'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

- Click **Reload** at the top of the Web tab.

## Part D — Post-deploy verification
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://mohamedalmajzoub.pythonanywhere.com/
curl -s -o /dev/null -w "%{http_code}\n" https://mohamedalmajzoub.pythonanywhere.com/static/frontend/style.css
curl -s https://mohamedalmajzoub.pythonanywhere.com/api/v1/products/
```
Then in a browser:
1. Homepage shows the sky-blue "Atbara Trade" marketplace (no console errors).
2. Register a new account → auto-login → the dashboard boards load.
3. Post a sale listing and a "looking to buy" request; both appear.
4. `Log out` → `Log in` works.
5. `/admin/` loads; a Product row shows `status`, and PurchaseRequest/UserProfile tables exist.

## Troubleshooting
- **`pip install mysqlclient` fails**: PythonAnywhere may not be able to build it. Fallback —
  the requirements already include `mysql-connector-python`. Set in `.env`:
  `DB_ENGINE=mysql.connector.django`, then re-run `pip install mysql-connector-python`
  (already pinned) and reload. (You can leave `mysqlclient` in requirements.txt; pip skips it
  if it fails to build only when it is installed — if it errors hard, install requirements
  with `pip install -r requirements.txt` minus that line.)
- **500 on `/api/auth/profile/` for an old account**: run the backfill in Part B step 4.
- **`.env` not found**: it must sit in the same directory as `manage.py`
  (`.../atbara_trade/E-commerce-API-Project/ecomm_api/.env`) and the Web tab *Working
  directory* must be that folder.
- **`DisallowedHost`**: add the domain to `ALLOWED_HOSTS` in `.env` and reload.
- **Static files 404**: re-run `collectstatic` after pulling and confirm the `/static/`
  mapping points at `.../ecomm_api/staticfiles`.

## Rollback
The old code still lives in the `.bak` folder from Part A step 1. To revert: move the new
folder aside, restore `.bak` to the original name, and repoint Source code/Working
directory/WSGI accordingly, then Reload.

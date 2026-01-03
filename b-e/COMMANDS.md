This file is meant to be a reference to useful .venv/python commands; Copy and Paste is king sometimes.

* Create new venv
python -m venv venv

* Start venv session.
./.venv/Scripts/Activate.ps1 

* Start Django Server
python manage.py runserver

* Run Unit Test (entire file - Python)
python manage.py test authentication --keepdb

* Run Unit Test (specific test)
python manage.py test authentication.tests.MagicLinkAuthTests.test_email_change_unauthorized --keepdb

* Git Scripts:
clear; git status
clear; git commit -am "";git push; git status
clear; git log --oneline

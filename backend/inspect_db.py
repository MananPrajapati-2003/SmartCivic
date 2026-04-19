import sys, os
sys.path.insert(0, 'd:/smart_civic_project/SmartCivic/backend')
os.chdir('d:/smart_civic_project/SmartCivic/backend')
os.environ['DJANGO_SETTINGS_MODULE'] = 'smartcivic.settings'

import django
django.setup()

from accounts.models import User
from django.db.models import Count
from issues.models import CivicIssue, IssueCategory

print("=== ROLE COUNTS ===")
for r in User.objects.values('role').annotate(c=Count('id')):
    print(f"  {r['role']}: {r['c']}")

print("\n=== USER MODEL FIELDS ===")
for f in User._meta.get_fields():
    print(f"  {f.name}: {type(f).__name__}")

print("\n=== ISSUE CATEGORIES ===")
for c in IssueCategory.objects.all():
    print(f"  {c.id} | {c.name}")

print("\n=== ISSUE STATUS COUNTS ===")
for s in CivicIssue.objects.values('status').annotate(c=Count('id')):
    print(f"  {s['status']}: {s['c']}")

print("\n=== AUTHORITY USERS ===")
for u in User.objects.filter(role='authority'):
    print(f"  id={u.id} | {u.full_name} | {u.email}")

print("\n=== INSTALLED APPS ===")
from django.conf import settings
print(settings.INSTALLED_APPS)

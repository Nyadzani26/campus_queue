"""Management command to set up SPU SmartQueue departments."""

from django.core.management.base import BaseCommand
from queues.models import Department
from datetime import time


DEPARTMENTS = [
    {
        'name': 'ICT Helpdesk',
        'code': 'ICT',
        'description': 'Technical support and IT assistance for students and staff.',
        'location': 'Building A, Room 101',
        'opens_at': time(8, 0),
        'closes_at': time(16, 30),
        'avg_service_minutes': 5,
    },
    {
        'name': 'Finance Department',
        'code': 'FIN',
        'description': 'Student fees, bursaries and financial aid enquiries.',
        'location': 'Building B, Room 205',
        'opens_at': time(8, 30),
        'closes_at': time(16, 0),
        'avg_service_minutes': 8,
    },
    {
        'name': 'Printing & Copy Centre',
        'code': 'PRT',
        'description': 'Document printing, photocopying and binding services.',
        'location': 'Building A, Room G01',
        'opens_at': time(8, 0),
        'closes_at': time(17, 0),
        'avg_service_minutes': 3,
    },
    {
        'name': 'Student Records',
        'code': 'REC',
        'description': 'Transcripts, certificates and official academic records.',
        'location': 'Building C, Room 301',
        'opens_at': time(9, 0),
        'closes_at': time(15, 0),
        'avg_service_minutes': 4,
    },
    {
        'name': 'Accommodation Services',
        'code': 'ACC',
        'description': 'Student housing, residence applications and enquiries.',
        'location': 'Building D, Room 102',
        'opens_at': time(8, 0),
        'closes_at': time(16, 0),
        'avg_service_minutes': 6,
    },
]


class Command(BaseCommand):
    help = 'Set up SPU departments. Does not create any user accounts.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.HTTP_INFO('\nSetting up SPU SmartQueue departments...\n'))

        created_count = 0
        for dept_data in DEPARTMENTS:
            dept, created = Department.objects.get_or_create(
                code=dept_data['code'],
                defaults=dept_data,
            )
            if created:
                created_count += 1
                self.stdout.write(f'  + Created: {dept.name} ({dept.code})')
            else:
                self.stdout.write(f'  - Already exists: {dept.name} ({dept.code})')

        self.stdout.write('')
        if created_count:
            self.stdout.write(self.style.SUCCESS(f'Done. {created_count} department(s) created.'))
        else:
            self.stdout.write(self.style.WARNING('No new departments created (all already exist).'))

        self.stdout.write(self.style.HTTP_INFO(
            '\nNext steps:\n'
            '  • Create your admin account:  python manage.py createsuperuser\n'
            '  • Start the server:           python manage.py runserver\n'
            '  • Register staff accounts via the Django admin at /admin/\n'
            '  • Students register themselves via the web interface\n'
        ))

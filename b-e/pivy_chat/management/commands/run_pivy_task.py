"""
Management command for manually triggering Pivy Chat tasks during development.

Usage:
    # Run morning brief for today
    python manage.py run_pivy_task morning_brief

    # Run intraday alert monitor
    python manage.py run_pivy_task intraday_alerts

    # Generate AI reply for a specific message (by ChatMessage PK)
    python manage.py run_pivy_task ai_reply --message-id 5
"""
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Manually trigger a Pivy Chat Celery task for local development/testing.'

    def add_arguments(self, parser):
        parser.add_argument(
            'task',
            choices=['morning_brief', 'intraday_alerts', 'ai_reply'],
            help='Which task to run.',
        )
        parser.add_argument(
            '--message-id',
            type=int,
            default=None,
            help='ChatMessage PK of the user message to reply to (required for ai_reply).',
        )

    def handle(self, *args, **options):
        task_name = options['task']

        if task_name == 'morning_brief':
            self._run_morning_brief()

        elif task_name == 'intraday_alerts':
            self._run_intraday_alerts()

        elif task_name == 'ai_reply':
            message_id = options.get('message_id')
            if not message_id:
                raise CommandError('--message-id is required for ai_reply.')
            self._run_ai_reply(message_id)

    # ---------------------------------------------------------------- #

    def _run_morning_brief(self):
        self.stdout.write('Running morning brief task...')
        from pivy_chat.tasks import generate_morning_brief_task
        # Call directly (no Celery worker needed)
        generate_morning_brief_task()
        self.stdout.write(self.style.SUCCESS('Morning brief task completed. Check admin or DB for the new ChatMessage.'))

    def _run_intraday_alerts(self):
        self.stdout.write('Running intraday alert monitor...')
        from pivy_chat.tasks import monitor_intraday_alerts_task
        monitor_intraday_alerts_task()
        self.stdout.write(self.style.SUCCESS('Intraday alert task completed. Check admin or DB for any new alerts.'))

    def _run_ai_reply(self, message_id: int):
        from pivy_chat.models import ChatMessage
        try:
            msg = ChatMessage.objects.select_related('chat_day', 'user').get(pk=message_id)
        except ChatMessage.DoesNotExist:
            raise CommandError(f'ChatMessage with pk={message_id} does not exist.')

        if msg.sender != 'user':
            raise CommandError(f'Message {message_id} is not a user message (sender={msg.sender}).')
        if msg.user is None:
            raise CommandError(f'Message {message_id} has no associated user.')

        self.stdout.write(
            f'Generating AI reply for message {message_id} '
            f'(user={msg.user}, day={msg.chat_day.date})...'
        )
        from pivy_chat.tasks import generate_ai_reply_task
        generate_ai_reply_task(
            chat_day_id=msg.chat_day.pk,
            user_id=msg.user.pk,
            user_message_id=msg.pk,
        )
        self.stdout.write(self.style.SUCCESS('AI reply task completed. Check admin or DB for the new ChatMessage.'))

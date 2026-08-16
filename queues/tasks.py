"""
Async task queue is not active in local development mode.
Tasks are no-ops that log a message when called.
To enable: install celery + redis and restore the task implementations.
"""

import logging

logger = logging.getLogger(__name__)


def _task_disabled(name):
    logger.info(f'Task "{name}" is disabled in local development mode.')


def generate_hourly_analytics():
    _task_disabled('generate_hourly_analytics')


def generate_daily_summary():
    _task_disabled('generate_daily_summary')


def optimize_queue_predictions():
    _task_disabled('optimize_queue_predictions')


def send_pending_notifications():
    _task_disabled('send_pending_notifications')


def cleanup_expired_sessions():
    _task_disabled('cleanup_expired_sessions')


def broadcast_queue_update(queue_id):
    _task_disabled('broadcast_queue_update')


def broadcast_ticket_update(ticket_id):
    _task_disabled('broadcast_ticket_update')


def optimize_queue_routing():
    _task_disabled('optimize_queue_routing')

import json
from collections import defaultdict

from dataclasses import dataclass

import datetime



INFO_TYPE = "info"
SUCCESS_TYPE = "success"
ERROR_TYPE = "error"
WARNONG_TYPE = "warning"

@dataclass
class Notification:
    text: str
    type: str = INFO_TYPE
    title: str = None
    time: str = None
    action_text: str = None
    action: str = None


class Notifications:
    notifications = defaultdict(list)

    def _key(self, workspace_id: str, category: str):
        return workspace_id + '_' + category

    def push(self, workspace_id, category: str, notification: Notification):
        if not notification in self.notifications[self._key(workspace_id, category)]:
            notification.time = datetime.datetime.now().strftime("%x %X")
            self.notifications[self._key(workspace_id, category)].append(notification)

    def remove(self, workspace_id, category: str, notification: Notification):
        #TODO: it might be danger to remove items from list by reference, in the future we need to make sure it is working well even for tailor made notifications
        if notification in self.notifications[self._key(workspace_id, category)]:
            self.notifications[self._key(workspace_id, category)].remove(notification)

    def get_notifications(self, workspace_id: str, category: str):
        return self.notifications[self._key(workspace_id, category)]

    def reset(self, workspace_id):
        for k in self.notifications.keys():
            if k.startswith(workspace_id):
                self.notifications[k] = []


ALMOST_READY: Notification = Notification(text='A new model is almost ready!', type= INFO_TYPE)
MODEL_READY: Notification = Notification(text='New model is ready!', type=SUCCESS_TYPE)

from django.db import models
from django.contrib.auth.models import User

class DownloadHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    type = models.CharField(max_length=100)
    fromDate = models.DateTimeField()
    toDate = models.DateTimeField()
    downloadedAt = models.DateTimeField(auto_now_add=True)

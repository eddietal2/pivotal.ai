from django.contrib import admin
from .models import ChatDay, ChatMessage


class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0
    readonly_fields = ('sender', 'message_type', 'user', 'trigger', 'created_at')
    fields = ('sender', 'message_type', 'content', 'user', 'trigger', 'created_at')


@admin.register(ChatDay)
class ChatDayAdmin(admin.ModelAdmin):
    list_display = ('date', 'message_count', 'created_at')
    ordering = ('-date',)
    inlines = [ChatMessageInline]

    def message_count(self, obj):
        return obj.messages.count()
    message_count.short_description = 'Messages'


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('chat_day', 'sender', 'message_type', 'user', 'created_at')
    list_filter = ('sender', 'message_type', 'chat_day__date')
    search_fields = ('content', 'user__username')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/theme.dart';
import '../providers/notification_provider.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(notificationProvider);
    final notifications = state.notifications;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (notifications.isNotEmpty)
            TextButton(
              onPressed: () => ref.read(notificationProvider.notifier).clearAll(),
              child: const Text('Clear All', style: TextStyle(color: Colors.white)),
            ),
        ],
      ),
      body: notifications.isEmpty
          ? const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.notifications_none, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('No notifications', style: TextStyle(color: Colors.grey, fontSize: 16)),
                ],
              ),
            )
          : ListView.builder(
              itemCount: notifications.length,
              padding: const EdgeInsets.all(12),
              itemBuilder: (_, i) {
                final n = notifications[i];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  color: n.isRead ? null : OncoAITheme.primary.withValues(alpha: 0.05),
                  child: ListTile(
                    leading: _icon(n.type ?? 'info'),
                    title: Text(n.title.isEmpty ? 'Notification' : n.title, style: TextStyle(fontWeight: n.isRead ? FontWeight.normal : FontWeight.w600)),
                    subtitle: Text(n.body, maxLines: 2, overflow: TextOverflow.ellipsis),
                    trailing: Text(_formatTime(n.createdAt), style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                    onTap: () => ref.read(notificationProvider.notifier).markRead(n.id),
                  ),
                );
              },
            ),
    );
  }

  String _formatTime(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  Widget _icon(String type) {
    final icons = {'lab_result': Icons.science, 'tumor_board': Icons.groups, 'patient': Icons.person, 'workup': Icons.checklist};
    final colors = {'lab_result': OncoAITheme.success, 'tumor_board': OncoAITheme.info, 'patient': OncoAITheme.primary, 'workup': OncoAITheme.warning};
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(color: (colors[type] ?? Colors.grey).withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8)),
      child: Icon(icons[type] ?? Icons.info, color: colors[type] ?? Colors.grey, size: 20),
    );
  }
}

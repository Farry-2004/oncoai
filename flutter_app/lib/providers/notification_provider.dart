import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import '../config/api_config.dart';
import 'auth_provider.dart';

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

class AppNotification {
  final String id;
  final String title;
  final String body;
  final String? type;
  final Map<String, dynamic>? data;
  final DateTime createdAt;
  final bool isRead;

  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    this.type,
    this.data,
    required this.createdAt,
    this.isRead = false,
  });

  AppNotification copyWith({bool? isRead}) {
    return AppNotification(
      id: id,
      title: title,
      body: body,
      type: type,
      data: data,
      createdAt: createdAt,
      isRead: isRead ?? this.isRead,
    );
  }

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: (json['id'] ?? DateTime.now().millisecondsSinceEpoch).toString(),
      title: json['title'] as String? ?? '',
      body: json['body'] as String? ?? json['message'] as String? ?? '',
      type: json['type'] as String?,
      data: json['data'] as Map<String, dynamic>?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
      isRead: json['is_read'] as bool? ?? false,
    );
  }
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

class NotificationState {
  final List<AppNotification> notifications;
  final int unreadCount;
  final bool isConnected;

  const NotificationState({
    this.notifications = const [],
    this.unreadCount = 0,
    this.isConnected = false,
  });

  NotificationState copyWith({
    List<AppNotification>? notifications,
    int? unreadCount,
    bool? isConnected,
  }) {
    return NotificationState(
      notifications: notifications ?? this.notifications,
      unreadCount: unreadCount ?? this.unreadCount,
      isConnected: isConnected ?? this.isConnected,
    );
  }
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

class NotificationNotifier extends StateNotifier<NotificationState> {
  NotificationNotifier(this._ref) : super(const NotificationState());

  final Ref _ref;
  WebSocketChannel? _channel;
  StreamSubscription<dynamic>? _subscription;

  // ---- WebSocket lifecycle ----

  /// Connect to the notification WebSocket.
  void connect() {
    final token = _ref.read(authProvider).token;
    if (token == null) return;

    // Derive WS URL from the HTTP base URL.
    final wsBase =
        ApiConfig.baseUrl.replaceFirst('https://', 'wss://').replaceFirst('http://', 'ws://');
    final uri = Uri.parse('$wsBase/ws/notifications?token=$token');

    try {
      _channel = WebSocketChannel.connect(uri);
      state = state.copyWith(isConnected: true);

      _subscription = _channel!.stream.listen(
        _onMessage,
        onError: (_) => _onDisconnected(),
        onDone: _onDisconnected,
        cancelOnError: false,
      );
    } catch (_) {
      state = state.copyWith(isConnected: false);
    }
  }

  /// Disconnect and clean up resources.
  void disconnect() {
    _subscription?.cancel();
    _channel?.sink.close();
    _channel = null;
    _subscription = null;
    state = state.copyWith(isConnected: false);
  }

  void _onMessage(dynamic raw) {
    try {
      final json = jsonDecode(raw as String) as Map<String, dynamic>;
      final notification = AppNotification.fromJson(json);
      state = state.copyWith(
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      );
    } catch (_) {
      // Silently ignore malformed messages.
    }
  }

  void _onDisconnected() {
    state = state.copyWith(isConnected: false);
    _subscription = null;
    _channel = null;
  }

  // ---- public API ----

  /// Manually add a local notification (e.g. from push or in-app events).
  void addNotification(AppNotification notification) {
    state = state.copyWith(
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
    );
  }

  /// Mark a single notification as read by its [id].
  void markRead(String id) {
    final updated = state.notifications.map((n) {
      if (n.id == id && !n.isRead) return n.copyWith(isRead: true);
      return n;
    }).toList();

    final wasUnread =
        state.notifications.any((n) => n.id == id && !n.isRead);

    state = state.copyWith(
      notifications: updated,
      unreadCount: wasUnread
          ? (state.unreadCount - 1).clamp(0, state.notifications.length)
          : state.unreadCount,
    );
  }

  /// Mark all notifications as read.
  void markAllRead() {
    state = state.copyWith(
      notifications:
          state.notifications.map((n) => n.copyWith(isRead: true)).toList(),
      unreadCount: 0,
    );
  }

  /// Remove all notifications.
  void clearAll() {
    state = const NotificationState();
  }

  @override
  void dispose() {
    disconnect();
    super.dispose();
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

final notificationProvider =
    StateNotifierProvider<NotificationNotifier, NotificationState>(
  (ref) => NotificationNotifier(ref),
);

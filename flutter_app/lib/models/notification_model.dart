class NotificationModel {
  final int? id;
  final String title;
  final String message;
  final String? type;
  final String? severity;
  final bool? isRead;
  final DateTime? createdAt;

  NotificationModel({
    this.id,
    required this.title,
    required this.message,
    this.type,
    this.severity,
    this.isRead,
    this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] as int?,
      title: json['title'] as String,
      message: json['message'] as String,
      type: json['type'] as String?,
      severity: json['severity'] as String?,
      isRead: json['is_read'] as bool?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'message': message,
      'type': type,
      'severity': severity,
      'is_read': isRead,
      'created_at': createdAt?.toIso8601String(),
    };
  }

  NotificationModel copyWith({
    int? id,
    String? title,
    String? message,
    String? type,
    String? severity,
    bool? isRead,
    DateTime? createdAt,
  }) {
    return NotificationModel(
      id: id ?? this.id,
      title: title ?? this.title,
      message: message ?? this.message,
      type: type ?? this.type,
      severity: severity ?? this.severity,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  String toString() {
    return 'NotificationModel(id: $id, title: $title, type: $type, isRead: $isRead)';
  }
}

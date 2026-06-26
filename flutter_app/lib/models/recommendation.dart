class Recommendation {
  final int? id;
  final int patientId;
  final String? priority;
  final String? category;
  final String? recommendationText;
  final String? title;
  final String? description;
  final String? status;
  final DateTime? createdAt;

  Recommendation({
    this.id,
    required this.patientId,
    this.priority,
    this.category,
    this.recommendationText,
    this.title,
    this.description,
    this.status,
    this.createdAt,
  });

  factory Recommendation.fromJson(Map<String, dynamic> json) {
    return Recommendation(
      id: json['id'] as int?,
      patientId: json['patient_id'] as int,
      priority: json['priority'] as String?,
      category: json['category'] as String?,
      recommendationText: json['recommendation_text'] as String?,
      title: json['title'] as String?,
      description: json['description'] as String?,
      status: json['status'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'patient_id': patientId,
      'priority': priority,
      'category': category,
      'recommendation_text': recommendationText,
      'title': title,
      'description': description,
      'status': status,
      'created_at': createdAt?.toIso8601String(),
    };
  }

  Recommendation copyWith({
    int? id,
    int? patientId,
    String? priority,
    String? category,
    String? recommendationText,
    String? title,
    String? description,
    String? status,
    DateTime? createdAt,
  }) {
    return Recommendation(
      id: id ?? this.id,
      patientId: patientId ?? this.patientId,
      priority: priority ?? this.priority,
      category: category ?? this.category,
      recommendationText: recommendationText ?? this.recommendationText,
      title: title ?? this.title,
      description: description ?? this.description,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  String toString() {
    return 'Recommendation(id: $id, patientId: $patientId, title: $title, status: $status)';
  }
}

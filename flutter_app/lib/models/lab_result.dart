class LabResult {
  final int? id;
  final int patientId;
  final String testName;
  final String? testValue;
  final String? referenceRange;
  final String? status;
  final String? notes;
  final DateTime? createdAt;

  LabResult({
    this.id,
    required this.patientId,
    required this.testName,
    this.testValue,
    this.referenceRange,
    this.status,
    this.notes,
    this.createdAt,
  });

  factory LabResult.fromJson(Map<String, dynamic> json) {
    return LabResult(
      id: json['id'] as int?,
      patientId: json['patient_id'] as int,
      testName: json['test_name'] as String,
      testValue: json['test_value'] as String?,
      referenceRange: json['reference_range'] as String?,
      status: json['status'] as String?,
      notes: json['notes'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'patient_id': patientId,
      'test_name': testName,
      'test_value': testValue,
      'reference_range': referenceRange,
      'status': status,
      'notes': notes,
      'created_at': createdAt?.toIso8601String(),
    };
  }

  LabResult copyWith({
    int? id,
    int? patientId,
    String? testName,
    String? testValue,
    String? referenceRange,
    String? status,
    String? notes,
    DateTime? createdAt,
  }) {
    return LabResult(
      id: id ?? this.id,
      patientId: patientId ?? this.patientId,
      testName: testName ?? this.testName,
      testValue: testValue ?? this.testValue,
      referenceRange: referenceRange ?? this.referenceRange,
      status: status ?? this.status,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  String toString() {
    return 'LabResult(id: $id, patientId: $patientId, testName: $testName, status: $status)';
  }
}

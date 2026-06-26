class PathologyReport {
  final int? id;
  final int patientId;
  final String? specimenType;
  final String? findings;
  final String? diagnosis;
  final String? pathologist;
  final String? status;
  final String? notes;
  final DateTime? createdAt;

  PathologyReport({
    this.id,
    required this.patientId,
    this.specimenType,
    this.findings,
    this.diagnosis,
    this.pathologist,
    this.status,
    this.notes,
    this.createdAt,
  });

  factory PathologyReport.fromJson(Map<String, dynamic> json) {
    return PathologyReport(
      id: json['id'] as int?,
      patientId: json['patient_id'] as int,
      specimenType: json['specimen_type'] as String?,
      findings: json['findings'] as String?,
      diagnosis: json['diagnosis'] as String?,
      pathologist: json['pathologist'] as String?,
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
      'specimen_type': specimenType,
      'findings': findings,
      'diagnosis': diagnosis,
      'pathologist': pathologist,
      'status': status,
      'notes': notes,
      'created_at': createdAt?.toIso8601String(),
    };
  }

  PathologyReport copyWith({
    int? id,
    int? patientId,
    String? specimenType,
    String? findings,
    String? diagnosis,
    String? pathologist,
    String? status,
    String? notes,
    DateTime? createdAt,
  }) {
    return PathologyReport(
      id: id ?? this.id,
      patientId: patientId ?? this.patientId,
      specimenType: specimenType ?? this.specimenType,
      findings: findings ?? this.findings,
      diagnosis: diagnosis ?? this.diagnosis,
      pathologist: pathologist ?? this.pathologist,
      status: status ?? this.status,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  String toString() {
    return 'PathologyReport(id: $id, patientId: $patientId, diagnosis: $diagnosis, status: $status)';
  }
}

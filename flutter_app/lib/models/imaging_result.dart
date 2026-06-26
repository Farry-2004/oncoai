class ImagingResult {
  final int? id;
  final int patientId;
  final String? studyType;
  final String? modality;
  final String? bodyPart;
  final String? findings;
  final String? impression;
  final String? radiologist;
  final String? status;
  final String? notes;
  final DateTime? createdAt;

  ImagingResult({
    this.id,
    required this.patientId,
    this.studyType,
    this.modality,
    this.bodyPart,
    this.findings,
    this.impression,
    this.radiologist,
    this.status,
    this.notes,
    this.createdAt,
  });

  factory ImagingResult.fromJson(Map<String, dynamic> json) {
    return ImagingResult(
      id: json['id'] as int?,
      patientId: json['patient_id'] as int,
      studyType: json['study_type'] as String?,
      modality: json['modality'] as String?,
      bodyPart: json['body_part'] as String?,
      findings: json['findings'] as String?,
      impression: json['impression'] as String?,
      radiologist: json['radiologist'] as String?,
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
      'study_type': studyType,
      'modality': modality,
      'body_part': bodyPart,
      'findings': findings,
      'impression': impression,
      'radiologist': radiologist,
      'status': status,
      'notes': notes,
      'created_at': createdAt?.toIso8601String(),
    };
  }

  ImagingResult copyWith({
    int? id,
    int? patientId,
    String? studyType,
    String? modality,
    String? bodyPart,
    String? findings,
    String? impression,
    String? radiologist,
    String? status,
    String? notes,
    DateTime? createdAt,
  }) {
    return ImagingResult(
      id: id ?? this.id,
      patientId: patientId ?? this.patientId,
      studyType: studyType ?? this.studyType,
      modality: modality ?? this.modality,
      bodyPart: bodyPart ?? this.bodyPart,
      findings: findings ?? this.findings,
      impression: impression ?? this.impression,
      radiologist: radiologist ?? this.radiologist,
      status: status ?? this.status,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  String toString() {
    return 'ImagingResult(id: $id, patientId: $patientId, studyType: $studyType, status: $status)';
  }
}

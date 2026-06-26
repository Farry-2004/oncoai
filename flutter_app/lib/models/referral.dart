class Referral {
  final int? id;
  final int patientId;
  final String doctorName;
  final String? doctorPhone;
  final String? specialty;
  final String? hospital;
  final String? status;
  final String? reason;
  final String? notes;
  final DateTime? createdAt;

  Referral({
    this.id,
    required this.patientId,
    required this.doctorName,
    this.doctorPhone,
    this.specialty,
    this.hospital,
    this.status,
    this.reason,
    this.notes,
    this.createdAt,
  });

  factory Referral.fromJson(Map<String, dynamic> json) {
    return Referral(
      id: json['id'] as int?,
      patientId: json['patient_id'] as int,
      doctorName: json['doctor_name'] as String,
      doctorPhone: json['doctor_phone'] as String?,
      specialty: json['specialty'] as String?,
      hospital: json['hospital'] as String?,
      status: json['status'] as String?,
      reason: json['reason'] as String?,
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
      'doctor_name': doctorName,
      'doctor_phone': doctorPhone,
      'specialty': specialty,
      'hospital': hospital,
      'status': status,
      'reason': reason,
      'notes': notes,
      'created_at': createdAt?.toIso8601String(),
    };
  }

  Referral copyWith({
    int? id,
    int? patientId,
    String? doctorName,
    String? doctorPhone,
    String? specialty,
    String? hospital,
    String? status,
    String? reason,
    String? notes,
    DateTime? createdAt,
  }) {
    return Referral(
      id: id ?? this.id,
      patientId: patientId ?? this.patientId,
      doctorName: doctorName ?? this.doctorName,
      doctorPhone: doctorPhone ?? this.doctorPhone,
      specialty: specialty ?? this.specialty,
      hospital: hospital ?? this.hospital,
      status: status ?? this.status,
      reason: reason ?? this.reason,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  String toString() {
    return 'Referral(id: $id, patientId: $patientId, doctorName: $doctorName, status: $status)';
  }
}

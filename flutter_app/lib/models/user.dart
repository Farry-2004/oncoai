class User {
  final int? id;
  final String email;
  final String fullName;
  final String? specialty;
  final String? role;
  final String? phone;
  final String? institution;
  final bool? isActive;
  final DateTime? createdAt;

  User({
    this.id,
    required this.email,
    required this.fullName,
    this.specialty,
    this.role,
    this.phone,
    this.institution,
    this.isActive,
    this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int?,
      email: json['email'] as String,
      fullName: json['full_name'] as String,
      specialty: json['specialty'] as String?,
      role: json['role'] as String?,
      phone: json['phone'] as String?,
      institution: json['institution'] as String?,
      isActive: json['is_active'] as bool?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'full_name': fullName,
      'specialty': specialty,
      'role': role,
      'phone': phone,
      'institution': institution,
      'is_active': isActive,
      'created_at': createdAt?.toIso8601String(),
    };
  }

  User copyWith({
    int? id,
    String? email,
    String? fullName,
    String? specialty,
    String? role,
    String? phone,
    String? institution,
    bool? isActive,
    DateTime? createdAt,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      fullName: fullName ?? this.fullName,
      specialty: specialty ?? this.specialty,
      role: role ?? this.role,
      phone: phone ?? this.phone,
      institution: institution ?? this.institution,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  String toString() {
    return 'User(id: $id, email: $email, fullName: $fullName, role: $role)';
  }
}

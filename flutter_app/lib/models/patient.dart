class Patient {
  final int? id;
  final String patientCode;
  final String name;
  final String? gender;
  final int? age;
  final String? phone;
  final String? email;
  final String? address;
  final String? medicalCondition;
  final String? notes;
  final String? cancerType;
  final String? cancerStage;
  final DateTime? diagnosisDate;
  final String? dateOfBirth;
  final String? placeOfBirth;
  final String? tribeEthnicity;
  final String? maritalStatus;
  final String? occupation;
  final String? educationLevel;
  final String? religion;
  final String? nationality;
  final String? nextOfKinName;
  final String? nextOfKinPhone;
  final String? nextOfKinRelationship;
  final bool? nhifRegistered;
  final String? nhifNumber;
  final String? insuranceProvider;
  final String? insuranceNumber;
  final String? bloodGroup;
  final String? allergies;
  final String? chronicConditions;
  final String? currentMedications;
  final String? familyCancerHistory;
  final String? smokingStatus;
  final String? alcoholUse;
  final int? heightCm;
  final double? weightKg;
  final String? journeyStatus;
  final DateTime? createdAt;

  Patient({
    this.id,
    required this.patientCode,
    required this.name,
    this.gender,
    this.age,
    this.phone,
    this.email,
    this.address,
    this.medicalCondition,
    this.notes,
    this.cancerType,
    this.cancerStage,
    this.diagnosisDate,
    this.dateOfBirth,
    this.placeOfBirth,
    this.tribeEthnicity,
    this.maritalStatus,
    this.occupation,
    this.educationLevel,
    this.religion,
    this.nationality,
    this.nextOfKinName,
    this.nextOfKinPhone,
    this.nextOfKinRelationship,
    this.nhifRegistered,
    this.nhifNumber,
    this.insuranceProvider,
    this.insuranceNumber,
    this.bloodGroup,
    this.allergies,
    this.chronicConditions,
    this.currentMedications,
    this.familyCancerHistory,
    this.smokingStatus,
    this.alcoholUse,
    this.heightCm,
    this.weightKg,
    this.journeyStatus,
    this.createdAt,
  });

  factory Patient.fromJson(Map<String, dynamic> json) {
    return Patient(
      id: json['id'] as int?,
      patientCode: json['patient_code'] as String,
      name: json['name'] as String,
      gender: json['gender'] as String?,
      age: json['age'] as int?,
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      address: json['address'] as String?,
      medicalCondition: json['medical_condition'] as String?,
      notes: json['notes'] as String?,
      cancerType: json['cancer_type'] as String?,
      cancerStage: json['cancer_stage'] as String?,
      diagnosisDate: json['diagnosis_date'] != null
          ? DateTime.parse(json['diagnosis_date'] as String)
          : null,
      dateOfBirth: json['date_of_birth'] as String?,
      placeOfBirth: json['place_of_birth'] as String?,
      tribeEthnicity: json['tribe_ethnicity'] as String?,
      maritalStatus: json['marital_status'] as String?,
      occupation: json['occupation'] as String?,
      educationLevel: json['education_level'] as String?,
      religion: json['religion'] as String?,
      nationality: json['nationality'] as String?,
      nextOfKinName: json['next_of_kin_name'] as String?,
      nextOfKinPhone: json['next_of_kin_phone'] as String?,
      nextOfKinRelationship: json['next_of_kin_relationship'] as String?,
      nhifRegistered: json['nhif_registered'] as bool?,
      nhifNumber: json['nhif_number'] as String?,
      insuranceProvider: json['insurance_provider'] as String?,
      insuranceNumber: json['insurance_number'] as String?,
      bloodGroup: json['blood_group'] as String?,
      allergies: json['allergies'] as String?,
      chronicConditions: json['chronic_conditions'] as String?,
      currentMedications: json['current_medications'] as String?,
      familyCancerHistory: json['family_cancer_history'] as String?,
      smokingStatus: json['smoking_status'] as String?,
      alcoholUse: json['alcohol_use'] as String?,
      heightCm: json['height_cm'] as int?,
      weightKg: (json['weight_kg'] as num?)?.toDouble(),
      journeyStatus: json['journey_status'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'patient_code': patientCode,
      'name': name,
      'gender': gender,
      'age': age,
      'phone': phone,
      'email': email,
      'address': address,
      'medical_condition': medicalCondition,
      'notes': notes,
      'cancer_type': cancerType,
      'cancer_stage': cancerStage,
      'diagnosis_date': diagnosisDate?.toIso8601String(),
      'date_of_birth': dateOfBirth,
      'place_of_birth': placeOfBirth,
      'tribe_ethnicity': tribeEthnicity,
      'marital_status': maritalStatus,
      'occupation': occupation,
      'education_level': educationLevel,
      'religion': religion,
      'nationality': nationality,
      'next_of_kin_name': nextOfKinName,
      'next_of_kin_phone': nextOfKinPhone,
      'next_of_kin_relationship': nextOfKinRelationship,
      'nhif_registered': nhifRegistered,
      'nhif_number': nhifNumber,
      'insurance_provider': insuranceProvider,
      'insurance_number': insuranceNumber,
      'blood_group': bloodGroup,
      'allergies': allergies,
      'chronic_conditions': chronicConditions,
      'current_medications': currentMedications,
      'family_cancer_history': familyCancerHistory,
      'smoking_status': smokingStatus,
      'alcohol_use': alcoholUse,
      'height_cm': heightCm,
      'weight_kg': weightKg,
      'journey_status': journeyStatus,
      'created_at': createdAt?.toIso8601String(),
    };
  }

  Patient copyWith({
    int? id,
    String? patientCode,
    String? name,
    String? gender,
    int? age,
    String? phone,
    String? email,
    String? address,
    String? medicalCondition,
    String? notes,
    String? cancerType,
    String? cancerStage,
    DateTime? diagnosisDate,
    String? dateOfBirth,
    String? placeOfBirth,
    String? tribeEthnicity,
    String? maritalStatus,
    String? occupation,
    String? educationLevel,
    String? religion,
    String? nationality,
    String? nextOfKinName,
    String? nextOfKinPhone,
    String? nextOfKinRelationship,
    bool? nhifRegistered,
    String? nhifNumber,
    String? insuranceProvider,
    String? insuranceNumber,
    String? bloodGroup,
    String? allergies,
    String? chronicConditions,
    String? currentMedications,
    String? familyCancerHistory,
    String? smokingStatus,
    String? alcoholUse,
    int? heightCm,
    double? weightKg,
    String? journeyStatus,
    DateTime? createdAt,
  }) {
    return Patient(
      id: id ?? this.id,
      patientCode: patientCode ?? this.patientCode,
      name: name ?? this.name,
      gender: gender ?? this.gender,
      age: age ?? this.age,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      address: address ?? this.address,
      medicalCondition: medicalCondition ?? this.medicalCondition,
      notes: notes ?? this.notes,
      cancerType: cancerType ?? this.cancerType,
      cancerStage: cancerStage ?? this.cancerStage,
      diagnosisDate: diagnosisDate ?? this.diagnosisDate,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      placeOfBirth: placeOfBirth ?? this.placeOfBirth,
      tribeEthnicity: tribeEthnicity ?? this.tribeEthnicity,
      maritalStatus: maritalStatus ?? this.maritalStatus,
      occupation: occupation ?? this.occupation,
      educationLevel: educationLevel ?? this.educationLevel,
      religion: religion ?? this.religion,
      nationality: nationality ?? this.nationality,
      nextOfKinName: nextOfKinName ?? this.nextOfKinName,
      nextOfKinPhone: nextOfKinPhone ?? this.nextOfKinPhone,
      nextOfKinRelationship: nextOfKinRelationship ?? this.nextOfKinRelationship,
      nhifRegistered: nhifRegistered ?? this.nhifRegistered,
      nhifNumber: nhifNumber ?? this.nhifNumber,
      insuranceProvider: insuranceProvider ?? this.insuranceProvider,
      insuranceNumber: insuranceNumber ?? this.insuranceNumber,
      bloodGroup: bloodGroup ?? this.bloodGroup,
      allergies: allergies ?? this.allergies,
      chronicConditions: chronicConditions ?? this.chronicConditions,
      currentMedications: currentMedications ?? this.currentMedications,
      familyCancerHistory: familyCancerHistory ?? this.familyCancerHistory,
      smokingStatus: smokingStatus ?? this.smokingStatus,
      alcoholUse: alcoholUse ?? this.alcoholUse,
      heightCm: heightCm ?? this.heightCm,
      weightKg: weightKg ?? this.weightKg,
      journeyStatus: journeyStatus ?? this.journeyStatus,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  String toString() {
    return 'Patient(id: $id, patientCode: $patientCode, name: $name, cancerType: $cancerType)';
  }
}

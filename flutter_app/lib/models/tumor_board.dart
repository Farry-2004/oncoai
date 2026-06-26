class TumorBoard {
  final int? id;
  final int patientId;
  final DateTime scheduledDate;
  final String? chairperson;
  final String? status;
  final String? discussion;
  final String? recommendations;
  final String? outcome;
  final DateTime? followUpDate;
  final List<Map<String, dynamic>>? participants;
  final bool? checklistPatientSummary;
  final bool? checklistDiagnosticReview;
  final bool? checklistTreatmentConsiderations;
  final bool? checklistRecommendations;
  final bool? checklistFollowUpPlan;
  final String? voteResult;
  final List<Map<String, dynamic>>? attendance;
  final bool? cmeCreditsAwarded;
  final DateTime? createdAt;

  TumorBoard({
    this.id,
    required this.patientId,
    required this.scheduledDate,
    this.chairperson,
    this.status,
    this.discussion,
    this.recommendations,
    this.outcome,
    this.followUpDate,
    this.participants,
    this.checklistPatientSummary,
    this.checklistDiagnosticReview,
    this.checklistTreatmentConsiderations,
    this.checklistRecommendations,
    this.checklistFollowUpPlan,
    this.voteResult,
    this.attendance,
    this.cmeCreditsAwarded,
    this.createdAt,
  });

  factory TumorBoard.fromJson(Map<String, dynamic> json) {
    return TumorBoard(
      id: json['id'] as int?,
      patientId: json['patient_id'] as int,
      scheduledDate: DateTime.parse(json['scheduled_date'] as String),
      chairperson: json['chairperson'] as String?,
      status: json['status'] as String?,
      discussion: json['discussion'] as String?,
      recommendations: json['recommendations'] as String?,
      outcome: json['outcome'] as String?,
      followUpDate: json['follow_up_date'] != null
          ? DateTime.parse(json['follow_up_date'] as String)
          : null,
      participants: json['participants'] != null
          ? List<Map<String, dynamic>>.from(
              (json['participants'] as List).map(
                (e) => Map<String, dynamic>.from(e as Map),
              ),
            )
          : null,
      checklistPatientSummary: json['checklist_patient_summary'] as bool?,
      checklistDiagnosticReview: json['checklist_diagnostic_review'] as bool?,
      checklistTreatmentConsiderations:
          json['checklist_treatment_considerations'] as bool?,
      checklistRecommendations: json['checklist_recommendations'] as bool?,
      checklistFollowUpPlan: json['checklist_follow_up_plan'] as bool?,
      voteResult: json['vote_result'] as String?,
      attendance: json['attendance'] != null
          ? List<Map<String, dynamic>>.from(
              (json['attendance'] as List).map(
                (e) => Map<String, dynamic>.from(e as Map),
              ),
            )
          : null,
      cmeCreditsAwarded: json['cme_credits_awarded'] as bool?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'patient_id': patientId,
      'scheduled_date': scheduledDate.toIso8601String(),
      'chairperson': chairperson,
      'status': status,
      'discussion': discussion,
      'recommendations': recommendations,
      'outcome': outcome,
      'follow_up_date': followUpDate?.toIso8601String(),
      'participants': participants,
      'checklist_patient_summary': checklistPatientSummary,
      'checklist_diagnostic_review': checklistDiagnosticReview,
      'checklist_treatment_considerations': checklistTreatmentConsiderations,
      'checklist_recommendations': checklistRecommendations,
      'checklist_follow_up_plan': checklistFollowUpPlan,
      'vote_result': voteResult,
      'attendance': attendance,
      'cme_credits_awarded': cmeCreditsAwarded,
      'created_at': createdAt?.toIso8601String(),
    };
  }

  TumorBoard copyWith({
    int? id,
    int? patientId,
    DateTime? scheduledDate,
    String? chairperson,
    String? status,
    String? discussion,
    String? recommendations,
    String? outcome,
    DateTime? followUpDate,
    List<Map<String, dynamic>>? participants,
    bool? checklistPatientSummary,
    bool? checklistDiagnosticReview,
    bool? checklistTreatmentConsiderations,
    bool? checklistRecommendations,
    bool? checklistFollowUpPlan,
    String? voteResult,
    List<Map<String, dynamic>>? attendance,
    bool? cmeCreditsAwarded,
    DateTime? createdAt,
  }) {
    return TumorBoard(
      id: id ?? this.id,
      patientId: patientId ?? this.patientId,
      scheduledDate: scheduledDate ?? this.scheduledDate,
      chairperson: chairperson ?? this.chairperson,
      status: status ?? this.status,
      discussion: discussion ?? this.discussion,
      recommendations: recommendations ?? this.recommendations,
      outcome: outcome ?? this.outcome,
      followUpDate: followUpDate ?? this.followUpDate,
      participants: participants ?? this.participants,
      checklistPatientSummary:
          checklistPatientSummary ?? this.checklistPatientSummary,
      checklistDiagnosticReview:
          checklistDiagnosticReview ?? this.checklistDiagnosticReview,
      checklistTreatmentConsiderations: checklistTreatmentConsiderations ??
          this.checklistTreatmentConsiderations,
      checklistRecommendations:
          checklistRecommendations ?? this.checklistRecommendations,
      checklistFollowUpPlan:
          checklistFollowUpPlan ?? this.checklistFollowUpPlan,
      voteResult: voteResult ?? this.voteResult,
      attendance: attendance ?? this.attendance,
      cmeCreditsAwarded: cmeCreditsAwarded ?? this.cmeCreditsAwarded,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  String toString() {
    return 'TumorBoard(id: $id, patientId: $patientId, scheduledDate: $scheduledDate, status: $status)';
  }
}

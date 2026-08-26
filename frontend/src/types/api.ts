export type Role =
  | 'tumor_board_coordinator'
  | 'oncologist'
  | 'surgeon'
  | 'radiologist'
  | 'pathologist'
  | 'nurse'
  | 'medical_officer'
  | 'nutritionist'
  | 'social_worker'
  | 'dentist'
  | 'pharmacist'
  | 'administrator'

export interface User {
  id: string
  email: string
  full_name: string
  role: Role
  title?: string | null
  department?: string | null
  is_active: boolean
  created_at: string
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

export type PatientStatus =
  | 'new'
  | 'in_workup'
  | 'ready_for_board'
  | 'under_treatment'
  | 'follow_up'
  | 'discharged'

export type Sex = 'male' | 'female' | 'other'

export interface Patient {
  id: string
  mrn: string
  full_name: string
  date_of_birth: string
  sex: Sex
  phone?: string | null
  cancer_site: string
  histology?: string | null
  stage?: string | null
  status: PatientStatus
  priority: string
  primary_physician_id?: string | null
  primary_physician_name?: string | null
  facility: string
  is_demo: boolean
  created_at: string
  updated_at: string
}

export interface PatientListResponse {
  items: Patient[]
  total: number
  page: number
  page_size: number
}

export interface PatientCreateInput {
  mrn: string
  full_name: string
  date_of_birth: string
  sex: Sex
  phone?: string
  cancer_site: string
  histology?: string
  stage?: string
  status?: PatientStatus
  priority?: string
  primary_physician_id?: string | null
  facility: string
}

export type CasePriority = 'low' | 'medium' | 'high' | 'critical'
export type CaseStatus = 'pending' | 'presenting' | 'discussed' | 'deferred'
export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

export interface TumorBoardCase {
  id: string
  session_id: string
  patient_id: string
  patient?: Patient | null
  queue_position: number
  presenter_id?: string | null
  presenter_name?: string | null
  priority: CasePriority
  status: CaseStatus
  summary?: string | null
  ai_summary_demo?: string | null
  created_at: string
}

export interface TumorBoardSession {
  id: string
  title: string
  scheduled_at: string
  location?: string | null
  status: SessionStatus
  chair_id?: string | null
  chair_name?: string | null
  coordinator_id?: string | null
  coordinator_name?: string | null
  facility: string
  is_demo: boolean
}

export interface TumorBoardSessionDetail extends TumorBoardSession {
  cases: TumorBoardCase[]
}

export interface AuditLogEntry {
  id: string
  actor_id?: string | null
  actor_name?: string | null
  action: string
  entity_type: string
  entity_id?: string | null
  created_at: string
}

export interface DashboardSummary {
  active_patients: number
  open_cases: number
  critical_cases: number
  upcoming_boards: number
  next_board_at?: string | null
  incomplete_workups: number
  recent_cases: TumorBoardCase[]
  recent_activity: AuditLogEntry[]
}

export type WorkupItemType = 'imaging' | 'pathology' | 'labs' | 'genomics' | 'other'
export type WorkupStatus = 'ordered' | 'in_progress' | 'completed' | 'cancelled'

export interface WorkupItem {
  id: string
  patient_id: string
  item_type: WorkupItemType
  description: string
  status: WorkupStatus
  ordered_by_id?: string | null
  due_date?: string | null
  completed_at?: string | null
  created_at: string
}

export type RecordType = 'clinical_note' | 'imaging' | 'pathology' | 'lab' | 'treatment'

export interface PatientRecord {
  id: string
  patient_id: string
  record_type: RecordType
  title: string
  findings: string
  recorded_by_id?: string | null
  recorded_by_name?: string | null
  recorded_at: string
  created_at: string
}

export interface PatientRecordCreateInput {
  record_type: RecordType
  title: string
  findings: string
}

export type FollowUpStatus = 'scheduled' | 'completed' | 'missed' | 'cancelled'

export interface FollowUp {
  id: string
  patient_id: string
  follow_up_date: string
  status: FollowUpStatus
  notes?: string | null
  next_appointment_date?: string | null
  created_by_id?: string | null
  created_by_name?: string | null
  created_at: string
}

export type ConcernLevel = 'not_concerned' | 'somewhat_concerned' | 'very_concerned'
export type ConcernCategory = 'low' | 'moderate' | 'high'

export interface PatientConcerns {
  id: string
  patient_id: string
  transportation_barrier: boolean
  housing_barrier: boolean
  financial_barrier: boolean
  dependent_care_barrier: boolean
  other_barrier_notes?: string | null
  travel_concern: ConcernLevel
  financial_concern: ConcernLevel
  risk_tolerance_concern: ConcernLevel
  radiation_openness_concern: ConcernLevel
  concern_category: ConcernCategory
  updated_by_id?: string | null
  updated_by_name?: string | null
  updated_at: string
}

export interface PatientConcernsInput {
  transportation_barrier: boolean
  housing_barrier: boolean
  financial_barrier: boolean
  dependent_care_barrier: boolean
  other_barrier_notes?: string
  travel_concern: ConcernLevel
  financial_concern: ConcernLevel
  risk_tolerance_concern: ConcernLevel
  radiation_openness_concern: ConcernLevel
}

export type FamilyConferenceOutcome = 'proceeding' | 'needs_more_time' | 'declined'

export interface FamilyConference {
  id: string
  patient_id: string
  tumor_board_decision_id?: string | null
  conducted_at: string
  participants: string
  questions_raised?: string | null
  outcome: FamilyConferenceOutcome
  conducted_by_id?: string | null
  conducted_by_name?: string | null
  created_at: string
}

export interface FamilyConferenceCreateInput {
  participants: string
  questions_raised?: string
  outcome?: FamilyConferenceOutcome
  tumor_board_decision_id?: string
}

export interface TumorBoardAttendance {
  id: string
  session_id: string
  user_id: string
  user_name?: string | null
  user_role?: string | null
  cme_credit: number
  created_at: string
}

export interface FollowUpCreateInput {
  follow_up_date: string
  notes?: string
  next_appointment_date?: string
}

export type AnalysisType =
  | 'case_summary'
  | 'extract_clinical_facts'
  | 'missing_information'
  | 'timeline_analysis'
  | 'tumor_board_brief'
  | 'compare_evidence'
  | 'specialist_questions'
  | 'patient_explanation'
  | 'follow_up_summary'

export interface AIAnalysis {
  id: string
  patient_id: string
  analysis_type: AnalysisType
  content: string
  ok: boolean
  model_used: string
  requested_by_id?: string | null
  requested_by_name?: string | null
  created_at: string
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskStatus = 'pending' | 'in_progress' | 'complete'

export interface Task {
  id: string
  title: string
  description?: string | null
  patient_id?: string | null
  patient_name?: string | null
  tumor_board_case_id?: string | null
  assigned_to_id?: string | null
  assigned_to_name?: string | null
  priority: TaskPriority
  status: TaskStatus
  due_date?: string | null
  created_by_id?: string | null
  created_at: string
  comment_count: number
}

export interface TaskCreateInput {
  title: string
  description?: string
  patient_id?: string
  tumor_board_case_id?: string
  assigned_to_id?: string
  priority?: TaskPriority
  due_date?: string
}

export interface TaskComment {
  id: string
  task_id: string
  author_id?: string | null
  author_name?: string | null
  body: string
  created_at: string
}

export interface DiscussionChecklist {
  diagnosis_confirmed: boolean
  stage_confirmed: boolean
  pathology_reviewed: boolean
  imaging_reviewed: boolean
  treatment_history_reviewed: boolean
  patient_preferences_reviewed: boolean
  social_considerations_reviewed: boolean
  financial_considerations_reviewed: boolean
  treatment_options_discussed: boolean
  consensus_reached: boolean
}

export const EMPTY_CHECKLIST: DiscussionChecklist = {
  diagnosis_confirmed: false,
  stage_confirmed: false,
  pathology_reviewed: false,
  imaging_reviewed: false,
  treatment_history_reviewed: false,
  patient_preferences_reviewed: false,
  social_considerations_reviewed: false,
  financial_considerations_reviewed: false,
  treatment_options_discussed: false,
  consensus_reached: false,
}

export const CHECKLIST_LABELS: Record<keyof DiscussionChecklist, string> = {
  diagnosis_confirmed: 'Diagnosis confirmed',
  stage_confirmed: 'Stage confirmed',
  pathology_reviewed: 'Pathology reviewed',
  imaging_reviewed: 'Imaging reviewed',
  treatment_history_reviewed: 'Treatment history reviewed',
  patient_preferences_reviewed: 'Patient preferences reviewed',
  social_considerations_reviewed: 'Social considerations reviewed',
  financial_considerations_reviewed: 'Financial/access considerations reviewed',
  treatment_options_discussed: 'Treatment options discussed',
  consensus_reached: 'Consensus reached',
}

export interface TumorBoardDecision {
  id: string
  tumor_board_case_id: string
  checklist: DiscussionChecklist
  decision: string
  treatment_plan: string
  rationale: string
  additional_investigations?: string | null
  responsible_team: string
  follow_up_date?: string | null
  decided_by_id?: string | null
  decided_by_name?: string | null
  created_at: string
}

export interface TumorBoardDecisionCreateInput {
  checklist: DiscussionChecklist
  decision: string
  treatment_plan: string
  rationale: string
  additional_investigations?: string
  responsible_team: string
  follow_up_date?: string
}

export type ReportType =
  | 'tumor_board_report'
  | 'clinical_summary'
  | 'medical_passport'
  | 'treatment_plan'
  | 'follow_up_summary'

export type ReportStatus = 'draft' | 'approved'

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  tumor_board_report: 'Tumor Board Report',
  clinical_summary: 'Clinical Summary',
  medical_passport: 'Medical Passport',
  treatment_plan: 'Treatment Plan',
  follow_up_summary: 'Follow-up Summary',
}

export interface Report {
  id: string
  report_type: ReportType
  title: string
  patient_id?: string | null
  patient_name?: string | null
  tumor_board_session_id?: string | null
  content: string
  ai_sourced: boolean
  status: ReportStatus
  created_by_id?: string | null
  created_by_name?: string | null
  approved_by_id?: string | null
  approved_by_name?: string | null
  approved_at?: string | null
  created_at: string
  updated_at: string
}

export interface ReportGenerateInput {
  report_type: ReportType
  patient_id?: string
  tumor_board_session_id?: string
}

export interface ReportUpdateInput {
  title?: string
  content?: string
}

export interface BreakdownItem {
  key: string
  label: string
  value: number
}

export interface AnalyticsSummary {
  patients_registered: number
  cases_reviewed: number
  cases_awaiting_tb: number
  pending_investigations: number
  avg_workup_completion_days: number | null
  avg_diagnosis_to_tb_days: number | null
  avg_treatment_turnaround_days: number | null
  follow_up_completion_pct: number
  patients_by_cancer_site: BreakdownItem[]
  workup_by_status: BreakdownItem[]
  cases_by_priority: BreakdownItem[]
}

export interface Notification {
  id: string
  message: string
  link?: string | null
  read: boolean
  created_at: string
}

export interface SearchResultItem {
  id: string
  label: string
  sublabel?: string | null
  link: string
}

export interface SearchResults {
  patients: SearchResultItem[]
  tumor_boards: SearchResultItem[]
  specialists: SearchResultItem[]
  reports: SearchResultItem[]
}

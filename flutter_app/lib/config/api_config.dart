class ApiConfig {
  static const String defaultBaseUrl = 'https://oncoai-6ukk.onrender.com';
  static String baseUrl = defaultBaseUrl;

  static const String login = '/api/auth/login';
  static const String register = '/api/auth/register';
  static const String me = '/api/auth/me';
  static const String specialties = '/api/auth/specialties';
  static const String users = '/api/auth/users';
  static const String forgotPassword = '/api/auth/forgot-password';
  static const String resetPassword = '/api/auth/reset-password';

  static const String patients = '/api/patients';
  static String patient(int id) => '/api/patients/$id';

  static const String referrals = '/api/referrals';
  static String patientReferrals(int pid) => '/api/patients/$pid/referrals';

  static const String labResults = '/api/lab-results';
  static String patientLabResults(int pid) => '/api/patients/$pid/lab-results';

  static const String pathologyReports = '/api/pathology-reports';
  static String patientPathology(int pid) => '/api/patients/$pid/pathology-reports';

  static const String imagingResults = '/api/imaging-results';
  static String patientImaging(int pid) => '/api/patients/$pid/imaging-results';

  static const String recommendations = '/api/recommendations';
  static String patientRecommendations(int pid) => '/api/patients/$pid/recommendations';

  static const String tumorBoards = '/api/tumor-boards';
  static String patientTumorBoards(int pid) => '/api/patients/$pid/tumor-boards';
  static String joinTumorBoard(int tid) => '/api/tumor-boards/$tid/join';
  static String voteTumorBoard(int tid) => '/api/tumor-boards/$tid/vote';

  static String patientDocuments(int pid) => '/api/patients/$pid/documents';
  static String patientSummaries(int pid) => '/api/patients/$pid/summaries';
  static String patientWorkup(int pid) => '/api/patients/$pid/workup';
  static String patientSocioeconomic(int pid) => '/api/patients/$pid/socioeconomic';
  static String patientPreferences(int pid) => '/api/patients/$pid/preferences';
  static String patientTracking(int pid) => '/api/patients/$pid/tracking';
  static String boardSummary(int pid) => '/api/patients/$pid/board-summary';

  static const String orchestrate = '/api/orchestrate';
  static const String summarize = '/api/summarize';
  static const String health = '/api/health';

  static const String analyticsCancer = '/api/analytics/cancer-distribution';
  static const String analyticsJourney = '/api/analytics/journey-progress';
  static const String analyticsStage = '/api/analytics/stage-distribution';
  static const String analyticsWorkup = '/api/analytics/workup-completion';
  static const String analyticsTB = '/api/analytics/tb-stats';
  static const String analyticsDemographics = '/api/analytics/demographics';
  static const String analyticsTrends = '/api/analytics/trends';

  static const String adminAuditLogs = '/api/admin/audit-logs';
  static const String adminStats = '/api/admin/stats';
}

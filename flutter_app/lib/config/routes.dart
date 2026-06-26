import 'package:go_router/go_router.dart';
import '../screens/splash_screen.dart';
import '../screens/login_screen.dart';
import '../screens/register_screen.dart';
import '../screens/home_screen.dart';
import '../screens/patient_list_screen.dart';
import '../screens/patient_detail_screen.dart';
import '../screens/patient_form_screen.dart';
import '../screens/lab_entry_screen.dart';
import '../screens/tumor_board_list_screen.dart';
import '../screens/tumor_board_detail_screen.dart';
import '../screens/ai_orchestrator_screen.dart';
import '../screens/settings_screen.dart';
import '../screens/notifications_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/splash',
  routes: [
    GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
    GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
    GoRoute(path: '/patients', builder: (_, __) => const PatientListScreen()),
    GoRoute(
      path: '/patients/:id',
      builder: (_, state) => PatientDetailScreen(patientId: int.parse(state.pathParameters['id']!)),
    ),
    GoRoute(
      path: '/patients/new',
      builder: (_, __) => const PatientFormScreen(),
    ),
    GoRoute(
      path: '/patients/:id/edit',
      builder: (_, state) => PatientFormScreen(patientId: int.parse(state.pathParameters['id']!)),
    ),
    GoRoute(
      path: '/patients/:id/lab-entry',
      builder: (_, state) => LabEntryScreen(patientId: int.parse(state.pathParameters['id']!)),
    ),
    GoRoute(path: '/tumor-boards', builder: (_, __) => const TumorBoardListScreen()),
    GoRoute(
      path: '/tumor-boards/:id',
      builder: (_, state) => TumorBoardDetailScreen(boardId: int.parse(state.pathParameters['id']!)),
    ),
    GoRoute(path: '/ai', builder: (_, __) => const AIOrchestratorScreen()),
    GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
    GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
  ],
);

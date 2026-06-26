import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';
import '../providers/dashboard_provider.dart';
import '../widgets/stat_card.dart';
import '../widgets/chart_widgets.dart';
import '../services/api_service.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    ref.read(dashboardProvider.notifier).loadStats();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('OncoAI'),
        actions: [
          IconButton(
            icon: const Badge(label: Text('3'), child: Icon(Icons.notifications_outlined)),
            onPressed: () => context.push('/notifications'),
          ),
          IconButton(icon: const Icon(Icons.settings_outlined), onPressed: () => context.push('/settings')),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: [
          _DashboardTab(),
          _PatientsTab(),
          _ClinicalTab(),
          _TumorBoardTab(),
          _MoreTab(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), activeIcon: Icon(Icons.dashboard), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.people_outline), activeIcon: Icon(Icons.people), label: 'Patients'),
          BottomNavigationBarItem(icon: Icon(Icons.science_outlined), activeIcon: Icon(Icons.science), label: 'Clinical'),
          BottomNavigationBarItem(icon: Icon(Icons.groups_outlined), activeIcon: Icon(Icons.groups), label: 'TB'),
          BottomNavigationBarItem(icon: Icon(Icons.more_horiz), activeIcon: Icon(Icons.more_horiz), label: 'More'),
        ],
      ),
    );
  }
}

class _DashboardTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboard = ref.watch(dashboardProvider);
    final stats = dashboard.stats;

    return RefreshIndicator(
      onRefresh: () => ref.read(dashboardProvider.notifier).loadStats(),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [OncoAITheme.primary, OncoAITheme.primaryDark]),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Welcome to OncoAI', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 4),
                Text('AI-Powered Oncology Decision Support', style: TextStyle(color: Colors.white.withValues(alpha: 0.7))),
              ],
            ),
          ),
          const SizedBox(height: 16),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.5,
            children: [
              StatCard(title: 'Patients', value: '${stats['patients'] ?? 0}', icon: Icons.people, color: OncoAITheme.primary),
              StatCard(title: 'Referrals', value: '${stats['referrals'] ?? 0}', icon: Icons.send, color: OncoAITheme.info),
              StatCard(title: 'Lab Results', value: '${stats['lab_results'] ?? 0}', icon: Icons.science, color: OncoAITheme.success),
              StatCard(title: 'Imaging', value: '${stats['imaging_results'] ?? 0}', icon: Icons.image, color: OncoAITheme.warning),
            ],
          ),
          const SizedBox(height: 20),
          const Text('Analytics', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          if (dashboard.journeyProgress.isNotEmpty) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Patient Journey', style: TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    SizedBox(height: 200, child: JourneyBarChart(data: dashboard.journeyProgress)),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 12),
          if (dashboard.cancerDistribution.isNotEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Cancer Distribution', style: TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    SizedBox(height: 200, child: CancerPieChart(data: dashboard.cancerDistribution)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _PatientsTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const PatientListInline();
  }
}

class PatientListInline extends ConsumerStatefulWidget {
  const PatientListInline({super.key});
  @override
  ConsumerState<PatientListInline> createState() => _PatientListInlineState();
}

class _PatientListInlineState extends ConsumerState<PatientListInline> {
  final _searchCtrl = TextEditingController();
  List<dynamic> _patients = [];
  List<dynamic> _filtered = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final patients = await ref.read(patientListProvider.future);
      setState(() { _patients = patients; _filtered = patients; _loading = false; });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  void _filter(String query) {
    if (query.isEmpty) {
      setState(() => _filtered = _patients);
    } else {
      final q = query.toLowerCase();
      setState(() => _filtered = _patients.where((p) =>
        (p['name'] ?? '').toString().toLowerCase().contains(q) ||
        (p['patient_code'] ?? '').toString().toLowerCase().contains(q)
      ).toList());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: TextField(
            controller: _searchCtrl,
            onChanged: _filter,
            decoration: InputDecoration(
              hintText: 'Search patients...',
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _filtered.isEmpty
                  ? const Center(child: Text('No patients found'))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        itemCount: _filtered.length,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        itemBuilder: (_, i) {
                          final p = _filtered[i];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor: OncoAITheme.primary.withValues(alpha: 0.1),
                                child: Text((p['name'] ?? '?')[0].toUpperCase(), style: const TextStyle(color: OncoAITheme.primary, fontWeight: FontWeight.bold)),
                              ),
                              title: Text(p['name'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.w600)),
                              subtitle: Text('${p['patient_code'] ?? ''} ${p['cancer_type'] != null ? "• ${p['cancer_type']}" : ""}'),
                              trailing: _journeyBadge(p['journey_status'] ?? 'arrival'),
                              onTap: () => context.push('/patients/${p['id']}'),
                            ),
                          );
                        },
                      ),
                    ),
        ),
      ],
    );
  }

  Widget _journeyBadge(String status) {
    final colors = {
      'arrival': OncoAITheme.info, 'evaluation': OncoAITheme.warning,
      'in_treatment': OncoAITheme.success, 'tb_presented': OncoAITheme.primary,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: (colors[status] ?? Colors.grey).withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(status.replaceAll('_', ' '), style: TextStyle(fontSize: 11, color: colors[status] ?? Colors.grey, fontWeight: FontWeight.w500)),
    );
  }
}

final patientListProvider = FutureProvider<List<dynamic>>((ref) async {
  return await ApiService.instance.getData('/api/patients') as List;
});

class _ClinicalTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _QuickActionCard(icon: Icons.science, title: 'Lab Results', subtitle: 'View and enter lab results', onTap: () {}),
        _QuickActionCard(icon: Icons.biotech, title: 'Pathology Reports', subtitle: 'Structured pathology reports', onTap: () {}),
        _QuickActionCard(icon: Icons.image_search, title: 'Imaging Results', subtitle: 'CT, MRI, PET-CT, X-Ray', onTap: () {}),
        _QuickActionCard(icon: Icons.send, title: 'Referrals', subtitle: 'Manage referral letters', onTap: () {}),
        _QuickActionCard(icon: Icons.recommend, title: 'Recommendations', subtitle: 'Clinical recommendations', onTap: () {}),
      ],
    );
  }
}

class _TumorBoardTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.groups, size: 64, color: OncoAITheme.primary),
          const SizedBox(height: 16),
          const Text('Tumor Board', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          ElevatedButton.icon(
            onPressed: () => context.push('/tumor-boards'),
            icon: const Icon(Icons.list),
            label: const Text('View Meetings'),
          ),
        ],
      ),
    );
  }
}

class _MoreTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _QuickActionCard(icon: Icons.smart_toy, title: 'AI Orchestrator', subtitle: 'Run multi-agent analysis', onTap: () => context.push('/ai')),
        _QuickActionCard(icon: Icons.summarize, title: 'AI Summary', subtitle: 'Generate patient summaries', onTap: () {}),
        _QuickActionCard(icon: Icons.analytics, title: 'Analytics', subtitle: 'View system analytics', onTap: () {}),
        _QuickActionCard(icon: Icons.chat, title: 'WhatsApp', subtitle: 'Team communication', onTap: () {}),
        _QuickActionCard(icon: Icons.settings, title: 'Settings', subtitle: 'App settings & profile', onTap: () => context.push('/settings')),
      ],
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _QuickActionCard({required this.icon, required this.title, required this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(color: OncoAITheme.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: OncoAITheme.primary),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle, style: TextStyle(color: Colors.grey[600], fontSize: 13)),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}

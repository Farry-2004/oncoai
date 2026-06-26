import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/theme.dart';
import '../services/api_service.dart';
import '../widgets/journey_tracker.dart';

class PatientDetailScreen extends StatefulWidget {
  final int patientId;
  const PatientDetailScreen({super.key, required this.patientId});
  @override
  State<PatientDetailScreen> createState() => _PatientDetailScreenState();
}

class _PatientDetailScreenState extends State<PatientDetailScreen> with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  Map<String, dynamic>? _patient;
  List<dynamic> _labs = [];
  List<dynamic> _pathology = [];
  List<dynamic> _imaging = [];
  List<dynamic> _referrals = [];
  List<dynamic> _tumorBoards = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 5, vsync: this);
    _load();
  }

  Future<void> _load() async {
    try {
      final api = ApiService.instance;
      final results = await Future.wait([
        api.getData('/api/patients/${widget.patientId}'),
        api.getData('/api/patients/${widget.patientId}/lab-results').catchError((_) => []),
        api.getData('/api/patients/${widget.patientId}/pathology-reports').catchError((_) => []),
        api.getData('/api/patients/${widget.patientId}/imaging-results').catchError((_) => []),
        api.getData('/api/patients/${widget.patientId}/referrals').catchError((_) => []),
        api.getData('/api/patients/${widget.patientId}/tumor-boards').catchError((_) => []),
      ]);
      setState(() {
        _patient = results[0] as Map<String, dynamic>?; _labs = results[1] as List? ?? []; _pathology = results[2] as List? ?? [];
        _imaging = results[3] as List? ?? []; _referrals = results[4] as List? ?? []; _tumorBoards = results[5] as List? ?? [];
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  void dispose() { _tabCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    if (_loading) return Scaffold(appBar: AppBar(), body: const Center(child: CircularProgressIndicator()));
    if (_patient == null) return Scaffold(appBar: AppBar(), body: const Center(child: Text('Patient not found')));
    final p = _patient!;

    return Scaffold(
      appBar: AppBar(
        title: Text(p['name'] ?? 'Patient'),
        actions: [
          IconButton(icon: const Icon(Icons.edit), onPressed: () => context.push('/patients/${widget.patientId}/edit')),
          if (p['phone'] != null && p['phone'].toString().isNotEmpty)
            IconButton(icon: const Icon(Icons.chat), onPressed: () => _openWhatsApp(p['phone'])),
        ],
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            color: OncoAITheme.primary.withValues(alpha: 0.05),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: OncoAITheme.primary,
                  child: Text('${p['name']}'[0], style: const TextStyle(fontSize: 24, color: Colors.white, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(p['name'] ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      Text('${p['patient_code']} • ${p['gender'] ?? ''} • Age ${p['age'] ?? '-'}', style: TextStyle(color: Colors.grey[600])),
                      if (p['cancer_type'] != null) Text(p['cancer_type'], style: const TextStyle(color: OncoAITheme.primary, fontWeight: FontWeight.w500)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          JourneyTracker(currentStatus: p['journey_status'] ?? 'arrival'),
          TabBar(
            controller: _tabCtrl,
            isScrollable: true,
            labelColor: OncoAITheme.primary,
            tabs: const [
              Tab(text: 'Overview'), Tab(text: 'Labs'), Tab(text: 'Pathology'),
              Tab(text: 'Imaging'), Tab(text: 'TB Meetings'),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabCtrl,
              children: [
                _OverviewTab(patient: p, referrals: _referrals),
                _LabsTab(labs: _labs, patientId: widget.patientId),
                _ListTab(items: _pathology, titleKey: 'specimen_type', subtitleKey: 'diagnosis', statusKey: 'status'),
                _ListTab(items: _imaging, titleKey: 'study_type', subtitleKey: 'modality', statusKey: 'status'),
                _TBTab(boards: _tumorBoards),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/patients/${widget.patientId}/lab-entry'),
        child: const Icon(Icons.add),
      ),
    );
  }

  void _openWhatsApp(String phone) async {
    final url = Uri.parse('https://wa.me/${phone.replaceAll(RegExp(r'[^\d+]'), '')}');
    if (await canLaunchUrl(url)) await launchUrl(url, mode: LaunchMode.externalApplication);
  }
}

class _OverviewTab extends StatelessWidget {
  final Map<String, dynamic> patient;
  final List<dynamic> referrals;
  const _OverviewTab({required this.patient, required this.referrals});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _Section(title: 'Demographics', children: [
          _InfoRow('Date of Birth', patient['date_of_birth']),
          _InfoRow('Place of Birth', patient['place_of_birth']),
          _InfoRow('Nationality', patient['nationality']),
          _InfoRow('Marital Status', patient['marital_status']),
          _InfoRow('Occupation', patient['occupation']),
          _InfoRow('Education', patient['education_level']),
        ]),
        _Section(title: 'Medical', children: [
          _InfoRow('Cancer Type', patient['cancer_type']),
          _InfoRow('Cancer Stage', patient['cancer_stage']),
          _InfoRow('Blood Group', patient['blood_group']),
          _InfoRow('Allergies', patient['allergies']),
          _InfoRow('Chronic Conditions', patient['chronic_conditions']),
          _InfoRow('Medications', patient['current_medications']),
          _InfoRow('Smoking', patient['smoking_status']),
          _InfoRow('Alcohol', patient['alcohol_use']),
        ]),
        _Section(title: 'Insurance', children: [
          _InfoRow('NHIF', patient['nhif_registered'] == true ? 'Yes' : 'No'),
          _InfoRow('NHIF #', patient['nhif_number']),
          _InfoRow('Provider', patient['insurance_provider']),
        ]),
        _Section(title: 'Next of Kin', children: [
          _InfoRow('Name', patient['next_of_kin_name']),
          _InfoRow('Phone', patient['next_of_kin_phone']),
          _InfoRow('Relationship', patient['next_of_kin_relationship']),
        ]),
        if (referrals.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text('Referrals (${referrals.length})', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
          ...referrals.map((r) => Card(
            child: ListTile(
              title: Text(r['doctor_name'] ?? ''),
              subtitle: Text('${r['specialty'] ?? ''} • ${r['hospital'] ?? ''}'),
              trailing: _statusBadge(r['status'] ?? 'Pending'),
            ),
          )),
        ],
      ],
    );
  }

  Widget _statusBadge(String status) {
    final color = status == 'Completed' ? OncoAITheme.success : status == 'Accepted' ? OncoAITheme.info : OncoAITheme.warning;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(6)),
      child: Text(status, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w500)),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const _Section({required this.title, required this.children});
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
        ),
        Card(child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(children: children.where((c) => c is! _InfoRow || c.value != null).toList()),
        )),
        const SizedBox(height: 8),
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final dynamic value;
  const _InfoRow(this.label, this.value);
  @override
  Widget build(BuildContext context) {
    if (value == null || value.toString().isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 130, child: Text(label, style: TextStyle(color: Colors.grey[600], fontSize: 13))),
          Expanded(child: Text('$value', style: const TextStyle(fontWeight: FontWeight.w500))),
        ],
      ),
    );
  }
}

class _LabsTab extends StatelessWidget {
  final List<dynamic> labs;
  final int patientId;
  const _LabsTab({required this.labs, required this.patientId});

  @override
  Widget build(BuildContext context) {
    if (labs.isEmpty) return const Center(child: Text('No lab results'));
    return ListView.builder(
      itemCount: labs.length,
      padding: const EdgeInsets.all(12),
      itemBuilder: (_, i) {
        final l = labs[i];
        final status = l['status'] ?? 'Pending';
        final color = status == 'Critical' ? OncoAITheme.danger : status == 'High' ? OncoAITheme.warning :
                      status == 'Low' ? OncoAITheme.info : status == 'Normal' ? OncoAITheme.success : Colors.grey;
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: Container(
              width: 4, height: 40,
              decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2)),
            ),
            title: Text(l['test_name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text('Value: ${l['test_value'] ?? '-'} • Ref: ${l['reference_range'] ?? '-'}'),
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(6)),
              child: Text(status, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
            ),
          ),
        );
      },
    );
  }
}

class _ListTab extends StatelessWidget {
  final List<dynamic> items;
  final String titleKey;
  final String subtitleKey;
  final String statusKey;
  const _ListTab({required this.items, required this.titleKey, required this.subtitleKey, required this.statusKey});

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const Center(child: Text('No records'));
    return ListView.builder(
      itemCount: items.length,
      padding: const EdgeInsets.all(12),
      itemBuilder: (_, i) {
        final item = items[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            title: Text(item[titleKey] ?? 'N/A', style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text(item[subtitleKey] ?? ''),
            trailing: Text(item[statusKey] ?? '', style: TextStyle(color: Colors.grey[600], fontSize: 12)),
          ),
        );
      },
    );
  }
}

class _TBTab extends StatelessWidget {
  final List<dynamic> boards;
  const _TBTab({required this.boards});
  @override
  Widget build(BuildContext context) {
    if (boards.isEmpty) return const Center(child: Text('No tumor board meetings'));
    return ListView.builder(
      itemCount: boards.length,
      padding: const EdgeInsets.all(12),
      itemBuilder: (_, i) {
        final tb = boards[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: const Icon(Icons.groups, color: OncoAITheme.primary),
            title: Text('${tb['chairperson'] ?? 'Meeting'} - ${tb['status'] ?? ''}'),
            subtitle: Text(tb['scheduled_date'] ?? ''),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/tumor-boards/${tb['id']}'),
          ),
        );
      },
    );
  }
}

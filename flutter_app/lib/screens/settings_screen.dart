import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../providers/locale_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeProvider);
    final locale = ref.watch(localeProvider);
    final auth = ref.watch(authProvider);
    final isDark = themeMode == ThemeMode.dark;

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          if (auth.user != null) ...[
            Container(
              padding: const EdgeInsets.all(20),
              color: OncoAITheme.primary.withValues(alpha: 0.05),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: OncoAITheme.primary,
                    child: Text(auth.user!.fullName[0], style: const TextStyle(fontSize: 24, color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(auth.user!.fullName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        Text(auth.user!.email, style: TextStyle(color: Colors.grey[600])),
                        Text('${auth.user!.specialty} • ${auth.user!.role ?? ""}', style: TextStyle(color: Colors.grey[500], fontSize: 13)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
          const _SectionHeader('Appearance'),
          SwitchListTile(
            secondary: const Icon(Icons.dark_mode),
            title: const Text('Dark Mode'),
            value: isDark,
            onChanged: (_) => ref.read(themeProvider.notifier).toggleTheme(),
          ),
          ListTile(
            leading: const Icon(Icons.language),
            title: const Text('Language'),
            subtitle: Text(locale.languageCode == 'sw' ? 'Kiswahili' : 'English'),
            trailing: SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'en', label: Text('EN')),
                ButtonSegment(value: 'sw', label: Text('SW')),
              ],
              selected: {locale.languageCode},
              onSelectionChanged: (v) => ref.read(localeProvider.notifier).setLocale(Locale(v.first)),
            ),
          ),
          const _SectionHeader('Notifications'),
          SwitchListTile(secondary: const Icon(Icons.notifications), title: const Text('Lab Alerts'), value: true, onChanged: (_) {}),
          SwitchListTile(secondary: const Icon(Icons.calendar_today), title: const Text('TB Meeting Reminders'), value: true, onChanged: (_) {}),
          SwitchListTile(secondary: const Icon(Icons.volume_up), title: const Text('Sound'), value: true, onChanged: (_) {}),
          const _SectionHeader('About'),
          const ListTile(leading: Icon(Icons.info_outline), title: Text('Version'), subtitle: Text('1.0.0')),
          ListTile(leading: const Icon(Icons.shield_outlined), title: const Text('Privacy Policy'), onTap: () {}),
          const _SectionHeader('Account'),
          ListTile(
            leading: const Icon(Icons.logout, color: OncoAITheme.danger),
            title: const Text('Sign Out', style: TextStyle(color: OncoAITheme.danger)),
            onTap: () {
              ref.read(authProvider.notifier).logout();
              context.go('/login');
            },
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader(this.title);
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
      child: Text(title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.grey[500], letterSpacing: 1)),
    );
  }
}

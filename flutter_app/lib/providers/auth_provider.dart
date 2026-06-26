import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../config/api_config.dart';
import '../models/user.dart';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

class AuthState {
  final bool isLoggedIn;
  final bool isLoading;
  final User? user;
  final String? token;
  final String? error;

  const AuthState({
    this.isLoggedIn = false,
    this.isLoading = false,
    this.user,
    this.token,
    this.error,
  });

  AuthState copyWith({
    bool? isLoggedIn,
    bool? isLoading,
    User? user,
    String? token,
    String? error,
    bool clearError = false,
    bool clearUser = false,
  }) {
    return AuthState(
      isLoggedIn: isLoggedIn ?? this.isLoggedIn,
      isLoading: isLoading ?? this.isLoading,
      user: clearUser ? null : (user ?? this.user),
      token: token ?? this.token,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState());

  final Dio _dio = Dio(BaseOptions(baseUrl: ApiConfig.baseUrl));
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  static const String _tokenKey = 'auth_token';
  static const String _refreshTokenKey = 'refresh_token';

  // ---- helpers ----

  void _setAuthHeader(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  Future<void> _persistToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  Future<void> _clearTokens() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _refreshTokenKey);
    _dio.options.headers.remove('Authorization');
  }

  // ---- public API ----

  /// Check for a persisted session on app start.
  Future<void> checkAuth() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final token = await _storage.read(key: _tokenKey);
      if (token == null) {
        state = state.copyWith(isLoading: false, isLoggedIn: false);
        return;
      }
      _setAuthHeader(token);
      final response = await _dio.get(ApiConfig.me);
      final user = User.fromJson(response.data as Map<String, dynamic>);
      state = state.copyWith(
        isLoggedIn: true,
        isLoading: false,
        user: user,
        token: token,
      );
    } on DioException catch (e) {
      await _clearTokens();
      state = state.copyWith(
        isLoggedIn: false,
        isLoading: false,
        error: e.response?.data?['detail']?.toString() ?? 'Session expired',
        clearUser: true,
      );
    } catch (e) {
      await _clearTokens();
      state = state.copyWith(
        isLoggedIn: false,
        isLoading: false,
        error: e.toString(),
        clearUser: true,
      );
    }
  }

  /// Authenticate with email + password.
  Future<bool> login({required String email, required String password}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _dio.post(
        ApiConfig.login,
        data: {'email': email, 'password': password},
      );
      final data = response.data as Map<String, dynamic>;
      final token = data['access_token'] as String;
      await _persistToken(token);
      _setAuthHeader(token);

      // Fetch full user profile.
      final meResponse = await _dio.get(ApiConfig.me);
      final user = User.fromJson(meResponse.data as Map<String, dynamic>);

      state = state.copyWith(
        isLoggedIn: true,
        isLoading: false,
        user: user,
        token: token,
      );
      return true;
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.response?.data?['detail']?.toString() ?? 'Login failed',
      );
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  /// Register a new account.
  Future<bool> register({
    required String email,
    required String password,
    required String fullName,
    String? specialty,
    String? phone,
    String? institution,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _dio.post(
        ApiConfig.register,
        data: {
          'email': email,
          'password': password,
          'full_name': fullName,
          if (specialty != null) 'specialty': specialty,
          if (phone != null) 'phone': phone,
          if (institution != null) 'institution': institution,
        },
      );
      // Auto-login after registration.
      return await login(email: email, password: password);
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error:
            e.response?.data?['detail']?.toString() ?? 'Registration failed',
      );
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  /// Sign out and clear all persisted credentials.
  Future<void> logout() async {
    await _clearTokens();
    state = const AuthState();
  }

  /// Clear any displayed error.
  void clearError() {
    state = state.copyWith(clearError: true);
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (ref) => AuthNotifier(),
);

import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:oncoai/config/api_config.dart';
import 'package:oncoai/models/user.dart';
import 'package:oncoai/services/api_service.dart';

class AuthService {
  final ApiService _api = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  /// Login with email and password.
  /// Returns the user map on success, stores token and user in secure storage.
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _api.post(
        ApiConfig.login,
        data: {
          'email': email,
          'password': password,
        },
      );

      final data = response.data as Map<String, dynamic>;
      final token = data['access_token'] as String;
      final userJson = data['user'] as Map<String, dynamic>;

      await _storage.write(key: 'auth_token', value: token);
      await _storage.write(key: 'user', value: jsonEncode(userJson));

      return userJson;
    } on DioException {
      rethrow;
    }
  }

  /// Register a new user account.
  /// Returns the user map on success, stores token and user in secure storage.
  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    String? specialty,
    String? phone,
    String? institution,
  }) async {
    try {
      final response = await _api.post(
        ApiConfig.register,
        data: {
          'full_name': name,
          'email': email,
          'password': password,
          if (specialty != null) 'specialty': specialty,
          if (phone != null) 'phone': phone,
          if (institution != null) 'institution': institution,
        },
      );

      final data = response.data as Map<String, dynamic>;
      final token = data['access_token'] as String;
      final userJson = data['user'] as Map<String, dynamic>;

      await _storage.write(key: 'auth_token', value: token);
      await _storage.write(key: 'user', value: jsonEncode(userJson));

      return userJson;
    } on DioException {
      rethrow;
    }
  }

  /// Log the user out by clearing all stored credentials.
  Future<void> logout() async {
    await _storage.delete(key: 'auth_token');
    await _storage.delete(key: 'user');
  }

  /// Read the stored authentication token.
  Future<String?> getToken() async {
    return await _storage.read(key: 'auth_token');
  }

  /// Read the stored user as a [User] model.
  Future<User?> getCurrentUser() async {
    final userStr = await _storage.read(key: 'user');
    if (userStr == null) return null;
    try {
      final json = jsonDecode(userStr) as Map<String, dynamic>;
      return User.fromJson(json);
    } catch (_) {
      return null;
    }
  }

  /// Check whether a valid token exists in secure storage.
  Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: 'auth_token');
    return token != null && token.isNotEmpty;
  }

  /// Request a password-reset email for the given address.
  Future<void> forgotPassword(String email) async {
    try {
      await _api.post(
        ApiConfig.forgotPassword,
        data: {'email': email},
      );
    } on DioException {
      rethrow;
    }
  }
}

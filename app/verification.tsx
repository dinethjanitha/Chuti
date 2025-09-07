import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft,
  Mail,
  Shield,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { verificationApi } from '@/services/api';

export default function EmailVerificationScreen() {
  const { user, refreshUser } = useAuth();
  const params = useLocalSearchParams();
  
  const [userCode, setUserCode] = useState('');
  const [parentCode, setParentCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({
    emailVerified: false,
    parentEmailVerified: false,
    verificationStatus: 'pending',
    needsParentVerification: false
  });

  const requiresParentVerification = user?.parentEmail && user?.age < 13;

  useEffect(() => {
    if (user?.id) {
      fetchVerificationStatus();
    }
  }, [user?.id]);

  const fetchVerificationStatus = async () => {
    if (!user || !user.id) return;
    try {
      const response = await verificationApi.getVerificationStatus(user.id);
      setVerificationStatus(response.data);
    } catch (error) {
      console.error('Error fetching verification status:', error);
    }
  };

  const handleVerifyEmail = async (type: 'user_email' | 'parent_email') => {
    if (!user?.id) return;
    
    const code = type === 'user_email' ? userCode : parentCode;
    const email = type === 'user_email' ? user?.email : user?.parentEmail;

    if (!code || code.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    if (!email) {
      Alert.alert('Error', 'Email not found');
      return;
    }

    try {
      setIsLoading(true);
      const response = await verificationApi.verifyEmail(user.id, email, code, type);
      
      // Update local verification status
      await fetchVerificationStatus();
      await refreshUser();

      Alert.alert(
        'Success!', 
        `${type === 'user_email' ? 'Your email' : 'Parent email'} has been verified successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (response.data.verificationComplete) {
                Alert.alert(
                  'Welcome to Chuti! 🎉',
                  'Your account is now fully verified and ready to use!',
                  [
                    {
                      text: 'Get Started',
                      onPress: () => router.replace('/(tabs)')
                    }
                  ]
                );
              }
            }
          }
        ]
      );

      // Clear the code input
      if (type === 'user_email') {
        setUserCode('');
      } else {
        setParentCode('');
      }

    } catch (error: any) {
      Alert.alert('Verification Failed', error.response?.data?.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async (type: 'user_email' | 'parent_email') => {
    if (!user?.id) return;
    
    const email = type === 'user_email' ? user?.email : user?.parentEmail;

    if (!email) {
      Alert.alert('Error', 'Email not found');
      return;
    }

    try {
      setIsResending(true);
      await verificationApi.resendVerificationCode(user.id, email, type);
      Alert.alert('Code Sent', `A new verification code has been sent to ${email}`);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => {
    Alert.alert(
      'Verification Required',
      'You need to verify your email to continue using Chuti. Are you sure you want to go back?',
      [
        { text: 'Stay Here', style: 'cancel' },
        { text: 'Go Back', style: 'destructive', onPress: () => router.back() }
      ]
    );
  };

  const getOverallStatus = () => {
    if (verificationStatus.verificationStatus === 'complete') {
      return { text: 'Fully Verified', color: '#4CAF50', icon: CheckCircle };
    } else if (verificationStatus.verificationStatus === 'partial') {
      return { text: 'Partially Verified', color: '#FF9800', icon: Clock };
    } else {
      return { text: 'Pending Verification', color: '#F44336', icon: Clock };
    }
  };

  const status = getOverallStatus();
  const StatusIcon = status.icon;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Email Verification</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <StatusIcon size={32} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.text}
          </Text>
          <Text style={styles.statusDescription}>
            {verificationStatus.verificationStatus === 'complete' 
              ? 'Your account is ready to use!'
              : requiresParentVerification 
                ? 'Verify both your email and parent email to activate your account'
                : 'Verify your email to activate your account'
            }
          </Text>
        </View>

        {/* User Email Verification */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Mail size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Your Email</Text>
            {verificationStatus.emailVerified && (
              <CheckCircle size={20} color="#4CAF50" />
            )}
          </View>
          
          <Text style={styles.emailText}>{user?.email}</Text>
          
          {!verificationStatus.emailVerified ? (
            <>
              <Text style={styles.instructionText}>
                Enter the 6-digit code sent to your email:
              </Text>
              
              <TextInput
                style={styles.codeInput}
                value={userCode}
                onChangeText={setUserCode}
                placeholder="000000"
                keyboardType="numeric"
                maxLength={6}
                placeholderTextColor="#999"
              />
              
              <TouchableOpacity
                style={[styles.verifyButton, (!userCode || userCode.length !== 6 || isLoading) && styles.disabledButton]}
                onPress={() => handleVerifyEmail('user_email')}
                disabled={!userCode || userCode.length !== 6 || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify Email</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.resendButton}
                onPress={() => handleResendCode('user_email')}
                disabled={isResending}
              >
                <RefreshCw size={16} color="#007AFF" />
                <Text style={styles.resendButtonText}>
                  {isResending ? 'Sending...' : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.verifiedContainer}>
              <CheckCircle size={24} color="#4CAF50" />
              <Text style={styles.verifiedText}>Email Verified!</Text>
            </View>
          )}
        </View>

        {/* Parent Email Verification */}
        {requiresParentVerification && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shield size={24} color="#FF6B6B" />
              <Text style={styles.sectionTitle}>Parent Email</Text>
              {verificationStatus.parentEmailVerified && (
                <CheckCircle size={20} color="#4CAF50" />
              )}
            </View>
            
            <Text style={styles.emailText}>{user?.parentEmail}</Text>
            
            {!verificationStatus.parentEmailVerified ? (
              <>
                <Text style={styles.instructionText}>
                  Ask your parent for the 6-digit code sent to their email:
                </Text>
                
                <TextInput
                  style={styles.codeInput}
                  value={parentCode}
                  onChangeText={setParentCode}
                  placeholder="000000"
                  keyboardType="numeric"
                  maxLength={6}
                  placeholderTextColor="#999"
                />
                
                <TouchableOpacity
                  style={[styles.verifyButton, styles.parentVerifyButton, (!parentCode || parentCode.length !== 6 || isLoading) && styles.disabledButton]}
                  onPress={() => handleVerifyEmail('parent_email')}
                  disabled={!parentCode || parentCode.length !== 6 || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.verifyButtonText}>Verify Parent Email</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={() => handleResendCode('parent_email')}
                  disabled={isResending}
                >
                  <RefreshCw size={16} color="#FF6B6B" />
                  <Text style={[styles.resendButtonText, { color: '#FF6B6B' }]}>
                    {isResending ? 'Sending...' : 'Resend Parent Code'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.verifiedContainer}>
                <CheckCircle size={24} color="#4CAF50" />
                <Text style={styles.verifiedText}>Parent Email Verified!</Text>
              </View>
            )}
          </View>
        )}

        {/* Continue Button */}
        {verificationStatus.verificationStatus === 'complete' && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.continueButtonText}>Continue to Chuti</Text>
          </TouchableOpacity>
        )}

        {/* Help Text */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <Text style={styles.helpText}>
            • Check your spam/junk folder for verification emails
          </Text>
          <Text style={styles.helpText}>
            • Make sure the email addresses are correct
          </Text>
          <Text style={styles.helpText}>
            • Verification codes expire after 15 minutes
          </Text>
          <Text style={styles.helpText}>
            • Contact support@chuti.com if you need assistance
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 12,
    flex: 1,
  },
  emailText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000000', // Explicit black color for text
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  parentVerifyButton: {
    backgroundColor: '#FF6B6B',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  resendButtonText: {
    color: '#007AFF',
    fontSize: 14,
    marginLeft: 8,
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
  },
  verifiedText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 20,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  helpSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
});
